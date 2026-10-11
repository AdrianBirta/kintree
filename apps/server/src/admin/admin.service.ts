import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { Prisma, Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { FamilyMembersService } from '../family-members/family-members.service';
import { ListUsersQueryDto } from './dto/list-users-query.dto';
import { AdminCreateUserDto } from './dto/create-user.dto';
import { AdminUpdateUserDto } from './dto/update-user.dto';
import { CreateDonationDto } from './dto/create-donation.dto';

const DAY_MS = 86_400_000;

// câmpurile comune pentru liste; parola NU se returnează niciodată (doar `hasPassword`)
const userListSelect = {
  id: true,
  email: true,
  firstName: true,
  lastName: true,
  role: true,
  disabled: true,
  createdAt: true,
  lastLoginAt: true,
  avatarUrl: true,
  googleId: true,
  facebookId: true,
  yahooId: true,
  password: true,
  _count: { select: { familyMembers: true, donations: true } },
} satisfies Prisma.UserSelect;

type UserListRow = Prisma.UserGetPayload<{ select: typeof userListSelect }>;

@Injectable()
export class AdminService {
  constructor(
    private prisma: PrismaService,
    private familyMembersService: FamilyMembersService,
  ) { }

  private toListItem(u: UserListRow) {
    const { password, googleId, facebookId, yahooId, _count, ...rest } = u;
    return {
      ...rest,
      hasPassword: !!password,
      providers: [googleId && 'google', facebookId && 'facebook', yahooId && 'yahoo'].filter(Boolean) as string[],
      membersCount: _count.familyMembers,
      donationsCount: _count.donations,
    };
  }

  // ─────────── STATISTICI ───────────

  async getStats() {
    const now = Date.now();
    const since7 = new Date(now - 7 * DAY_MS);
    const since30 = new Date(now - 30 * DAY_MS);

    const [
      total, disabled, new7, new30, active30,
      members, shareLinks, treeAccess, conversations, messages,
      clicks, clicksByTier, donationTotals, donorRows, recent, signupRows,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.count({ where: { disabled: true } }),
      this.prisma.user.count({ where: { createdAt: { gte: since7 } } }),
      this.prisma.user.count({ where: { createdAt: { gte: since30 } } }),
      this.prisma.user.count({ where: { lastLoginAt: { gte: since30 } } }),
      this.prisma.familyMember.count(),
      this.prisma.shareLink.count(),
      this.prisma.treeAccess.count({ where: { revoked: false } }),
      this.prisma.conversation.count(),
      this.prisma.message.count(),
      this.prisma.donationClick.count(),
      this.prisma.donationClick.groupBy({ by: ['tier'], _count: { tier: true } }),
      this.prisma.donation.groupBy({ by: ['currency'], _sum: { amount: true }, _count: { _all: true } }),
      this.prisma.donation.findMany({
        where: { userId: { not: null } },
        distinct: ['userId'],
        select: { userId: true },
      }),
      this.prisma.user.findMany({ orderBy: { createdAt: 'desc' }, take: 5, select: userListSelect }),
      this.prisma.user.findMany({ where: { createdAt: { gte: since30 } }, select: { createdAt: true } }),
    ]);

    // înregistrări pe zi, ultimele 30 de zile (zile fără înregistrări = 0)
    const perDay = new Map<string, number>();
    signupRows.forEach((r) => {
      const key = r.createdAt.toISOString().slice(0, 10);
      perDay.set(key, (perDay.get(key) ?? 0) + 1);
    });
    const signups = Array.from({ length: 30 }, (_, i) => {
      const date = new Date(now - (29 - i) * DAY_MS).toISOString().slice(0, 10);
      return { date, count: perDay.get(date) ?? 0 };
    });

    return {
      users: { total, active: total - disabled, disabled, new7, new30, activeLast30: active30 },
      content: { members, shareLinks, treeAccess, conversations, messages },
      donations: {
        clicks,
        clicksByTier: clicksByTier.map((g) => ({ tier: g.tier, count: g._count.tier })),
        totals: donationTotals.map((g) => ({
          currency: g.currency,
          amount: g._sum.amount ?? 0,
          count: g._count._all,
        })),
        donors: donorRows.length,
      },
      recentUsers: recent.map((u) => this.toListItem(u)),
      signups,
    };
  }

  // ─────────── LISTĂ USERI ───────────

  async listUsers(q: ListUsersQueryDto) {
    const terms = (q.search ?? '').split(/\s+/).filter(Boolean);

    const where: Prisma.UserWhereInput = {
      // fiecare cuvânt trebuie să se regăsească în nume / prenume / email
      ...(terms.length
        ? {
          AND: terms.map((term) => ({
            OR: [
              { email: { contains: term, mode: 'insensitive' as const } },
              { firstName: { contains: term, mode: 'insensitive' as const } },
              { lastName: { contains: term, mode: 'insensitive' as const } },
            ],
          })),
        }
        : {}),
      ...(q.status === 'active' ? { disabled: false } : q.status === 'disabled' ? { disabled: true } : {}),
      ...(q.donor === 'donors' ? { donations: { some: {} } } : {}),
    };

    const orderBy: Prisma.UserOrderByWithRelationInput =
      q.sortBy === 'members'
        ? { familyMembers: { _count: q.sortDir } }
        : ({ [q.sortBy]: q.sortDir } as Prisma.UserOrderByWithRelationInput);

    const [total, rows] = await this.prisma.$transaction([
      this.prisma.user.count({ where }),
      this.prisma.user.findMany({
        where,
        orderBy: [orderBy, { id: 'asc' }], // id = ordine stabilă la paginare
        skip: (q.page - 1) * q.pageSize,
        take: q.pageSize,
        select: userListSelect,
      }),
    ]);

    return {
      items: rows.map((u) => this.toListItem(u)),
      total,
      page: q.page,
      pageSize: q.pageSize,
      totalPages: Math.max(1, Math.ceil(total / q.pageSize)),
    };
  }

  // ─────────── DETALII USER ───────────

  async getUserDetail(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: { ...userListSelect, updatedAt: true, selfMemberId: true },
    });
    if (!user) throw new NotFoundException('Utilizator inexistent.');

    const [
      members, relations, partnerships, deceased, withPhoto,
      shareLinks, accessGiven, accessReceived, messagesSent, activeSessions, donations,
    ] = await Promise.all([
      this.prisma.familyMember.findMany({
        where: { ownerId: id },
        orderBy: { createdAt: 'asc' },
        take: 1000,
        select: {
          id: true, firstName: true, lastName: true, gender: true,
          birthDate: true, deathDate: true, imageUrl: true, createdAt: true,
        },
      }),
      this.prisma.parentChild.count({ where: { parent: { ownerId: id } } }),
      this.prisma.partnership.count({ where: { partnerA: { ownerId: id } } }),
      this.prisma.familyMember.count({ where: { ownerId: id, deathDate: { not: null } } }),
      this.prisma.familyMember.count({ where: { ownerId: id, imageUrl: { not: null } } }),
      this.prisma.shareLink.findMany({
        where: { ownerId: id },
        orderBy: { createdAt: 'desc' },
        select: {
          id: true, label: true, accessLevel: true, expiresAt: true, maxUses: true,
          usesCount: true, revoked: true, createdAt: true, _count: { select: { guests: true } },
        },
      }),
      this.prisma.treeAccess.findMany({
        where: { ownerId: id },
        orderBy: { createdAt: 'desc' },
        select: {
          id: true, accessLevel: true, revoked: true, expiresAt: true, createdAt: true,
          grantee: { select: { id: true, firstName: true, lastName: true, email: true } },
        },
      }),
      this.prisma.treeAccess.findMany({
        where: { granteeId: id },
        orderBy: { createdAt: 'desc' },
        select: {
          id: true, accessLevel: true, revoked: true, expiresAt: true, createdAt: true,
          owner: { select: { id: true, firstName: true, lastName: true, email: true } },
        },
      }),
      this.prisma.message.count({ where: { senderId: id } }),
      this.prisma.refreshToken.count({ where: { userId: id, expiresAt: { gt: new Date() } } }),
      this.prisma.donation.findMany({ where: { userId: id }, orderBy: { donatedAt: 'desc' } }),
    ]);

    const base = this.toListItem(user);
    const totalMembers = user._count.familyMembers;

    return {
      user: { ...base, updatedAt: user.updatedAt, selfMemberId: user.selfMemberId },
      stats: {
        members: totalMembers,
        alive: totalMembers - deceased,
        deceased,
        withPhoto,
        relations,
        partnerships,
        shareLinks: shareLinks.length,
        accessGiven: accessGiven.length,
        accessReceived: accessReceived.length,
        messagesSent,
        activeSessions,
        donations: donations.length,
      },
      members,
      shareLinks: shareLinks.map(({ _count, ...l }) => ({ ...l, guestsCount: _count.guests })),
      accessGiven,
      accessReceived,
      donations,
    };
  }

  // ─────────── CRUD USER ───────────

  async createUser(dto: AdminCreateUserDto) {
    const email = dto.email.trim().toLowerCase();
    const existing = await this.prisma.user.findFirst({ where: { email: { equals: email, mode: 'insensitive' } } });
    if (existing) throw new ConflictException('Există deja un cont cu acest email.');

    const user = await this.prisma.user.create({
      data: {
        email,
        password: await bcrypt.hash(dto.password, 10),
        firstName: dto.firstName.trim(),
        lastName: dto.lastName.trim(),
        role: Role.USER, // adminul se setează doar direct în DB
      },
      select: userListSelect,
    });
    return this.toListItem(user);
  }

  async updateUser(id: string, dto: AdminUpdateUserDto) {
    const target = await this.prisma.user.findUnique({ where: { id } });
    if (!target) throw new NotFoundException('Utilizator inexistent.');

    if (dto.disabled === true && target.role === Role.ADMIN) {
      throw new BadRequestException('Contul de administrator nu poate fi dezactivat.');
    }

    const data: Prisma.UserUpdateInput = {};

    if (dto.email !== undefined) {
      const email = dto.email.trim().toLowerCase();
      const clash = await this.prisma.user.findFirst({
        where: { email: { equals: email, mode: 'insensitive' }, NOT: { id } },
      });
      if (clash) throw new ConflictException('Există deja un cont cu acest email.');
      data.email = email;
    }
    if (dto.firstName !== undefined) data.firstName = dto.firstName.trim();
    if (dto.lastName !== undefined) data.lastName = dto.lastName.trim();
    if (dto.disabled !== undefined) data.disabled = dto.disabled;
    if (dto.password) data.password = await bcrypt.hash(dto.password, 10);

    const updated = await this.prisma.user.update({ where: { id }, data, select: userListSelect });

    // parolă nouă sau cont dezactivat => închidem toate sesiunile
    if (dto.password || dto.disabled === true) {
      await this.prisma.refreshToken.deleteMany({ where: { userId: id } });
    }

    return this.toListItem(updated);
  }

  async deleteUser(adminId: string, id: string) {
    const target = await this.prisma.user.findUnique({ where: { id } });
    if (!target) throw new NotFoundException('Utilizator inexistent.');
    if (target.id === adminId || target.role === Role.ADMIN) {
      throw new BadRequestException('Contul de administrator nu poate fi șters.');
    }

    // membrii, relațiile, linkurile, accesele și mesajele se șterg în cascadă (schema Prisma);
    // donațiile rămân (userId devine null). Curățăm și conversațiile rămase fără participanți.
    await this.prisma.$transaction([
      this.prisma.user.delete({ where: { id } }),
      this.prisma.conversation.deleteMany({ where: { participants: { none: {} } } }),
    ]);

    return { success: true };
  }

  async revokeSessions(id: string) {
    const target = await this.prisma.user.findUnique({ where: { id }, select: { id: true } });
    if (!target) throw new NotFoundException('Utilizator inexistent.');
    const result = await this.prisma.refreshToken.deleteMany({ where: { userId: id } });
    return { success: true, revoked: result.count };
  }

  // ─────────── MODERARE ARBORE ───────────

  // refolosește logica existentă (include sincronizarea alianțelor)
  async removeMember(userId: string, memberId: string) {
    return this.familyMembersService.remove(userId, memberId);
  }

  // ─────────── DONAȚII ───────────

  async createDonation(dto: CreateDonationDto) {
    if (dto.userId) {
      const user = await this.prisma.user.findUnique({ where: { id: dto.userId }, select: { id: true } });
      if (!user) throw new NotFoundException('Utilizator inexistent.');
    }

    return this.prisma.donation.create({
      data: {
        userId: dto.userId,
        donorName: dto.userId ? undefined : dto.donorName?.trim() || undefined,
        amount: dto.amount,
        currency: dto.currency ?? 'RON',
        note: dto.note?.trim() || undefined,
        donatedAt: dto.donatedAt ? new Date(dto.donatedAt) : undefined,
      },
    });
  }

  async deleteDonation(id: string) {
    const donation = await this.prisma.donation.findUnique({ where: { id } });
    if (!donation) throw new NotFoundException('Donație inexistentă.');
    await this.prisma.donation.delete({ where: { id } });
    return { success: true };
  }
}