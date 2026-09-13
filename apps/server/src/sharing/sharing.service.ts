import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { randomBytes } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { CreateShareLinkDto } from './dto/create-share-link.dto';
import { JoinShareLinkDto } from './dto/join-share-link.dto';
import { GrantTreeAccessDto } from './dto/grant-tree-access.dto';
import { UsersService } from '../users/users.service';
import { ShareAccessLevel } from '@prisma/client';

function generateToken(bytes = 24) {
  return randomBytes(bytes).toString('base64url');
}

@Injectable()
export class SharingService {
  constructor(
    private prisma: PrismaService,
    private usersService: UsersService,
  ) { }

  // ─────────── LINK-URI DE DISTRIBUIRE (fără cont) ───────────

  createShareLink(ownerId: string, dto: CreateShareLinkDto) {
    return this.prisma.shareLink.create({
      data: {
        ownerId,
        token: generateToken(),
        accessLevel: dto.accessLevel,
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : undefined,
        maxUses: dto.maxUses,
        // NOU — se salvează doar dacă accesul e de tip EDIT; pentru READ_ONLY nu are sens
        maxMembersPerGuest: dto.accessLevel === ShareAccessLevel.EDIT ? dto.maxMembersPerGuest : undefined,
        label: dto.label,
      },
    });
  }

