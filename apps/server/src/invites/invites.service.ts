import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { randomBytes } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { CreateInviteDto } from './dto/create-invite.dto';

function generateToken(bytes = 20) {
  return randomBytes(bytes).toString('base64url');
}

@Injectable()
export class InvitesService {
  constructor(private prisma: PrismaService) { }

  createInvite(inviterId: string, dto: CreateInviteDto) {
    return this.prisma.appInvite.create({
      data: {
        inviterId,
        token: generateToken(),
        email: dto.email,
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : undefined,
      },
    });
  }

  listInvites(inviterId: string) {
    return this.prisma.appInvite.findMany({
      where: { inviterId },
      include: { usedByUser: { select: { id: true, firstName: true, lastName: true, email: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async deleteInvite(inviterId: string, id: string) {
    const invite = await this.prisma.appInvite.findUnique({ where: { id } });
    if (!invite || invite.inviterId !== inviterId) throw new NotFoundException('Invitație inexistentă.');
    return this.prisma.appInvite.delete({ where: { id } });
  }

  // apelat public, la afișarea paginii de acceptare invitație (înainte de register)
  async getValidInvitePreview(token: string) {
    const invite = await this.prisma.appInvite.findUnique({
      where: { token },
      include: { inviter: { select: { firstName: true, lastName: true } } },
    });
    if (!invite || invite.usedAt) throw new NotFoundException('Invitația nu mai este valabilă.');
    if (invite.expiresAt && invite.expiresAt.getTime() < Date.now()) {
      throw new ForbiddenException('Invitația a expirat.');
    }
    return { inviterName: `${invite.inviter.firstName} ${invite.inviter.lastName}`, email: invite.email };
  }

  // apelat de AuthService la register, DOAR marchează invitația ca folosită —
  // NU creează niciun TreeAccess, exact cum ai cerut
  async consumeInvite(token: string, newUserId: string) {
    const invite = await this.prisma.appInvite.findUnique({ where: { token } });
    if (!invite || invite.usedAt) throw new NotFoundException('Invitația nu mai este valabilă.');
    if (invite.expiresAt && invite.expiresAt.getTime() < Date.now()) {
      throw new ForbiddenException('Invitația a expirat.');
    }
    await this.prisma.appInvite.update({
      where: { id: invite.id },
      data: { usedAt: new Date(), usedByUserId: newUserId },
    });
  }
}