import { ExecutionContext, Injectable, Type } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { JwtService } from '@nestjs/jwt';
import type { Request, Response } from 'express';
import { frontendUrl } from '../social/social.config';

const stateSecret = () => `${process.env.JWT_ACCESS_SECRET}:oauth-state`;

function createSocialGuard(strategy: 'google' | 'facebook' | 'yahoo'): Type<any> {
  @Injectable()
  class SocialGuard extends AuthGuard(strategy) {
    constructor(private readonly jwtService: JwtService) {
      super();
    }

    private isCallback(req: Request) {
      return !!(req.query.code || req.query.error);
    }

    // pasul 1 (redirect către provider): generăm state-ul
    getAuthenticateOptions(context: ExecutionContext) {
      const req = context.switchToHttp().getRequest<Request>();
      if (this.isCallback(req)) return {};

      const invite = typeof req.query.invite === 'string' ? req.query.invite : undefined;
      const state = this.jwtService.sign(
        { typ: 'oauth_state', invite },
        { secret: stateSecret(), expiresIn: '10m' },
      );
      return { state, session: false };
    }

    async canActivate(context: ExecutionContext): Promise<boolean> {
      const http = context.switchToHttp();
      const req = http.getRequest<Request & { oauthInvite?: string }>();
      const res = http.getResponse<Response>();

      // pasul 2 (callback): verificăm state-ul
      if (this.isCallback(req)) {
        try {
          const payload: any = this.jwtService.verify(String(req.query.state ?? ''), { secret: stateSecret() });
          if (payload.typ !== 'oauth_state') throw new Error('bad state');
          req.oauthInvite = payload.invite;
        } catch {
          res.redirect(`${frontendUrl()}/auth?error=social_failed`);
          return false;
        }
      }

      return (await super.canActivate(context)) as boolean;
    }

    // dacă userul refuză / providerul dă eroare: nu aruncăm 401, controllerul face redirect
    handleRequest(_err: any, user: any) {
      return user || null;
    }
  }

  return SocialGuard;
}

export const GoogleAuthGuard = createSocialGuard('google');
export const FacebookAuthGuard = createSocialGuard('facebook');
export const YahooAuthGuard = createSocialGuard('yahoo');