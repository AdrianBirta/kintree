import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Role } from '@prisma/client';

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

  // NOU — creează o sesiune nouă (un rând), nu suprascrie una existentă.
  // Astfel, un login pe alt dispozitiv NU mai invalidează sesiunile deschise.
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
}