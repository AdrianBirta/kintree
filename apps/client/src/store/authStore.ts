import { create } from 'zustand';
import apiClient from '../api/apiClient';
import i18n from '../i18n/config';
import { queryClient } from '../lib/queryClient';
import { useActiveTreeStore } from './activeTreeStore';

export interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'USER' | 'ADMIN';
}

interface AuthState {
  user: AuthUser | null;
  isLoading: boolean;
  isLoggingIn: boolean;
  isRegistering: boolean;
  error: string | null;

  login: (email: string, password: string) => Promise<void>;
  // NU mai autentifică: trimite un email de confirmare. Contul se creează la click pe link.
  register: (data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    inviteToken?: string;
    lang?: string;
  }) => Promise<void>;
  // folosit de pagina /verify-email: creează contul și autentifică utilizatorul
  verifyEmail: (token: string) => Promise<void>;
  socialLogin: (code: string) => Promise<void>;
  logout: () => Promise<void>;
  fetchCurrentUser: () => Promise<void>;
  clearError: () => void;
}

// resetează orice stare legată de userul anterior: arborele "activ" selectat
// și tot cache-ul React Query
function resetPerUserState() {
  useActiveTreeStore.getState().setActiveOwner(null);
  queryClient.clear();
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: true,
  isLoggingIn: false,
  isRegistering: false,
  error: null,

  login: async (email, password) => {
    set({ isLoggingIn: true, error: null });
    try {
      const { data } = await apiClient.post('/auth/login', { email, password });
      localStorage.setItem('access_token', data.accessToken);
      localStorage.setItem('refresh_token', data.refreshToken);
      resetPerUserState();
      set({ user: data.user, isLoggingIn: false });
    } catch (err: any) {
      set({
        isLoggingIn: false,
        error: err.response?.data?.message || i18n.t('authErrors.loginFailed'),
      });
      throw err;
    }
  },

  register: async (formData) => {
    set({ isRegistering: true, error: null });
    try {
      await apiClient.post('/auth/register', formData);
      set({ isRegistering: false });
    } catch (err: any) {
      const message = err.response?.data?.message;
      set({
        isRegistering: false,
        // validările întorc un array de mesaje: afișăm primul
        error: (Array.isArray(message) ? message[0] : message) || i18n.t('authErrors.registerFailed'),
      });
      throw err;
    }
  },

  verifyEmail: async (token) => {
    const { data } = await apiClient.post('/auth/verify-email', { token });
    localStorage.setItem('access_token', data.accessToken);
    localStorage.setItem('refresh_token', data.refreshToken);
    resetPerUserState();
    set({ user: data.user });
  },

  socialLogin: async (code) => {
    set({ isLoggingIn: true, error: null });
    try {
      const { data } = await apiClient.post('/auth/social/exchange', { code });
      localStorage.setItem('access_token', data.accessToken);
      localStorage.setItem('refresh_token', data.refreshToken);
      resetPerUserState();
      set({ user: data.user, isLoggingIn: false });
    } catch (err: any) {
      set({
        isLoggingIn: false,
        error: err.response?.data?.message || i18n.t('authErrors.loginFailed'),
      });
      throw err;
    }
  },

  logout: async () => {
    const refreshToken = localStorage.getItem('refresh_token');
    try {
      await apiClient.post('/auth/logout', { refreshToken });
    } catch {
      // ignorăm eroarea, oricum curățăm local
    } finally {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      resetPerUserState();
      set({ user: null });
    }
  },

  fetchCurrentUser: async () => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      set({ user: null, isLoading: false });
      return;
    }
    try {
      const { data } = await apiClient.get('/auth/me');
      set({ user: data, isLoading: false });
    } catch {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      resetPerUserState();
      set({ user: null, isLoading: false });
    }
  },

  clearError: () => set({ error: null }),
}));