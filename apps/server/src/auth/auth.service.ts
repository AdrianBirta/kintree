import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { randomBytes, createHash } from 'crypto';
import { UsersService, SocialIdField } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { ResendVerificationDto } from './dto/resend-verification.dto';
import { Role } from '@prisma/client';
import { InvitesService } from 'src/invites/invites.service';
import { MailService } from 'src/mail/mail.service';
import { SocialProfile, SocialLoginError } from './social/social-profile';
import { frontendUrl } from './social/social.config';

// convertește un string gen "15m", "7d", "1h" în milisecunde, ca să calculăm expiresAt
function parseDurationToMs(duration: string): number {
  const match = /^(\d+)\s*(s|m|h|d)$/.exec(duration.trim());
  if (!match) return 7 * 24 * 60 * 60 * 1000; // fallback: 7 zile
  const value = Number(match[1]);
  const unit = match[2];
  const unitMs: Record<string, number> = { s: 1000, m: 60_000, h: 3_600_000, d: 86_400_000 };
  return value * unitMs[unit];
}

const SOCIAL_ID_FIELD: Record<SocialProfile['provider'], SocialIdField> = {
  google: 'googleId',
  facebook: 'facebookId',
  yahoo: 'yahooId',
};

const SOCIAL_CODE_TTL_MS = 60_000;
const PASSWORD_RESET_TTL_MS = 60 * 60 * 1000; // 1 oră
const EMAIL_VERIFY_TTL_MS = 24 * 60 * 60 * 1000; // 24 de ore
const VERIFY_RESEND_COOLDOWN_MS = 60_000; // minim 60 s între două emailuri pentru aceeași adresă

