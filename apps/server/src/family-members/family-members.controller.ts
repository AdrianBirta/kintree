import {
  Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, UseInterceptors, UploadedFile,
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

@UseGuards(JwtAccessGuard)
@Controller('family-members')
export class FamilyMembersController {
  constructor(private readonly familyMembersService: FamilyMembersService) { }

  @Get('tree')
  getTree(@CurrentUser() user: { userId: string }) {
    return this.familyMembersService.getFamilyTree(user.userId);
  }

  @Post('partnerships')
  linkPartners(@CurrentUser() user: { userId: string }, @Body() dto: LinkPartnersDto) {
    return this.familyMembersService.linkPartners(user.userId, dto.partnerAId, dto.partnerBId, dto.status);
  }

  @Delete('partnerships')
  unlinkPartners(@CurrentUser() user: { userId: string }, @Body() dto: LinkPartnersDto) {
    return this.familyMembersService.unlinkPartners(user.userId, dto.partnerAId, dto.partnerBId);
  }

  @Post('relations')
  linkParentChild(@CurrentUser() user: { userId: string }, @Body() dto: LinkParentChildDto) {
    return this.familyMembersService.linkParentChild(user.userId, dto.parentId, dto.childId);
  }

  @Delete('relations')
  unlinkParentChild(@CurrentUser() user: { userId: string }, @Body() dto: LinkParentChildDto) {
    return this.familyMembersService.unlinkParentChild(user.userId, dto.parentId, dto.childId);
  }

  @Post()
  create(@CurrentUser() user: { userId: string }, @Body() dto: CreateFamilyMemberDto) {
    return this.familyMembersService.create(user.userId, dto);
  }

  @Get()
  findAll(@CurrentUser() user: { userId: string }) {
    return this.familyMembersService.findAll(user.userId);
  }

  @Get(':id')
  findOne(@CurrentUser() user: { userId: string }, @Param('id') id: string) {
    return this.familyMembersService.findOne(user.userId, id);
  }

  @Patch(':id')
  update(@CurrentUser() user: { userId: string }, @Param('id') id: string, @Body() dto: UpdateFamilyMemberDto) {
    return this.familyMembersService.update(user.userId, id, dto);
  }

  // NOU — încărcare poză de profil (multipart/form-data, câmpul "file")
  @Post(':id/photo')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
      fileFilter: imageFileFilter,
    }),
  )
  uploadPhoto(
    @CurrentUser() user: { userId: string },
    @Param('id') id: string,
    @UploadedFile() file: Parameters<FamilyMembersService['uploadPhoto']>[2],
  ) {
    return this.familyMembersService.uploadPhoto(user.userId, id, file);
  }

  @Delete(':id')
  remove(@CurrentUser() user: { userId: string }, @Param('id') id: string) {
    return this.familyMembersService.remove(user.userId, id);
  }
}