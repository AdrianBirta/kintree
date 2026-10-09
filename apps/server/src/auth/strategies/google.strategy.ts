import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, Profile } from 'passport-google-oauth20';
import { SocialProfile } from '../social/social-profile';
import { apiPublicUrl } from '../social/social.config';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor() {
    super({
      clientID: process.env.GOOGLE_CLIENT_ID || 'not-configured',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || 'not-configured',
      callbackURL: `${apiPublicUrl()}/auth/google/callback`,
      scope: ['openid', 'email', 'profile'],
    });
  }

  validate(_accessToken: string, _refreshToken: string, profile: Profile): SocialProfile {
    const email = profile.emails?.[0];
    return {
      provider: 'google',
      providerId: profile.id,
      email: email?.value ?? null,
      emailVerified: Boolean(email?.verified),
      firstName: profile.name?.givenName || profile.displayName?.split(' ')[0] || '',
      lastName: profile.name?.familyName || '',
      avatarUrl: profile.photos?.[0]?.value ?? null,
    };
  }
}