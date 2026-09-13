import { Controller, Get, Post, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { JwtAccessGuard } from '../auth/guards/jwt-access.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { InvitesService } from './invites.service';
import { CreateInviteDto } from './dto/create-invite.dto';

@Controller('invites')
export class InvitesController {
  constructor(private readonly invitesService: InvitesService) { }

  @UseGuards(JwtAccessGuard)
  @Post()
  create(@CurrentUser() user: { userId: string }, @Body() dto: CreateInviteDto) {
    return this.invitesService.createInvite(user.userId, dto);
  }

  @UseGuards(JwtAccessGuard)
  @Get()
  list(@CurrentUser() user: { userId: string }) {
    return this.invitesService.listInvites(user.userId);
  }

  @UseGuards(JwtAccessGuard)
  @Delete(':id')
  remove(@CurrentUser() user: { userId: string }, @Param('id') id: string) {
    return this.invitesService.deleteInvite(user.userId, id);
  }

  // public — pentru pagina de acceptare invitație, înainte de autentificare
  @Get('public/:token')
  preview(@Param('token') token: string) {
    return this.invitesService.getValidInvitePreview(token);
  }
}