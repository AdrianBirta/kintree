import apiClient from './apiClient';

export const passwordResetService = {
  requestReset: (email: string, lang: string) =>
    apiClient.post('/auth/forgot-password', { email, lang }).then((r) => r.data),

  reset: (token: string, password: string) =>
    apiClient.post('/auth/reset-password', { token, password }).then((r) => r.data),
};