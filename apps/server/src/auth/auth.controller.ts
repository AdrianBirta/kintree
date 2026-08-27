import { Controller, Get, Post, Body, UseGuards, Req } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtRefreshGuard } from './guards/jwt-refresh.guard';
import { JwtAccessGuard } from './guards/jwt-access.guard';
import { CurrentUser } from './decorators/current-user.decorator';
import { Request } from 'express';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) { }

  @UseGuards(JwtAccessGuard)
  @Get('me')
  me(@CurrentUser() user: { userId: string; email: string; role: string }) {
    return this.authService.getCurrentUser(user.userId);
  }

  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @UseGuards(JwtRefreshGuard)
  @Post('refresh')
  refresh(@Req() req: Request & { user: { userId: string; refreshToken: string } }) {
    return this.authService.refresh(req.user.userId, req.user.refreshToken);
  }

  @UseGuards(JwtAccessGuard)
  @Post('logout')
  logout(@CurrentUser() user: { userId: string }) {
    return this.authService.logout(user.userId);
  }
}