import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { adminService, type AdminUsersQuery } from '../../api/adminService';

export const adminKeys = {
  all: ['admin'] as const,
  stats: () => [...adminKeys.all, 'stats'] as const,
  users: (params: AdminUsersQuery) => [...adminKeys.all, 'users', params] as const,
  user: (id: string) => [...adminKeys.all, 'user', id] as const,
};

export function useAdminStats() {
  return useQuery({ queryKey: adminKeys.stats(), queryFn: adminService.getStats });
}

export function useAdminUsers(params: AdminUsersQuery) {
  return useQuery({
    queryKey: adminKeys.users(params),
    queryFn: () => adminService.listUsers(params),
    placeholderData: keepPreviousData, // fără "clipire" la schimbarea paginii / filtrelor
  });
}

export function useAdminUser(id: string | undefined) {
  return useQuery({
    queryKey: adminKeys.user(id ?? ''),
    queryFn: () => adminService.getUser(id as string),
    enabled: !!id,
  });
}

// orice mutație admin poate afecta statistici + liste + detalii: invalidăm tot spațiul "admin"
function useInvalidateAdmin() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: adminKeys.all });
}

export function useCreateAdminUser() {
  const invalidate = useInvalidateAdmin();
  return useMutation({ mutationFn: adminService.createUser, onSuccess: invalidate });
}

export function useUpdateAdminUser() {
  const invalidate = useInvalidateAdmin();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof adminService.updateUser>[1] }) =>
      adminService.updateUser(id, data),
    onSuccess: invalidate,
  });
}

export function useDeleteAdminUser() {
  const invalidate = useInvalidateAdmin();
  return useMutation({ mutationFn: adminService.deleteUser, onSuccess: invalidate });
}

export function useRevokeAdminSessions() {
  const invalidate = useInvalidateAdmin();
  return useMutation({ mutationFn: adminService.revokeSessions, onSuccess: invalidate });
}

export function useDeleteAdminMember() {
  const invalidate = useInvalidateAdmin();
  return useMutation({
    mutationFn: ({ userId, memberId }: { userId: string; memberId: string }) =>
      adminService.deleteMember(userId, memberId),
    onSuccess: invalidate,
  });
}

export function useCreateDonation() {
  const invalidate = useInvalidateAdmin();
  return useMutation({ mutationFn: adminService.createDonation, onSuccess: invalidate });
}

export function useDeleteDonation() {
  const invalidate = useInvalidateAdmin();
  return useMutation({ mutationFn: adminService.deleteDonation, onSuccess: invalidate });
}