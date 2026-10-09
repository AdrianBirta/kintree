import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, Profile } from 'passport-facebook';
import { SocialProfile } from '../social/social-profile';
import { apiPublicUrl } from '../social/social.config';

@Injectable()
export class FacebookStrategy extends PassportStrategy(Strategy, 'facebook') {
  constructor() {
    super({
      clientID: process.env.FACEBOOK_APP_ID || 'not-configured',
      clientSecret: process.env.FACEBOOK_APP_SECRET || 'not-configured',
      callbackURL: `${apiPublicUrl()}/auth/facebook/callback`,
      scope: ['email'],
      profileFields: ['id', 'emails', 'name', 'displayName', 'photos'],
    });
  }

  validate(_accessToken: string, _refreshToken: string, profile: Profile): SocialProfile {
    const email = profile.emails?.[0]?.value ?? null;
    return {
      provider: 'facebook',
      providerId: profile.id,
      email,
      // Facebook returnează doar emailuri confirmate; conturile fără email (doar telefon) vin cu email null
      emailVerified: !!email,
      firstName: profile.name?.givenName || profile.displayName?.split(' ')[0] || '',
      lastName: profile.name?.familyName || '',
      avatarUrl: profile.photos?.[0]?.value ?? null,
    };
  }
}