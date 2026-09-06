import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { Role } from '@prisma/client';

// convertește un string gen "15m", "7d", "1h" în milisecunde, ca să calculăm expiresAt
function parseDurationToMs(duration: string): number {
  const match = /^(\d+)\s*(s|m|h|d)$/.exec(duration.trim());
  if (!match) return 7 * 24 * 60 * 60 * 1000; // fallback: 7 zile
  const value = Number(match[1]);
  const unit = match[2];
  const unitMs: Record<string, number> = { s: 1000, m: 60_000, h: 3_600_000, d: 86_400_000 };
  return value * unitMs[unit];
}

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
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

  // NOU — creează o sesiune nouă (rând nou în refresh_tokens), nu mai
  // suprascrie o sesiune existentă. Astfel poți fi logat simultan pe telefon
  // și pe laptop fără să te "deconecteze" unul pe celălalt.
  private async storeRefreshToken(userId: string, refreshToken: string) {
    const hash = await bcrypt.hash(refreshToken, 10);
    const expiresInMs = parseDurationToMs(process.env.JWT_REFRESH_EXPIRES_IN ?? '7d');
    const expiresAt = new Date(Date.now() + expiresInMs);
    await this.usersService.createRefreshToken(userId, hash, expiresAt);
  }

  async register(dto: RegisterDto) {
    const existing = await this.usersService.findByEmail(dto.email);
    if (existing) {
      throw new ConflictException('Există deja un cont cu acest email.');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);
    const role: Role = Role.USER;

    const user = await this.usersService.create({
      email: dto.email,
      password: hashedPassword,
      firstName: dto.firstName,
      lastName: dto.lastName,
      role,
    });

    const tokens = await this.generateTokens(user.id, user.email, user.role);
    await this.storeRefreshToken(user.id, tokens.refreshToken);

    return {
      ...tokens,
      user: { id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName, role: user.role },
    };
  }

  async login(dto: LoginDto) {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user) {
      throw new UnauthorizedException('Email sau parolă incorecte.');
    }

    const passwordMatches = await bcrypt.compare(dto.password, user.password);
    if (!passwordMatches) {
      throw new UnauthorizedException('Email sau parolă incorecte.');
    }

    const tokens = await this.generateTokens(user.id, user.email, user.role);
    await this.storeRefreshToken(user.id, tokens.refreshToken);

    return {
      ...tokens,
      user: { id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName, role: user.role },
    };
  }

  // NOU — caută token-ul printre TOATE sesiunile valide ale userului (nu
  // doar una singură), șterge sesiunea folosită (rotation) și creează una nouă.
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

    // rotation: ștergem token-ul folosit, generăm unul nou pentru aceeași sesiune
    await this.usersService.deleteRefreshTokenById(matchedTokenId);

    const tokens = await this.generateTokens(user.id, user.email, user.role);
    await this.storeRefreshToken(user.id, tokens.refreshToken);

    return tokens;
  }

  // NOU — logout deconectează DOAR sesiunea curentă (dacă avem refresh
  // token-ul ei), nu toate dispozitivele. Dacă nu-l avem, deconectăm peste tot.
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
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
    };
  }
}