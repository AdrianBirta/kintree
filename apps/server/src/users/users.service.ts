import { Injectable, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Role, Prisma } from '@prisma/client';

export type SocialIdField = 'googleId' | 'facebookId' | 'yahooId';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) { }

  findByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email } });
  }

  // pentru login, înregistrare, social login și reset parolă,
  // ca "Ion@x.com" și "ion@x.com" să nu devină 2 conturi
  findByEmailInsensitive(email: string) {
    return this.prisma.user.findFirst({
      where: { email: { equals: email, mode: 'insensitive' } },
    });
  }

  findById(id: string) {
    return this.prisma.user.findUnique({ where: { id } });
  }

  findBySocialId(field: SocialIdField, providerId: string) {
    return this.prisma.user.findFirst({ where: { [field]: providerId } as Prisma.UserWhereInput });
  }

  // cont creat direct din social login (fără parolă)
  createSocialUser(data: {
    email: string;
    firstName: string;
    lastName: string;
    avatarUrl: string | null;
    field: SocialIdField;
    providerId: string;
  }) {
    return this.prisma.user.create({
      data: {
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName,
        avatarUrl: data.avatarUrl,
        role: Role.USER,
        [data.field]: data.providerId,
      } as Prisma.UserCreateInput,
    });
  }

  // leagă un provider de un cont existent
  linkSocialAccount(userId: string, field: SocialIdField, providerId: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { [field]: providerId } as Prisma.UserUpdateInput,
    });
  }

  async create(data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role?: Role;
  }) {
    return this.prisma.user.create({ data });
  }

  createRefreshToken(userId: string, tokenHash: string, expiresAt: Date) {
    return this.prisma.refreshToken.create({
      data: { userId, tokenHash, expiresAt },
    });
  }

  findValidRefreshTokens(userId: string) {
    return this.prisma.refreshToken.findMany({
      where: { userId, expiresAt: { gt: new Date() } },
    });
  }

  deleteRefreshTokenById(id: string) {
    return this.prisma.refreshToken.delete({ where: { id } });
  }

  deleteAllRefreshTokensForUser(userId: string) {
    return this.prisma.refreshToken.deleteMany({ where: { userId } });
  }

  async setSelfMember(userId: string, memberId: string | null) {
    try {
      return await this.prisma.user.update({
        where: { id: userId },
        data: { selfMemberId: memberId },
      });
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
        throw new ConflictException('Acest membru este deja asociat unui alt cont.');
      }
      throw err;
    }
  }

  // ─────────── RESET PAROLĂ ───────────

  updatePassword(userId: string, hashedPassword: string) {
    return this.prisma.user.update({ where: { id: userId }, data: { password: hashedPassword } });
  }

  // un singur token activ per user: ștergem cele vechi și creăm unul nou, atomic
  createPasswordResetToken(userId: string, tokenHash: string, expiresAt: Date) {
    return this.prisma.$transaction([
      this.prisma.passwordResetToken.deleteMany({ where: { userId } }),
      this.prisma.passwordResetToken.create({ data: { userId, tokenHash, expiresAt } }),
    ]);
  }

  findPasswordResetToken(tokenHash: string) {
    return this.prisma.passwordResetToken.findUnique({ where: { tokenHash } });
  }

  // returnează câte rânduri a șters: 0 = tokenul a fost deja consumat (protecție la cereri simultane)
  async consumePasswordResetToken(id: string): Promise<number> {
    const result = await this.prisma.passwordResetToken.deleteMany({ where: { id } });
    return result.count;
  }

  // ─────────── ÎNREGISTRĂRI ÎN AȘTEPTARE (confirmare email) ───────────

  createPendingRegistration(data: {
    email: string;
    passwordHash: string;
    firstName: string;
    lastName: string;
    inviteToken?: string;
    tokenHash: string;
    expiresAt: Date;
  }) {
    return this.prisma.pendingRegistration.create({ data });
  }

  deleteExpiredPendingRegistrations() {
    return this.prisma.pendingRegistration.deleteMany({ where: { expiresAt: { lt: new Date() } } });
  }

  // emailul trebuie dat deja în litere mici (așa se salvează)
  findLatestPendingRegistrationByEmail(email: string) {
    return this.prisma.pendingRegistration.findFirst({
      where: { email },
      orderBy: { createdAt: 'desc' },
    });
  }

  findPendingRegistrationByTokenHash(tokenHash: string) {
    return this.prisma.pendingRegistration.findUnique({ where: { tokenHash } });
  }

  // returnează câte rânduri a șters: 0 = deja consumată (protecție la cereri simultane)
  async consumePendingRegistration(id: string): Promise<number> {
    const result = await this.prisma.pendingRegistration.deleteMany({ where: { id } });
    return result.count;
  }

  deletePendingRegistrationsForEmail(email: string) {
    return this.prisma.pendingRegistration.deleteMany({ where: { email } });
  }
}