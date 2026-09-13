import apiClient from './apiClient';
import type { ShareLink, TreeAccessGrant, ShareAccessLevel } from '../types/sharing';

export interface AccessibleTrees {
  own: { ownerId: string; firstName: string; lastName: string; email: string };
  received: {
    accessId: string;
    ownerId: string;
    firstName: string;
    lastName: string;
    email: string;
    accessLevel: ShareAccessLevel;
    expiresAt?: string | null;
  }[];
}

export const sharingService = {
  createLink: (data: {
    accessLevel: ShareAccessLevel;
    expiresAt?: string;
    maxUses?: number;
    maxMembersPerGuest?: number; // NOU
    label?: string;
  }) => apiClient.post<ShareLink>('/sharing/links', data).then((r) => r.data),
  listLinks: () => apiClient.get<ShareLink[]>('/sharing/links').then((r) => r.data),
  revokeLink: (id: string) => apiClient.post<ShareLink>(`/sharing/links/${id}/revoke`).then((r) => r.data),
  deleteLink: (id: string) => apiClient.delete(`/sharing/links/${id}`),

  grantAccountAccess: (data: { email: string; accessLevel: ShareAccessLevel; expiresAt?: string }) =>
    apiClient.post<TreeAccessGrant>('/sharing/accounts', data).then((r) => r.data),
  listGiven: () => apiClient.get<TreeAccessGrant[]>('/sharing/accounts/given').then((r) => r.data),
  listReceived: () => apiClient.get<TreeAccessGrant[]>('/sharing/accounts/received').then((r) => r.data),
  revokeAccountAccess: (id: string) => apiClient.post<TreeAccessGrant>(`/sharing/accounts/${id}/revoke`),
  listTrees: () => apiClient.get<AccessibleTrees>('/sharing/trees').then((r) => r.data),
};