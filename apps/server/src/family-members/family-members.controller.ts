import {
  Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards, UseInterceptors, UploadedFile, Inject, forwardRef,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { FamilyMembersService } from './family-members.service';
import { CreateFamilyMemberDto } from './dto/create-family-member.dto';
import { UpdateFamilyMemberDto } from './dto/update-family-member.dto';
import { LinkParentChildDto } from './dto/link-parent-child.dto';
import { JwtAccessGuard } from '../auth/guards/jwt-access.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { LinkPartnersDto } from 'src/family-members/dto/link-partners.dto';
import { imageFileFilter } from './utils/image-file-filter';
import { SharingService } from '../sharing/sharing.service';
import { ShareAccessLevel } from '@prisma/client';

@UseGuards(JwtAccessGuard)
@Controller('family-members')
export class FamilyMembersController {
  constructor(
    private readonly familyMembersService: FamilyMembersService,
    @Inject(forwardRef(() => SharingService))
    private readonly sharingService: SharingService,
  ) { }

  // NOU — rezolvă ownerId-ul "efectiv" pe care se lucrează: propriul cont,
  // sau, dacă e dat treeOwnerId și e diferit, arborele altcuiva — caz în
  // care se verifică TreeAccess la nivelul cerut (READ_ONLY / EDIT).
  private async resolveOwnerId(
    userId: string,
    treeOwnerId: string | undefined,
    requiredLevel: ShareAccessLevel,
  ): Promise<string> {
    if (!treeOwnerId || treeOwnerId === userId) return userId;
    await this.sharingService.assertAccountAccess(treeOwnerId, userId, requiredLevel);
    return treeOwnerId;
  }

  @Get('tree')
  async getTree(@CurrentUser() user: { userId: string }, @Query('treeOwnerId') treeOwnerId?: string) {
    const ownerId = await this.resolveOwnerId(user.userId, treeOwnerId, ShareAccessLevel.READ_ONLY);
    return this.familyMembersService.getFamilyTree(ownerId);
  }

  @Get('self')
  getSelf(@CurrentUser() user: { userId: string }) {
    return this.familyMembersService.getSelfMember(user.userId);
  }

  @Post('partnerships')
  async linkPartners(
    @CurrentUser() user: { userId: string },
    @Body() dto: LinkPartnersDto,
    @Query('treeOwnerId') treeOwnerId?: string,
  ) {
    const ownerId = await this.resolveOwnerId(user.userId, treeOwnerId, ShareAccessLevel.EDIT);
    return this.familyMembersService.linkPartners(ownerId, dto.partnerAId, dto.partnerBId, dto.status);
  }

  @Delete('partnerships')
  async unlinkPartners(
    @CurrentUser() user: { userId: string },
    @Body() dto: LinkPartnersDto,
    @Query('treeOwnerId') treeOwnerId?: string,
  ) {
    const ownerId = await this.resolveOwnerId(user.userId, treeOwnerId, ShareAccessLevel.EDIT);
    return this.familyMembersService.unlinkPartners(ownerId, dto.partnerAId, dto.partnerBId);
  }

  @Post('relations')
  async linkParentChild(
    @CurrentUser() user: { userId: string },
    @Body() dto: LinkParentChildDto,
    @Query('treeOwnerId') treeOwnerId?: string,
  ) {
    const ownerId = await this.resolveOwnerId(user.userId, treeOwnerId, ShareAccessLevel.EDIT);
    return this.familyMembersService.linkParentChild(ownerId, dto.parentId, dto.childId);
  }

  @Delete('relations')
  async unlinkParentChild(
    @CurrentUser() user: { userId: string },
    @Body() dto: LinkParentChildDto,
    @Query('treeOwnerId') treeOwnerId?: string,
  ) {
    const ownerId = await this.resolveOwnerId(user.userId, treeOwnerId, ShareAccessLevel.EDIT);
    return this.familyMembersService.unlinkParentChild(ownerId, dto.parentId, dto.childId);
  }

  @Delete('self-link')
  unmarkAsMe(@CurrentUser() user: { userId: string }) {
    return this.familyMembersService.unmarkAsMe(user.userId);
  }

  @Post()
  async create(
    @CurrentUser() user: { userId: string },
    @Body() dto: CreateFamilyMemberDto,
    @Query('treeOwnerId') treeOwnerId?: string,
  ) {
    const ownerId = await this.resolveOwnerId(user.userId, treeOwnerId, ShareAccessLevel.EDIT);
    return this.familyMembersService.create(ownerId, dto);
  }

  @Get()
  async findAll(@CurrentUser() user: { userId: string }, @Query('treeOwnerId') treeOwnerId?: string) {
    const ownerId = await this.resolveOwnerId(user.userId, treeOwnerId, ShareAccessLevel.READ_ONLY);
    return this.familyMembersService.findAll(ownerId);
  }

  @Get(':id')
  async findOne(
    @CurrentUser() user: { userId: string },
    @Param('id') id: string,
    @Query('treeOwnerId') treeOwnerId?: string,
  ) {
    const ownerId = await this.resolveOwnerId(user.userId, treeOwnerId, ShareAccessLevel.READ_ONLY);
    return this.familyMembersService.findOne(ownerId, id);
  }

  @Patch(':id')
  async update(
    @CurrentUser() user: { userId: string },
    @Param('id') id: string,
    @Body() dto: UpdateFamilyMemberDto,
    @Query('treeOwnerId') treeOwnerId?: string,
  ) {
    const ownerId = await this.resolveOwnerId(user.userId, treeOwnerId, ShareAccessLevel.EDIT);
    return this.familyMembersService.update(ownerId, id, dto);
  }

  @Post(':id/photo')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 5 * 1024 * 1024 }, fileFilter: imageFileFilter }))
  async uploadPhoto(
    @CurrentUser() user: { userId: string },
    @Param('id') id: string,
    @UploadedFile() file: Parameters<FamilyMembersService['uploadPhoto']>[2],
    @Query('treeOwnerId') treeOwnerId?: string,
  ) {
    const ownerId = await this.resolveOwnerId(user.userId, treeOwnerId, ShareAccessLevel.EDIT);
    return this.familyMembersService.uploadPhoto(ownerId, id, file);
  }

  @Post(':id/mark-as-me')
  markAsMe(@CurrentUser() user: { userId: string }, @Param('id') id: string) {
    return this.familyMembersService.markAsMe(user.userId, id);
  }

  @Delete(':id')
  async remove(
    @CurrentUser() user: { userId: string },
    @Param('id') id: string,
    @Query('treeOwnerId') treeOwnerId?: string,
  ) {
    const ownerId = await this.resolveOwnerId(user.userId, treeOwnerId, ShareAccessLevel.EDIT);
    return this.familyMembersService.remove(ownerId, id);
  }
}