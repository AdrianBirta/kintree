import { Controller, Post, Get, Body, UseGuards, HttpCode } from '@nestjs/common';
import { DonationsService } from './donations.service';
import { TrackClickDto } from './dto/track-click.dto';
import { JwtAccessGuard } from '../auth/guards/jwt-access.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Role } from '@prisma/client';

@Controller('donations')
export class DonationsController {
  constructor(private readonly donationsService: DonationsService) { }

  // Public — apelat de landing page, fără autentificare, când cineva
  // dă click pe un buton de donație. Nu blocăm userul dacă eșuează.
  @Post('track-click')
  @HttpCode(204)
  trackClick(@Body() dto: TrackClickDto) {
    return this.donationsService.trackClick(dto);
  }

  // Doar pentru tine, ca admin — vezi un sumar rapid al click-urilor.
  @UseGuards(JwtAccessGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Get('summary')
  getSummary() {
    return this.donationsService.getSummary();
  }
}