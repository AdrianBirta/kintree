import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-oauth2';
import { SocialProfile } from '../social/social-profile';
import { apiPublicUrl } from '../social/social.config';

@Injectable()
export class YahooStrategy extends PassportStrategy(Strategy, 'yahoo') {
  constructor() {
    super({
      authorizationURL: 'https://api.login.yahoo.com/oauth2/request_auth',
      tokenURL: 'https://api.login.yahoo.com/oauth2/get_token',
      clientID: process.env.YAHOO_CLIENT_ID || 'not-configured',
      clientSecret: process.env.YAHOO_CLIENT_SECRET || 'not-configured',
      callbackURL: `${apiPublicUrl()}/auth/yahoo/callback`,
      scope: ['openid', 'email', 'profile'],
    });
  }

  async validate(accessToken: string): Promise<SocialProfile> {
    const res = await fetch('https://api.login.yahoo.com/openid/v1/userinfo', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!res.ok) throw new UnauthorizedException('Yahoo userinfo failed');

    const data: any = await res.json();
    const fullName: string = data.name ?? '';

    return {
      provider: 'yahoo',
      providerId: data.sub,
      email: data.email ?? null,
      // adresele Yahoo sunt verificate de provider; tratăm lipsa claim-ului ca "verificat"
      emailVerified: data.email_verified !== false,
      firstName: data.given_name || fullName.split(' ')[0] || '',
      lastName: data.family_name || fullName.split(' ').slice(1).join(' ') || '',
      avatarUrl: data.picture ?? null,
    };
  }
}