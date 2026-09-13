import { Controller, Get, Post, Patch, Body, Param, Headers, UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { SharingService } from './sharing.service';
import { FamilyMembersService } from '../family-members/family-members.service';
import { JoinShareLinkDto } from './dto/join-share-link.dto';
import { CreateFamilyMemberDto } from '../family-members/dto/create-family-member.dto';
import { UpdateFamilyMemberDto } from '../family-members/dto/update-family-member.dto';
import { LinkParentChildDto } from '../family-members/dto/link-parent-child.dto';
import { LinkPartnersDto } from '../family-members/dto/link-partners.dto';
import { ShareAccessLevel } from '@prisma/client';
import { imageFileFilter } from '../family-members/utils/image-file-filter';

@Controller('public-share/:token')
export class PublicShareController {
  constructor(
    private readonly sharingService: SharingService,
    private readonly familyMembersService: FamilyMembersService,
  ) { }

  @Post('join')
  join(
    @Param('token') token: string,
    @Headers('x-guest-token') existingGuestToken: string | undefined,
    @Body() dto: JoinShareLinkDto,
  ) {
    return this.sharingService.joinShareLink(token, existingGuestToken, dto);
  }

  // NOU — status curent al invitatului: nivel de acces + câți membri mai
  // poate adăuga. Apelat de GuestSharePage la încărcare și după fiecare
  // membru adăugat, ca să afișeze contorul actualizat.
  @Get('me')
  getGuestStatus(@Param('token') token: string, @Headers('x-guest-token') guestToken: string) {
    return this.sharingService.getGuestStatus(token, guestToken);
  }

  @Get('tree')
  async getTree(@Param('token') token: string, @Headers('x-guest-token') guestToken: string) {
    const link = await this.sharingService.assertGuestAccess(token, guestToken, ShareAccessLevel.READ_ONLY);
    return this.familyMembersService.getFamilyTree(link.ownerId);
  }

  @Post('family-members')
  async createMember(
    @Param('token') token: string,
    @Headers('x-guest-token') guestToken: string,
    @Body() dto: CreateFamilyMemberDto,
  ) {
    const link = await this.sharingService.consumeGuestMemberSlot(token, guestToken);
    return this.familyMembersService.create(link.ownerId, dto);
  }

  @Patch('family-members/:id')
  async updateMember(
    @Param('token') token: string,
    @Headers('x-guest-token') guestToken: string,
    @Param('id') id: string,
    @Body() dto: UpdateFamilyMemberDto,
  ) {
    const link = await this.sharingService.assertGuestAccess(token, guestToken, ShareAccessLevel.EDIT);
    return this.familyMembersService.update(link.ownerId, id, dto);
  }

  @Post('family-members/:id/photo')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 5 * 1024 * 1024 }, fileFilter: imageFileFilter }))
  async uploadPhoto(
    @Param('token') token: string,
    @Headers('x-guest-token') guestToken: string,
    @Param('id') id: string,
    @UploadedFile() file: Parameters<FamilyMembersService['uploadPhoto']>[2],
  ) {
    const link = await this.sharingService.assertGuestAccess(token, guestToken, ShareAccessLevel.EDIT);
    return this.familyMembersService.uploadPhoto(link.ownerId, id, file);
  }

  @Post('relations')
  async linkParentChild(
    @Param('token') token: string,
    @Headers('x-guest-token') guestToken: string,
    @Body() dto: LinkParentChildDto,
  ) {
    const link = await this.sharingService.assertGuestAccess(token, guestToken, ShareAccessLevel.EDIT);
    return this.familyMembersService.linkParentChild(link.ownerId, dto.parentId, dto.childId);
  }

  @Post('partnerships')
  async linkPartners(
    @Param('token') token: string,
    @Headers('x-guest-token') guestToken: string,
    @Body() dto: LinkPartnersDto,
  ) {
    const link = await this.sharingService.assertGuestAccess(token, guestToken, ShareAccessLevel.EDIT);
    return this.familyMembersService.linkPartners(link.ownerId, dto.partnerAId, dto.partnerBId, dto.status);
  }
}