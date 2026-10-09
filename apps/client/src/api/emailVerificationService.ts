import apiClient from './apiClient';

export const emailVerificationService = {
  resend: (email: string, lang: string) =>
    apiClient.post('/auth/resend-verification', { email, lang }).then((r) => r.data),
};