  listShareLinks(ownerId: string) {
    return this.prisma.shareLink.findMany({
      where: { ownerId },
      include: { guests: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async revokeShareLink(ownerId: string, id: string) {
    const link = await this.prisma.shareLink.findUnique({ where: { id } });
    if (!link || link.ownerId !== ownerId) throw new NotFoundException('Link inexistent.');
    return this.prisma.shareLink.update({ where: { id }, data: { revoked: true } });
  }

  async deleteShareLink(ownerId: string, id: string) {
    const link = await this.prisma.shareLink.findUnique({ where: { id } });
    if (!link || link.ownerId !== ownerId) throw new NotFoundException('Link inexistent.');
    return this.prisma.shareLink.delete({ where: { id } });
  }

  private async getValidShareLink(token: string) {
    const link = await this.prisma.shareLink.findUnique({ where: { token } });
    if (!link || link.revoked) throw new NotFoundException('Linkul nu mai este valid.');
    if (link.expiresAt && link.expiresAt.getTime() < Date.now()) {
      throw new ForbiddenException('Linkul a expirat.');
    }
    return link;
  }

  async joinShareLink(token: string, existingGuestToken: string | undefined, dto: JoinShareLinkDto) {
    const link = await this.getValidShareLink(token);

    if (existingGuestToken) {
      const existing = await this.prisma.shareLinkGuest.findUnique({ where: { guestToken: existingGuestToken } });
      if (existing && existing.shareLinkId === link.id) {
        await this.prisma.shareLinkGuest.update({ where: { id: existing.id }, data: { lastUsedAt: new Date() } });
        return { link, guestToken: existingGuestToken };
      }
    }

    if (link.accessLevel === ShareAccessLevel.EDIT && link.maxUses != null && link.usesCount >= link.maxUses) {
      throw new ForbiddenException('Numărul maxim de persoane care pot folosi acest link a fost atins.');
    }

    const guestToken = generateToken();
    await this.prisma.$transaction([
      this.prisma.shareLinkGuest.create({
        data: { shareLinkId: link.id, guestToken, displayName: dto.displayName },
      }),
      this.prisma.shareLink.update({ where: { id: link.id }, data: { usesCount: { increment: 1 } } }),
    ]);

    return { link, guestToken };
  }

  // verificat pe fiecare request de READ (get tree) sau EDIT generic
  // (relații, poze) făcut de un invitat prin link — NU incrementează nimic
  async assertGuestAccess(token: string, guestToken: string, requiredLevel: ShareAccessLevel) {
    const link = await this.getValidShareLink(token);
    const guest = guestToken
      ? await this.prisma.shareLinkGuest.findUnique({ where: { guestToken } })
      : null;
    if (!guest || guest.shareLinkId !== link.id) {
      throw new ForbiddenException('Sesiune de acces invalidă. Redeschide linkul primit.');
    }
    if (requiredLevel === ShareAccessLevel.EDIT && link.accessLevel !== ShareAccessLevel.EDIT) {
      throw new ForbiddenException('Acest link permite doar vizualizare, nu și editare.');
    }
    return link;
  }

  // NOU — folosit STRICT pentru crearea unui membru nou. Verifică accesul de
  // EDIT (ca assertGuestAccess), plus limita per-invitat de membri, apoi
  // incrementează atomic contorul acelui invitat. Dacă limita e null/undefined
  // pe link, nu există restricție — doar accesul EDIT normal se aplică.
  async consumeGuestMemberSlot(token: string, guestToken: string) {
    const link = await this.getValidShareLink(token);
    if (link.accessLevel !== ShareAccessLevel.EDIT) {
      throw new ForbiddenException('Acest link permite doar vizualizare, nu și editare.');
    }

    const guest = guestToken
      ? await this.prisma.shareLinkGuest.findUnique({ where: { guestToken } })
      : null;
    if (!guest || guest.shareLinkId !== link.id) {
      throw new ForbiddenException('Sesiune de acces invalidă. Redeschide linkul primit.');
    }

    if (link.maxMembersPerGuest != null && guest.membersAddedCount >= link.maxMembersPerGuest) {
      throw new ForbiddenException(
        `Ai atins numărul maxim de membri pe care îi poți adăuga prin acest link (${link.maxMembersPerGuest}).`,
      );
    }

    // incrementare atomică — updateMany cu condiția pe count, ca să evităm
    // orice race condition dacă vin două request-uri de creare aproape simultan
    const updateResult = await this.prisma.shareLinkGuest.updateMany({
      where: {
        id: guest.id,
        ...(link.maxMembersPerGuest != null ? { membersAddedCount: { lt: link.maxMembersPerGuest } } : {}),
      },
      data: { membersAddedCount: { increment: 1 }, lastUsedAt: new Date() },
    });

    if (updateResult.count === 0) {
      throw new ForbiddenException(
        `Ai atins numărul maxim de membri pe care îi poți adăuga prin acest link (${link.maxMembersPerGuest}).`,
      );
    }

    return link;
  }

  // ─────────── ACCES PE BAZĂ DE CONT (fără link) ───────────

  async grantTreeAccess(ownerId: string, dto: GrantTreeAccessDto) {
    const grantee = await this.usersService.findByEmail(dto.email);
    if (!grantee) {
      throw new NotFoundException(
        'Nu există niciun cont cu acest email. Pentru persoane fără cont, folosește un link de distribuire.',
      );
    }
    if (grantee.id === ownerId) {
      throw new BadRequestException('Nu îți poți acorda acces ție însuți.');
    }

    return this.prisma.treeAccess.upsert({
      where: { ownerId_granteeId: { ownerId, granteeId: grantee.id } },
      update: {
        accessLevel: dto.accessLevel,
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
        revoked: false,
      },
      create: {
        ownerId,
        granteeId: grantee.id,
        accessLevel: dto.accessLevel,
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : undefined,
      },
    });
  }

  listGivenTreeAccess(ownerId: string) {
    return this.prisma.treeAccess.findMany({
      where: { ownerId },
      include: { grantee: { select: { id: true, firstName: true, lastName: true, email: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  listReceivedTreeAccess(granteeId: string) {
    return this.prisma.treeAccess.findMany({
      where: { granteeId, revoked: false },
      include: { owner: { select: { id: true, firstName: true, lastName: true, email: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async listAccessibleTrees(userId: string, ownerUser: { firstName: string; lastName: string; email: string }) {
    const received = await this.listReceivedTreeAccess(userId);

    const now = Date.now();
    const validReceived = received.filter((r) => !r.expiresAt || new Date(r.expiresAt).getTime() > now);

    return {
      own: { ownerId: userId, firstName: ownerUser.firstName, lastName: ownerUser.lastName, email: ownerUser.email },
      received: validReceived.map((r) => ({
        accessId: r.id,
        ownerId: r.owner!.id,
        firstName: r.owner!.firstName,
        lastName: r.owner!.lastName,
        email: r.owner!.email,
        accessLevel: r.accessLevel,
        expiresAt: r.expiresAt,
      })),
    };
  }

  async revokeTreeAccess(ownerId: string, id: string) {
    const access = await this.prisma.treeAccess.findUnique({ where: { id } });
    if (!access || access.ownerId !== ownerId) throw new NotFoundException('Acces inexistent.');
    return this.prisma.treeAccess.update({ where: { id }, data: { revoked: true } });
  }

  async assertAccountAccess(ownerId: string, granteeId: string, requiredLevel: ShareAccessLevel) {
    if (ownerId === granteeId) return;
    const access = await this.prisma.treeAccess.findUnique({
      where: { ownerId_granteeId: { ownerId, granteeId } },
    });
    if (!access || access.revoked) throw new ForbiddenException('Nu ai acces la acest arbore.');
    if (access.expiresAt && access.expiresAt.getTime() < Date.now()) {
      throw new ForbiddenException('Accesul la acest arbore a expirat.');
    }
    if (requiredLevel === ShareAccessLevel.EDIT && access.accessLevel !== ShareAccessLevel.EDIT) {
      throw new ForbiddenException('Ai doar acces de vizualizare la acest arbore.');
    }
  }
}