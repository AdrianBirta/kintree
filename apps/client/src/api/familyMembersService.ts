import apiClient from './apiClient';
import type { FamilyMember, FamilyMemberDetail, FamilyTreeData } from '../types/family';
import { getActiveTreeOwnerId } from '../store/activeTreeStore';

// NOU — construiește params cu treeOwnerId dacă vizualizăm alt arbore decât cel propriu
function treeParams() {
  const ownerId = getActiveTreeOwnerId();
  return ownerId ? { treeOwnerId: ownerId } : {};
}

export const familyMembersService = {
  getTree: () => apiClient.get<FamilyTreeData>('/family-members/tree', { params: treeParams() }).then((r) => r.data),
  getAll: () => apiClient.get<FamilyMember[]>('/family-members', { params: treeParams() }).then((r) => r.data),
  getOne: (id: string) => apiClient.get<FamilyMemberDetail>(`/family-members/${id}`, { params: treeParams() }).then((r) => r.data),
  create: (data: Partial<FamilyMember>) => apiClient.post<FamilyMember>('/family-members', data, { params: treeParams() }).then((r) => r.data),
  update: (id: string, data: Partial<FamilyMember>) =>
    apiClient.patch<FamilyMember>(`/family-members/${id}`, data, { params: treeParams() }).then((r) => r.data),
  remove: (id: string) => apiClient.delete(`/family-members/${id}`, { params: treeParams() }),
  linkParentChild: (parentId: string, childId: string) =>
    apiClient.post('/family-members/relations', { parentId, childId }, { params: treeParams() }),
  unlinkParentChild: (parentId: string, childId: string) =>
    apiClient.delete('/family-members/relations', { data: { parentId, childId }, params: treeParams() }),
  linkPartners: (partnerAId: string, partnerBId: string, status?: string) =>
    apiClient.post('/family-members/partnerships', { partnerAId, partnerBId, status }, { params: treeParams() }),
  unlinkPartners: (partnerAId: string, partnerBId: string) =>
    apiClient.delete('/family-members/partnerships', { data: { partnerAId, partnerBId }, params: treeParams() }),
  updatePosition: (id: string, manualOrder: number | null) =>
    apiClient.patch<FamilyMember>(`/family-members/${id}`, { manualOrder }, { params: treeParams() }).then((r) => r.data),

  uploadPhoto: (id: string, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return apiClient
      .post<FamilyMember>(`/family-members/${id}/photo`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        params: treeParams(),
      })
      .then((r) => r.data);
  },

  // "eu" rămâne mereu pe arborele propriu — nu trimitem treeOwnerId
  markAsMe: (id: string) => apiClient.post<FamilyMemberDetail>(`/family-members/${id}/mark-as-me`).then((r) => r.data),
  unmarkAsMe: () => apiClient.delete('/family-members/self-link').then((r) => r.data),
  getSelf: () => apiClient.get<FamilyMemberDetail | null>('/family-members/self').then((r) => r.data),
};