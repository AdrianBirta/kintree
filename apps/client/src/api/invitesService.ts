import apiClient from './apiClient';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

export interface AppInvite {
  id: string;
  token: string;
  email?: string | null;
  expiresAt?: string | null;
  usedAt?: string | null;
  createdAt: string;
  usedByUser?: { id: string; firstName: string; lastName: string; email: string } | null;
}

export const invitesService = {
  create: (data: { email?: string; expiresAt?: string }) =>
    apiClient.post<AppInvite>('/invites', data).then((r) => r.data),
  list: () => apiClient.get<AppInvite[]>('/invites').then((r) => r.data),
  remove: (id: string) => apiClient.delete(`/invites/${id}`),
  // public — nu folosește apiClient (fără JWT necesar)
  preview: (token: string) =>
    axios.get<{ inviterName: string; email?: string | null }>(`${API_BASE_URL}/invites/public/${token}`).then((r) => r.data),
};