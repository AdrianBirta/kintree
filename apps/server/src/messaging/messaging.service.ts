import { Injectable, ForbiddenException, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { SendMessageDto } from './dto/send-message.dto';

@Injectable()
export class MessagingService {
  constructor(private prisma: PrismaService) { }

  private async assertParticipant(userId: string, conversationId: string) {
    const participant = await this.prisma.conversationParticipant.findUnique({
      where: { conversationId_userId: { conversationId, userId } },
    });
    if (!participant) throw new ForbiddenException('Nu faci parte din această conversație.');
    return participant;
  }

  async createOrGetConversation(userId: string, dto: CreateConversationDto) {
    const uniqueOtherIds = [...new Set(dto.participantIds)].filter((id) => id !== userId);
    if (uniqueOtherIds.length === 0) throw new BadRequestException('Alege cel puțin un membru pentru conversație.');

    const isGroup = uniqueOtherIds.length > 1;

    if (!isGroup) {
      const existing = await this.prisma.conversation.findFirst({
        where: {
          isGroup: false,
          AND: [
            { participants: { some: { userId } } },
            { participants: { some: { userId: uniqueOtherIds[0] } } },
          ],
        },
        include: { participants: true },
      });
      if (existing && existing.participants.length === 2) return existing;
    }

    return this.prisma.conversation.create({
      data: {
        isGroup,
        name: isGroup ? dto.name : undefined,
        participants: {
          create: [userId, ...uniqueOtherIds].map((id) => ({ userId: id })),
        },
      },
      include: { participants: true },
    });
  }

  async listConversations(userId: string) {
    const conversations = await this.prisma.conversation.findMany({
      where: { participants: { some: { userId } } },
      include: {
        participants: { include: { user: { select: { id: true, firstName: true, lastName: true, email: true } } } },
        messages: { orderBy: { createdAt: 'desc' }, take: 1 },
      },
      orderBy: { messages: { _count: 'desc' } },
    });

    return conversations
      .map((c) => ({
        id: c.id,
        isGroup: c.isGroup,
        name: c.name,
        // NOU — includem lastReadAt per participant (exclusiv userul curent),
        // ca frontend-ul să poată calcula indicatorul "Văzut" fără endpoint nou
        participants: c.participants
          .filter((p) => p.userId !== userId)
          .map((p) => ({ ...p.user, lastReadAt: p.lastReadAt })),
        lastMessage: c.messages[0] ?? null,
        lastActivityAt: c.messages[0]?.createdAt ?? c.createdAt,
      }))
      .sort((a, b) => new Date(b.lastActivityAt).getTime() - new Date(a.lastActivityAt).getTime());
  }

  async getMessages(userId: string, conversationId: string, after?: string) {
    await this.assertParticipant(userId, conversationId);

    return this.prisma.message.findMany({
      where: {
        conversationId,
        ...(after ? { createdAt: { gt: new Date(after) } } : {}),
      },
      include: { sender: { select: { id: true, firstName: true, lastName: true } } },
      orderBy: { createdAt: 'asc' },
    });
  }

  async sendMessage(userId: string, conversationId: string, dto: SendMessageDto) {
    await this.assertParticipant(userId, conversationId);
    return this.prisma.message.create({
      data: { conversationId, senderId: userId, content: dto.content },
      include: { sender: { select: { id: true, firstName: true, lastName: true } } },
    });
  }

  async markAsRead(userId: string, conversationId: string) {
    const participant = await this.assertParticipant(userId, conversationId);
    return this.prisma.conversationParticipant.update({
      where: { id: participant.id },
      data: { lastReadAt: new Date() },
    });
  }

  async listMessageableContacts(userId: string) {
    const [given, received] = await Promise.all([
      this.prisma.treeAccess.findMany({
        where: { ownerId: userId, revoked: false },
        include: { grantee: { select: { id: true, firstName: true, lastName: true, email: true } } },
      }),
      this.prisma.treeAccess.findMany({
        where: { granteeId: userId, revoked: false },
        include: { owner: { select: { id: true, firstName: true, lastName: true, email: true } } },
      }),
    ]);

    const contactsById = new Map<string, { id: string; firstName: string; lastName: string; email: string }>();
    given.forEach((g) => contactsById.set(g.grantee.id, g.grantee));
    received.forEach((r) => contactsById.set(r.owner.id, r.owner));

    return [...contactsById.values()];
  }
}