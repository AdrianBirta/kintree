import apiClient from './apiClient';
import type { FamilyMember, FamilyMemberDetail, FamilyTreeData } from '../types/family';

export const familyMembersService = {
  getTree: () => apiClient.get<FamilyTreeData>('/family-members/tree').then((r) => r.data),
  getAll: () => apiClient.get<FamilyMember[]>('/family-members').then((r) => r.data),
  getOne: (id: string) => apiClient.get<FamilyMemberDetail>(`/family-members/${id}`).then((r) => r.data),
  create: (data: Partial<FamilyMember>) => apiClient.post<FamilyMember>('/family-members', data).then((r) => r.data),
  update: (id: string, data: Partial<FamilyMember>) =>
    apiClient.patch<FamilyMember>(`/family-members/${id}`, data).then((r) => r.data),
  remove: (id: string) => apiClient.delete(`/family-members/${id}`),
  linkParentChild: (parentId: string, childId: string) =>
    apiClient.post('/family-members/relations', { parentId, childId }),
  unlinkParentChild: (parentId: string, childId: string) =>
    apiClient.delete('/family-members/relations', { data: { parentId, childId } }),
  linkPartners: (partnerAId: string, partnerBId: string, status?: string) =>
    apiClient.post('/family-members/partnerships', { partnerAId, partnerBId, status }),
  unlinkPartners: (partnerAId: string, partnerBId: string) =>
    apiClient.delete('/family-members/partnerships', { data: { partnerAId, partnerBId } }),
  updatePosition: (id: string, manualOrder: number | null) =>
    apiClient.patch<FamilyMember>(`/family-members/${id}`, { manualOrder }).then((r) => r.data),

  uploadPhoto: (id: string, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return apiClient
      .post<FamilyMember>(`/family-members/${id}/photo`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then((r) => r.data);
  },

  // NOU — legătura "eu" ↔ membru
  markAsMe: (id: string) => apiClient.post<FamilyMemberDetail>(`/family-members/${id}/mark-as-me`).then((r) => r.data),
  unmarkAsMe: () => apiClient.delete('/family-members/self-link').then((r) => r.data),
  getSelf: () => apiClient.get<FamilyMemberDetail | null>('/family-members/self').then((r) => r.data),
};