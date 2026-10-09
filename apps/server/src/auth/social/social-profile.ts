export type SocialProvider = 'google' | 'facebook' | 'yahoo';

export interface SocialProfile {
  provider: SocialProvider;
  providerId: string;
  email: string | null;
  // true doar dacă providerul garantează că emailul e verificat;
  // doar atunci legăm contul social de un cont existent cu același email
  emailVerified: boolean;
  firstName: string;
  lastName: string;
  avatarUrl: string | null;
}

// codurile ajung în query-ul front-ului (?error=...), deci rămân scurte și stabile
export type SocialErrorCode = 'social_failed' | 'social_no_email' | 'social_email_unverified';

export class SocialLoginError extends Error {
  constructor(public readonly code: SocialErrorCode) {
    super(code);
  }
}