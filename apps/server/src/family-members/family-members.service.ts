import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateFamilyMemberDto } from './dto/create-family-member.dto';
import { UpdateFamilyMemberDto } from './dto/update-family-member.dto';

@Injectable()
export class FamilyMembersService {
  constructor(private prisma: PrismaService) { }

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
    return this.prisma.familyMember.delete({ where: { id } });
  }

  async getFamilyTree(userId: string) {
    const members = await this.prisma.familyMember.findMany({
      where: { ownerId: userId },
    });

    const relations = await this.prisma.parentChild.findMany({
      where: { parent: { ownerId: userId } },
    });

    const partnerships = await this.prisma.partnership.findMany({
      where: { partnerA: { ownerId: userId } },
    });

    return { members, relations, partnerships };
  }

  async linkParentChild(userId: string, parentId: string, childId: string) {
    await this.findOne(userId, parentId);
    await this.findOne(userId, childId);

    return this.prisma.parentChild.create({
      data: { parentId, childId },
    });
  }

  async unlinkParentChild(userId: string, parentId: string, childId: string) {
    await this.findOne(userId, parentId);
    await this.findOne(userId, childId);

    return this.prisma.parentChild.deleteMany({
      where: { parentId, childId },
    });
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

    if (existing) {
      return this.prisma.partnership.update({
        where: { id: existing.id },
        data: { status: (status as any) ?? existing.status },
      });
    }

    return this.prisma.partnership.create({
      data: { partnerAId: a, partnerBId: b, status: (status as any) ?? 'MARRIED' },
    });
  }

  async unlinkPartners(userId: string, partnerAId: string, partnerBId: string) {
    await this.findOne(userId, partnerAId);
    await this.findOne(userId, partnerBId);

    return this.prisma.partnership.deleteMany({
      where: {
        OR: [
          { partnerAId, partnerBId },
          { partnerAId: partnerBId, partnerBId: partnerAId },
        ],
      },
    });
  }
}