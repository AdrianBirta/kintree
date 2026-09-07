import { Injectable, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Role, Prisma } from '@prisma/client';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) { }

  findByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email } });
  }

  findById(id: string) {
    return this.prisma.user.findUnique({ where: { id } });
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

  // NOU — setează / elimină membrul marcat ca "eu". Suprascrie automat orice
  // valoare anterioară (un user are mereu CEL MULT un selfMemberId). Catch-ul
  // de mai jos e o plasă de siguranță defensivă: constrângerea @unique pe
  // selfMemberId ar putea, teoretic, ciocni dacă același membru e țintit
  // concurent de două request-uri — traducem eroarea Prisma brută
  // într-un mesaj inteligibil, în loc de un 500 opac.
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
}