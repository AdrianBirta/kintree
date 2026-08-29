import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateFamilyMemberDto } from './dto/create-family-member.dto';
import { UpdateFamilyMemberDto } from './dto/update-family-member.dto';
import { UploadService } from '../upload/upload.service';

@Injectable()
export class FamilyMembersService {
  constructor(
    private prisma: PrismaService,
    private uploadService: UploadService,
  ) { }

  private normalizeDates<T extends { birthDate?: string; deathDate?: string }>(dto: T) {
    return {
      ...dto,
      birthDate: dto.birthDate ? new Date(dto.birthDate).toISOString() : undefined,
      deathDate: dto.deathDate ? new Date(dto.deathDate).toISOString() : undefined,
    };
  }

  create(userId: string, dto: CreateFamilyMemberDto) {
    const data = this.normalizeDates(dto);
    return this.prisma.familyMember.create({ data: { ...data, ownerId: userId } });
  }

  findAll(userId: string) {
    return this.prisma.familyMember.findMany({
      where: { ownerId: userId },
      orderBy: { createdAt: 'asc' },
    });
  }

  async findOne(userId: string, id: string) {
    const member = await this.prisma.familyMember.findUnique({
      where: { id },
      include: {
        children: { include: { child: true } },
        parents: { include: { parent: true } },
        partnersA: { include: { partnerB: true } },
        partnersB: { include: { partnerA: true } },
      },
    });

    if (!member) throw new NotFoundException(`Family member with id ${id} not found`);
    if (member.ownerId !== userId) throw new ForbiddenException('Nu ai acces la acest membru.');

    return member;
  }

  async update(userId: string, id: string, dto: UpdateFamilyMemberDto) {
    await this.findOne(userId, id);
    const data = this.normalizeDates(dto);
    return this.prisma.familyMember.update({ where: { id }, data });
  }

  async remove(userId: string, id: string) {
    await this.findOne(userId, id);
    const removed = await this.prisma.familyMember.delete({ where: { id } });
    await this.syncAlliances(userId);
    return removed;
  }

  // NOU — încarcă poza pe Cloudinary și salvează URL-ul rezultat pe membru.
  // Notă: nu ștergem poza veche de pe Cloudinary la înlocuire — dacă vrei asta,
  // adaugă un câmp `imagePublicId` în schema Prisma și apelează uploadService.deleteImage().
  async uploadPhoto(userId: string, id: string, file: Parameters<UploadService['uploadImage']>[0]) {
    await this.findOne(userId, id);
    if (!file) throw new BadRequestException('Niciun fișier trimis.');

    const { url } = await this.uploadService.uploadImage(file, `earbore/${userId}`);

    return this.prisma.familyMember.update({
      where: { id },
      data: { imageUrl: url },
    });
  }

  async getFamilyTree(userId: string) {
    const members = await this.prisma.familyMember.findMany({ where: { ownerId: userId } });
    const relations = await this.prisma.parentChild.findMany({ where: { parent: { ownerId: userId } } });
    const partnerships = await this.prisma.partnership.findMany({ where: { partnerA: { ownerId: userId } } });
    const alliances = await this.prisma.familyAlliance.findMany({ where: { memberA: { ownerId: userId } } });

    return { members, relations, partnerships, alliances };
  }

  async linkParentChild(userId: string, parentId: string, childId: string) {
    await this.findOne(userId, parentId);
    await this.findOne(userId, childId);

    const relation = await this.prisma.parentChild.create({ data: { parentId, childId } });
    await this.syncAlliances(userId);
    return relation;
  }

  async unlinkParentChild(userId: string, parentId: string, childId: string) {
    await this.findOne(userId, parentId);
    await this.findOne(userId, childId);

    const result = await this.prisma.parentChild.deleteMany({ where: { parentId, childId } });
    await this.syncAlliances(userId);
    return result;
  }

  async linkPartners(userId: string, partnerAId: string, partnerBId: string, status?: string) {
    if (partnerAId === partnerBId) {
      throw new BadRequestException('Nu poți lega un membru cu el însuși.');
    }

    await this.findOne(userId, partnerAId);
    await this.findOne(userId, partnerBId);

    const [a, b] = [partnerAId, partnerBId].sort();

    const existing = await this.prisma.partnership.findUnique({
      where: { partnerAId_partnerBId: { partnerAId: a, partnerBId: b } },
    });

    const partnership = existing
      ? await this.prisma.partnership.update({
        where: { id: existing.id },
        data: { status: (status as any) ?? existing.status },
      })
      : await this.prisma.partnership.create({
        data: { partnerAId: a, partnerBId: b, status: (status as any) ?? 'MARRIED' },
      });

    await this.syncAlliances(userId);
    return partnership;
  }

  async unlinkPartners(userId: string, partnerAId: string, partnerBId: string) {
    await this.findOne(userId, partnerAId);
    await this.findOne(userId, partnerBId);

    const result = await this.prisma.partnership.deleteMany({
      where: {
        OR: [
          { partnerAId, partnerBId },
          { partnerAId: partnerBId, partnerBId: partnerAId },
        ],
      },
    });

    await this.syncAlliances(userId);
    return result;
  }

  private async syncAlliances(userId: string) {
    const [relations, partnerships] = await Promise.all([
      this.prisma.parentChild.findMany({ where: { parent: { ownerId: userId } } }),
      this.prisma.partnership.findMany({ where: { partnerA: { ownerId: userId } } }),
    ]);

    const parentsByChild = new Map<string, string[]>();
    relations.forEach((r) => {
      const list = parentsByChild.get(r.childId) ?? [];
      list.push(r.parentId);
      parentsByChild.set(r.childId, list);
    });

    const desired = new Map<string, { memberAId: string; memberBId: string; viaPartnershipId: string }>();

    for (const p of partnerships) {
      const parentsA = parentsByChild.get(p.partnerAId) ?? [];
      const parentsB = parentsByChild.get(p.partnerBId) ?? [];
      if (parentsA.length === 0 || parentsB.length === 0) continue;

      for (const pa of parentsA) {
        for (const pb of parentsB) {
          if (pa === pb) continue;
          const [memberAId, memberBId] = [pa, pb].sort();
          desired.set(`${memberAId}|${memberBId}`, { memberAId, memberBId, viaPartnershipId: p.id });
        }
      }
    }

    const existingAlliances = await this.prisma.familyAlliance.findMany({
      where: { memberA: { ownerId: userId } },
    });

    const toDelete = existingAlliances.filter((e) => !desired.has(`${e.memberAId}|${e.memberBId}`));
    if (toDelete.length > 0) {
      await this.prisma.familyAlliance.deleteMany({ where: { id: { in: toDelete.map((e) => e.id) } } });
    }

    for (const alliance of desired.values()) {
      await this.prisma.familyAlliance.upsert({
        where: { memberAId_memberBId: { memberAId: alliance.memberAId, memberBId: alliance.memberBId } },
        update: { viaPartnershipId: alliance.viaPartnershipId },
        create: { ...alliance, type: 'CUSCRI' },
      });
    }
  }
}