const sha256 = (value: string) => createHash('sha256').update(value).digest('hex');

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  // coduri de unică folosință pentru social login (code -> userId).
  // In-memory: ok pentru o singură instanță de backend. Dacă rulezi mai multe
  // instanțe, mută-le într-un tabel DB sau în Redis.
  private socialCodes = new Map<string, { userId: string; expiresAt: number }>();

  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private invitesService: InvitesService,
    private mailService: MailService,
  ) { }

  private async generateTokens(userId: string, email: string, role: Role) {
    const payload = { sub: userId, email, role };

    const accessToken = this.jwtService.sign(payload, {
      secret: process.env.JWT_ACCESS_SECRET,
      expiresIn: process.env.JWT_ACCESS_EXPIRES_IN as `${number}${'s' | 'm' | 'h' | 'd'}`,
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret: process.env.JWT_REFRESH_SECRET,
      expiresIn: process.env.JWT_REFRESH_EXPIRES_IN as `${number}${'s' | 'm' | 'h' | 'd'}`,
    });

    return { accessToken, refreshToken };
  }

  private async storeRefreshToken(userId: string, refreshToken: string) {
    const hash = await bcrypt.hash(refreshToken, 10);
    const expiresInMs = parseDurationToMs(process.env.JWT_REFRESH_EXPIRES_IN ?? '7d');
    const expiresAt = new Date(Date.now() + expiresInMs);
    await this.usersService.createRefreshToken(userId, hash, expiresAt);
  }

  private toPublicUser(user: { id: string; email: string; firstName: string; lastName: string; role: Role }) {
    return { id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName, role: user.role };
  }

  // ─────────── ÎNREGISTRARE + CONFIRMARE EMAIL ───────────

  // creează cererea în așteptare și trimite emailul cu link
  private async createPendingAndSendEmail(
    pending: { email: string; passwordHash: string; firstName: string; lastName: string; inviteToken?: string },
    lang?: string,
  ) {
    const token = randomBytes(32).toString('base64url');
    await this.usersService.createPendingRegistration({
      ...pending,
      tokenHash: sha256(token), // în DB păstrăm doar hash-ul
      expiresAt: new Date(Date.now() + EMAIL_VERIFY_TTL_MS),
    });

    const link = `${frontendUrl()}/verify-email?token=${encodeURIComponent(token)}`;

    // nu așteptăm trimiterea: răspunsul rămâne rapid
    void this.mailService
      .sendVerifyEmail(pending.email, pending.firstName, link, lang)
      .catch((err) => this.logger.error(`Trimiterea emailului de confirmare a eșuat: ${err.message}`));
  }

  async register(dto: RegisterDto) {
    const email = dto.email.trim().toLowerCase();

    const existing = await this.usersService.findByEmailInsensitive(email);
    if (existing) {
      throw new ConflictException('Există deja un cont cu acest email.');
    }

    await this.usersService.deleteExpiredPendingRegistrations();

    // anti-spam: dacă tocmai a fost trimis un email pentru această adresă, nu mai trimitem altul
    const latest = await this.usersService.findLatestPendingRegistrationByEmail(email);
    if (latest && Date.now() - latest.createdAt.getTime() < VERIFY_RESEND_COOLDOWN_MS) {
      return { success: true, requiresVerification: true };
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);
    await this.createPendingAndSendEmail(
      {
        email,
        passwordHash,
        firstName: dto.firstName.trim(),
        lastName: dto.lastName.trim(),
        inviteToken: dto.inviteToken,
      },
      dto.lang,
    );

    return { success: true, requiresVerification: true };
  }

  // linkul din email: creează contul și îl autentifică
  async verifyEmail(dto: VerifyEmailDto) {
    const invalid = () => new BadRequestException('Linkul de confirmare este invalid sau a expirat.');

    const pending = await this.usersService.findPendingRegistrationByTokenHash(sha256(dto.token));
    if (!pending || pending.expiresAt.getTime() < Date.now()) throw invalid();

    // consumăm cererea ÎNAINTE de orice altceva: la cereri simultane, doar una trece
    const consumed = await this.usersService.consumePendingRegistration(pending.id);
    if (consumed === 0) throw invalid();

    const existing = await this.usersService.findByEmailInsensitive(pending.email);
    if (existing) {
      // contul a apărut între timp (ex. prin Google): nu creăm duplicat
      throw new ConflictException('Există deja un cont cu acest email.');
    }

    const user = await this.usersService.create({
      email: pending.email,
      password: pending.passwordHash,
      firstName: pending.firstName,
      lastName: pending.lastName,
      role: Role.USER,
    });

    // curățăm restul cererilor în așteptare pentru aceeași adresă
    await this.usersService.deletePendingRegistrationsForEmail(pending.email);

    // invitația nu mai blochează contul dacă între timp a expirat
    if (pending.inviteToken) {
      try {
        await this.invitesService.consumeInvite(pending.inviteToken, user.id);
      } catch {
        // ignorăm
      }
    }

    const tokens = await this.generateTokens(user.id, user.email, user.role);
    await this.storeRefreshToken(user.id, tokens.refreshToken);

    return { ...tokens, user: this.toPublicUser(user) };
  }

  // Răspunde ÎNTOTDEAUNA la fel, ca să nu se poată afla ce emailuri au înregistrări în curs.
  async resendVerification(dto: ResendVerificationDto) {
    const email = dto.email.trim().toLowerCase();
    const latest = await this.usersService.findLatestPendingRegistrationByEmail(email);

    if (
      latest &&
      latest.expiresAt.getTime() > Date.now() &&
      Date.now() - latest.createdAt.getTime() >= VERIFY_RESEND_COOLDOWN_MS
    ) {
      await this.createPendingAndSendEmail(
        {
          email: latest.email,
          passwordHash: latest.passwordHash,
          firstName: latest.firstName,
          lastName: latest.lastName,
          inviteToken: latest.inviteToken ?? undefined,
        },
        dto.lang,
      );
    }

    return { success: true };
  }

  async login(dto: LoginDto) {
    const user = await this.usersService.findByEmailInsensitive(dto.email.trim());
    if (!user) {
      throw new UnauthorizedException('Email sau parolă incorecte.');
    }

    // cont creat doar prin social login, fără parolă
    if (!user.password) {
      throw new UnauthorizedException(
        'Acest cont a fost creat cu Google, Facebook sau Yahoo. Folosește butonul corespunzător pentru a te autentifica.',
      );
    }

    const passwordMatches = await bcrypt.compare(dto.password, user.password);
    if (!passwordMatches) {
      throw new UnauthorizedException('Email sau parolă incorecte.');
    }

    const tokens = await this.generateTokens(user.id, user.email, user.role);
    await this.storeRefreshToken(user.id, tokens.refreshToken);

    return { ...tokens, user: this.toPublicUser(user) };
  }

  async refresh(userId: string, refreshToken: string) {
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new UnauthorizedException('Sesiune invalidă.');
    }

    const validTokens = await this.usersService.findValidRefreshTokens(userId);
    let matchedTokenId: string | null = null;

    for (const record of validTokens) {
      const matches = await bcrypt.compare(refreshToken, record.tokenHash);
      if (matches) {
        matchedTokenId = record.id;
        break;
      }
    }

    if (!matchedTokenId) {
      throw new UnauthorizedException('Sesiune invalidă sau expirată.');
    }

    await this.usersService.deleteRefreshTokenById(matchedTokenId);

    const tokens = await this.generateTokens(user.id, user.email, user.role);
    await this.storeRefreshToken(user.id, tokens.refreshToken);

    return tokens;
  }

  async logout(userId: string, refreshToken?: string) {
    if (!refreshToken) {
      await this.usersService.deleteAllRefreshTokensForUser(userId);
      return { success: true };
    }

    const validTokens = await this.usersService.findValidRefreshTokens(userId);
    for (const record of validTokens) {
      const matches = await bcrypt.compare(refreshToken, record.tokenHash);
      if (matches) {
        await this.usersService.deleteRefreshTokenById(record.id);
        break;
      }
    }

    return { success: true };
  }

  async getCurrentUser(userId: string) {
    const user = await this.usersService.findById(userId);
    if (!user) throw new UnauthorizedException();
    return this.toPublicUser(user);
  }

  // ─────────── RESET PAROLĂ ───────────

  // Răspunde ÎNTOTDEAUNA la fel, indiferent dacă emailul există sau nu,
  // ca nimeni să nu poată afla ce emailuri au cont la noi.
  async forgotPassword(dto: ForgotPasswordDto) {
    const user = await this.usersService.findByEmailInsensitive(dto.email.trim());

    if (user) {
      const token = randomBytes(32).toString('base64url');
      await this.usersService.createPasswordResetToken(
        user.id,
        sha256(token), // în DB păstrăm doar hash-ul
        new Date(Date.now() + PASSWORD_RESET_TTL_MS),
      );

      const link = `${frontendUrl()}/reset-password?token=${encodeURIComponent(token)}`;

      void this.mailService
        .sendPasswordReset(user.email, user.firstName, link, dto.lang)
        .catch((err) => this.logger.error(`Trimiterea emailului de resetare a eșuat: ${err.message}`));
    }

    return { success: true };
  }

  async resetPassword(dto: ResetPasswordDto) {
    const invalid = () => new BadRequestException('Linkul de resetare este invalid sau a expirat.');

    const record = await this.usersService.findPasswordResetToken(sha256(dto.token));
    if (!record || record.expiresAt.getTime() < Date.now()) throw invalid();

    // consumăm tokenul ÎNAINTE de orice altceva: dacă două cereri vin simultan, doar una trece
    const consumed = await this.usersService.consumePasswordResetToken(record.id);
    if (consumed === 0) throw invalid();

    const hashedPassword = await bcrypt.hash(dto.password, 10);
    await this.usersService.updatePassword(record.userId, hashedPassword);

    // securitate: deconectăm toate sesiunile existente ale contului
    await this.usersService.deleteAllRefreshTokensForUser(record.userId);

    return { success: true };
  }

  // ─────────── SOCIAL LOGIN ───────────

  private async findOrCreateSocialUser(profile: SocialProfile, inviteToken?: string) {
    const field = SOCIAL_ID_FIELD[profile.provider];

    // 1) cont deja legat de acest provider
    const bySocial = await this.usersService.findBySocialId(field, profile.providerId);
    if (bySocial) return bySocial;

    // fără email nu putem crea cont (emailul e cheia pentru partajări și invitații)
    if (!profile.email) throw new SocialLoginError('social_no_email');

    // 2) cont existent cu același email -> îl legăm, DOAR dacă emailul e verificat de provider
    const existing = await this.usersService.findByEmailInsensitive(profile.email);
    if (existing) {
      if (!profile.emailVerified) throw new SocialLoginError('social_email_unverified');
      if (existing[field] && existing[field] !== profile.providerId) throw new SocialLoginError('social_failed');
      return this.usersService.linkSocialAccount(existing.id, field, profile.providerId);
    }

    // 3) cont nou
    const created = await this.usersService.createSocialUser({
      email: profile.email,
      firstName: profile.firstName || profile.email.split('@')[0],
      // lastName e obligatoriu în schema; "-" evită inițiale "undefined" în UI
      lastName: profile.lastName || '-',
      avatarUrl: profile.avatarUrl,
      field,
      providerId: profile.providerId,
    });

    // invitația se consumă doar pentru conturi noi; dacă e invalidă, nu blocăm autentificarea
    if (inviteToken) {
      try {
        await this.invitesService.consumeInvite(inviteToken, created.id);
      } catch {
        // ignorăm
      }
    }

    return created;
  }

  // apelat din callback-ul OAuth: returnează un cod de unică folosință
  async createSocialLoginCode(profile: SocialProfile, inviteToken?: string): Promise<string> {
    const user = await this.findOrCreateSocialUser(profile, inviteToken);

    const now = Date.now();
    for (const [key, value] of this.socialCodes) {
      if (value.expiresAt < now) this.socialCodes.delete(key);
    }

    const code = randomBytes(32).toString('base64url');
    this.socialCodes.set(code, { userId: user.id, expiresAt: now + SOCIAL_CODE_TTL_MS });
    return code;
  }

  // apelat de front: schimbă codul pe token-uri (folosibil o singură dată)
  async exchangeSocialCode(code: string) {
    const entry = this.socialCodes.get(code);
    this.socialCodes.delete(code);

    if (!entry || entry.expiresAt < Date.now()) {
      throw new UnauthorizedException('Cod de autentificare invalid sau expirat.');
    }

    const user = await this.usersService.findById(entry.userId);
    if (!user) throw new UnauthorizedException('Cont inexistent.');

    const tokens = await this.generateTokens(user.id, user.email, user.role);
    await this.storeRefreshToken(user.id, tokens.refreshToken);

    return { ...tokens, user: this.toPublicUser(user) };
  }
}