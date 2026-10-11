import apiClient from './apiClient';
import type {
  AdminDonation, AdminDonorFilter, AdminSortField, AdminStatusFilter, AdminStats,
  AdminUserDetail, AdminUserListItem, Paginated,
} from '../types/admin';

export interface AdminUsersQuery {
  search?: string;
  status?: AdminStatusFilter;
  donor?: AdminDonorFilter;
  sortBy?: AdminSortField;
  sortDir?: 'asc' | 'desc';
  page: number;
  pageSize: number;
}

export interface CreateDonationPayload {
  userId?: string;
  donorName?: string;
  amount: number;
  currency?: string;
  note?: string;
  donatedAt?: string;
}

export const adminService = {
  getStats: () => apiClient.get<AdminStats>('/admin/stats').then((r) => r.data),

  listUsers: (params: AdminUsersQuery) =>
    apiClient.get<Paginated<AdminUserListItem>>('/admin/users', { params }).then((r) => r.data),
  getUser: (id: string) => apiClient.get<AdminUserDetail>(`/admin/users/${id}`).then((r) => r.data),
  createUser: (data: { email: string; password: string; firstName: string; lastName: string }) =>
    apiClient.post<AdminUserListItem>('/admin/users', data).then((r) => r.data),
  updateUser: (
    id: string,
    data: { email?: string; password?: string; firstName?: string; lastName?: string; disabled?: boolean },
  ) => apiClient.patch<AdminUserListItem>(`/admin/users/${id}`, data).then((r) => r.data),
  deleteUser: (id: string) => apiClient.delete(`/admin/users/${id}`).then((r) => r.data),
  revokeSessions: (id: string) => apiClient.post(`/admin/users/${id}/revoke-sessions`).then((r) => r.data),

  deleteMember: (userId: string, memberId: string) =>
    apiClient.delete(`/admin/users/${userId}/members/${memberId}`).then((r) => r.data),

  createDonation: (data: CreateDonationPayload) =>
    apiClient.post<AdminDonation>('/admin/donations', data).then((r) => r.data),
  deleteDonation: (id: string) => apiClient.delete(`/admin/donations/${id}`).then((r) => r.data),
};