import { create } from 'zustand';
import apiClient from '../api/apiClient';
import i18n from '../i18n/config';

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
  register: (data: { email: string; password: string; firstName: string; lastName: string }) => Promise<void>;
  logout: () => Promise<void>;
  fetchCurrentUser: () => Promise<void>;
  clearError: () => void;
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
      const { data } = await apiClient.post('/auth/register', formData);
      localStorage.setItem('access_token', data.accessToken);
      localStorage.setItem('refresh_token', data.refreshToken);
      set({ user: data.user, isRegistering: false });
    } catch (err: any) {
      set({
        isRegistering: false,
        error: err.response?.data?.message || i18n.t('authErrors.registerFailed'),
      });
      throw err;
    }
  },

  logout: async () => {
    const refreshToken = localStorage.getItem('refresh_token');
    try {
      await apiClient.post('/auth/logout', { refreshToken });
    } catch {
      // ignorăm eroarea — oricum curățăm local
    } finally {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
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
      set({ user: null, isLoading: false });
    }
  },

  clearError: () => set({ error: null }),
}));