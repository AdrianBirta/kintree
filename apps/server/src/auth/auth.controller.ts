import { Controller, Get, Post, Body, UseGuards, Req, Res, HttpCode } from '@nestjs/common';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { ResendVerificationDto } from './dto/resend-verification.dto';
import { ExchangeSocialCodeDto } from './dto/exchange-social-code.dto';
import { JwtRefreshGuard } from './guards/jwt-refresh.guard';
import { JwtAccessGuard } from './guards/jwt-access.guard';
import { GoogleAuthGuard, FacebookAuthGuard, YahooAuthGuard } from './guards/social-auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';
import { SocialProfile, SocialLoginError } from './social/social-profile';
import { frontendUrl } from './social/social.config';

type SocialRequest = Request & { user?: SocialProfile | null; oauthInvite?: string };

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) { }

  @UseGuards(JwtAccessGuard)
  @Get('me')
  me(@CurrentUser() user: { userId: string; email: string; role: string }) {
    return this.authService.getCurrentUser(user.userId);
  }

  // ─────────── ÎNREGISTRARE + CONFIRMARE EMAIL ───────────

  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @HttpCode(200)
  @Post('verify-email')
  verifyEmail(@Body() dto: VerifyEmailDto) {
    return this.authService.verifyEmail(dto);
  }

  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @HttpCode(200)
  @Post('resend-verification')
  resendVerification(@Body() dto: ResendVerificationDto) {
    return this.authService.resendVerification(dto);
  }

  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  // ─────────── RESET PAROLĂ ───────────

  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @HttpCode(200)
  @Post('forgot-password')
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto);
  }

  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @HttpCode(200)
  @Post('reset-password')
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto);
  }

  @UseGuards(JwtRefreshGuard)
  @Post('refresh')
  refresh(@Req() req: Request & { user: { userId: string; refreshToken: string } }) {
    return this.authService.refresh(req.user.userId, req.user.refreshToken);
  }

  @UseGuards(JwtAccessGuard)
  @Post('logout')
  logout(
    @CurrentUser() user: { userId: string },
    @Body() body: { refreshToken?: string },
  ) {
    return this.authService.logout(user.userId, body?.refreshToken);
  }

  // ─────────── SOCIAL LOGIN ───────────

  // schimbă codul de unică folosință pe token-uri
  @Post('social/exchange')
  exchangeSocialCode(@Body() dto: ExchangeSocialCodeDto) {
    return this.authService.exchangeSocialCode(dto.code);
  }

  // Google
  @Get('google')
  @UseGuards(GoogleAuthGuard)
  googleAuth() { /* guard-ul face redirect către Google */ }

  @Get('google/callback')
  @UseGuards(GoogleAuthGuard)
  googleCallback(@Req() req: SocialRequest, @Res() res: Response) {
    return this.finishSocialLogin(req, res);
  }

  // Facebook
  @Get('facebook')
  @UseGuards(FacebookAuthGuard)
  facebookAuth() { /* redirect */ }

  @Get('facebook/callback')
  @UseGuards(FacebookAuthGuard)
  facebookCallback(@Req() req: SocialRequest, @Res() res: Response) {
    return this.finishSocialLogin(req, res);
  }

  // Yahoo
  @Get('yahoo')
  @UseGuards(YahooAuthGuard)
  yahooAuth() { /* redirect */ }

  @Get('yahoo/callback')
  @UseGuards(YahooAuthGuard)
  yahooCallback(@Req() req: SocialRequest, @Res() res: Response) {
    return this.finishSocialLogin(req, res);
  }

  private async finishSocialLogin(req: SocialRequest, res: Response) {
    const front = frontendUrl();
    const profile = req.user;

    if (!profile) return res.redirect(`${front}/auth?error=social_failed`);

    try {
      const code = await this.authService.createSocialLoginCode(profile, req.oauthInvite);
      return res.redirect(`${front}/auth/callback?code=${encodeURIComponent(code)}`);
    } catch (err) {
      const reason = err instanceof SocialLoginError ? err.code : 'social_failed';
      return res.redirect(`${front}/auth?error=${reason}`);
    }
  }
}