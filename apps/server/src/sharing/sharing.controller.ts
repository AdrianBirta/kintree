import { Controller, Get, Post, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { JwtAccessGuard } from '../auth/guards/jwt-access.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { SharingService } from './sharing.service';
import { CreateShareLinkDto } from './dto/create-share-link.dto';
import { GrantTreeAccessDto } from './dto/grant-tree-access.dto';
import { UsersService } from 'src/users/users.service';

@UseGuards(JwtAccessGuard)
@Controller('sharing')
export class SharingController {
  constructor(
    private readonly sharingService: SharingService,
    private readonly usersService: UsersService, // NOU
  ) { }

  // ── linkuri ──
  @Post('links')
  createLink(@CurrentUser() user: { userId: string }, @Body() dto: CreateShareLinkDto) {
    return this.sharingService.createShareLink(user.userId, dto);
  }

  @Get('links')
  listLinks(@CurrentUser() user: { userId: string }) {
    return this.sharingService.listShareLinks(user.userId);
  }

  @Get('trees')
  async listTrees(@CurrentUser() user: { userId: string; email: string }) {
    const me = await this.usersService.findById(user.userId); // ai nevoie de UsersService injectat aici
    return this.sharingService.listAccessibleTrees(user.userId, me!);
  }

  @Post('links/:id/revoke')
  revokeLink(@CurrentUser() user: { userId: string }, @Param('id') id: string) {
    return this.sharingService.revokeShareLink(user.userId, id);
  }

  @Delete('links/:id')
  deleteLink(@CurrentUser() user: { userId: string }, @Param('id') id: string) {
    return this.sharingService.deleteShareLink(user.userId, id);
  }

  // ── acces pe cont ──
  @Post('accounts')
  grantAccountAccess(@CurrentUser() user: { userId: string }, @Body() dto: GrantTreeAccessDto) {
    return this.sharingService.grantTreeAccess(user.userId, dto);
  }

  @Get('accounts/given')
  listGiven(@CurrentUser() user: { userId: string }) {
    return this.sharingService.listGivenTreeAccess(user.userId);
  }

  @Get('accounts/received')
  listReceived(@CurrentUser() user: { userId: string }) {
    return this.sharingService.listReceivedTreeAccess(user.userId);
  }

  @Post('accounts/:id/revoke')
  revokeAccountAccess(@CurrentUser() user: { userId: string }, @Param('id') id: string) {
    return this.sharingService.revokeTreeAccess(user.userId, id);
  }
}