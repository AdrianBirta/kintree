import {
  Body, Controller, Delete, Get, HttpCode, Param, ParseUUIDPipe, Patch, Post, Query, UseGuards,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { JwtAccessGuard } from '../auth/guards/jwt-access.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AdminService } from './admin.service';
import { ListUsersQueryDto } from './dto/list-users-query.dto';
import { AdminCreateUserDto } from './dto/create-user.dto';
import { AdminUpdateUserDto } from './dto/update-user.dto';
import { CreateDonationDto } from './dto/create-donation.dto';

// TOATE rutele din acest controller sunt accesibile DOAR rolului ADMIN
@UseGuards(JwtAccessGuard, RolesGuard)
@Roles(Role.ADMIN)
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) { }

  @Get('stats')
  getStats() {
    return this.adminService.getStats();
  }

  // ── useri ──
  @Get('users')
  listUsers(@Query() query: ListUsersQueryDto) {
    return this.adminService.listUsers(query);
  }

  @Post('users')
  createUser(@Body() dto: AdminCreateUserDto) {
    return this.adminService.createUser(dto);
  }

  @Get('users/:id')
  getUser(@Param('id', ParseUUIDPipe) id: string) {
    return this.adminService.getUserDetail(id);
  }

  @Patch('users/:id')
  updateUser(@Param('id', ParseUUIDPipe) id: string, @Body() dto: AdminUpdateUserDto) {
    return this.adminService.updateUser(id, dto);
  }

  @Delete('users/:id')
  deleteUser(@CurrentUser() admin: { userId: string }, @Param('id', ParseUUIDPipe) id: string) {
    return this.adminService.deleteUser(admin.userId, id);
  }

  @HttpCode(200)
  @Post('users/:id/revoke-sessions')
  revokeSessions(@Param('id', ParseUUIDPipe) id: string) {
    return this.adminService.revokeSessions(id);
  }

  // ── moderare arbore ──
  @Delete('users/:id/members/:memberId')
  removeMember(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('memberId', ParseUUIDPipe) memberId: string,
  ) {
    return this.adminService.removeMember(id, memberId);
  }

  // ── donații ──
  @Post('donations')
  createDonation(@Body() dto: CreateDonationDto) {
    return this.adminService.createDonation(dto);
  }

  @Delete('donations/:id')
  deleteDonation(@Param('id', ParseUUIDPipe) id: string) {
    return this.adminService.deleteDonation(id);
  }
}