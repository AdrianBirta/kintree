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
  register: (data: { email: string; password: string; firstName: string; lastName: string; inviteToken?: string }) => Promise<void>;
  logout: () => Promise<void>;
  fetchCurrentUser: () => Promise<void>;
  clearError: () => void;
}

// NOU — resetează orice stare legată de userul anterior: arborele "activ"
// selectat (dacă viziona arborele altcuiva) și tot cache-ul React Query
// (tree, members, self etc.). Fără asta, la schimbarea contului rămân
// vizibile date stale ale userului precedent până la un refresh manual.
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
      resetPerUserState(); // NOU — curăță orice date rămase de la un cont anterior
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
      resetPerUserState(); // NOU
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
      resetPerUserState(); // NOU — esențial: elimină arborele "activ" și cache-ul
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
      resetPerUserState(); // NOU — dacă token-ul era invalid, curățăm tot
      set({ user: null, isLoading: false });
    }
  },

  clearError: () => set({ error: null }),
}));