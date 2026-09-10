import { useMutation, useQueryClient, type QueryClient } from '@tanstack/react-query';
import { familyMembersService } from '../../api/familyMembersService';
import { familyKeys } from '../../api/queryKeys';
import type { FamilyMember, FamilyMemberDetail, FamilyTreeData } from '../../types/family';

// ── invalidare — un singur helper, folosit de toate mutațiile ──
// După orice scriere care poate schimba arborele (relații, poziții,
// membri noi/șterși) invalidăm întotdeauna arborele, lista de membri și
// "eu" — sunt ieftine de refăcut și aproape orice mutație le poate afecta
// pe toate trei indirect. În plus, invalidăm punctual pagina de detaliu a
// oricărui membru implicat direct (dacă id-ul e cunoscut), ca cine se
// află pe MemberDetailPage-ul acelui membru să vadă imediat schimbarea.
export function invalidateFamilyData(queryClient: QueryClient, memberIds: string[] = []) {
  queryClient.invalidateQueries({ queryKey: familyKeys.tree() });
  queryClient.invalidateQueries({ queryKey: familyKeys.members() });
  queryClient.invalidateQueries({ queryKey: familyKeys.self() });
  memberIds.forEach((id) => {
    if (!id) return;
    queryClient.invalidateQueries({ queryKey: familyKeys.memberDetail(id) });
  });
}

export function useCreateMember() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<FamilyMember>) => familyMembersService.create(data),
    onSuccess: () => invalidateFamilyData(queryClient),
  });
}

export function useUpdateMember() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<FamilyMember> }) =>
      familyMembersService.update(id, data),
    onSuccess: (_result, variables) => invalidateFamilyData(queryClient, [variables.id]),
  });
}

export function useRemoveMember() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => familyMembersService.remove(id),
    onSuccess: (_result, id) => {
      invalidateFamilyData(queryClient, [id]);
      // membrul nu mai există — scoatem complet din cache pagina lui de
      // detaliu, ca să nu rămână servită vreodată din cache o versiune "fantomă"
      queryClient.removeQueries({ queryKey: familyKeys.memberDetail(id) });
    },
  });
}

export function useUploadPhoto() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, file }: { id: string; file: File }) => familyMembersService.uploadPhoto(id, file),
    onSuccess: (_result, variables) => invalidateFamilyData(queryClient, [variables.id]),
  });
}

export function useLinkParentChild() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ parentId, childId }: { parentId: string; childId: string }) =>
      familyMembersService.linkParentChild(parentId, childId),
    onSuccess: (_result, variables) =>
      invalidateFamilyData(queryClient, [variables.parentId, variables.childId]),
  });
}

export function useUnlinkParentChild() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ parentId, childId }: { parentId: string; childId: string }) =>
      familyMembersService.unlinkParentChild(parentId, childId),
    onSuccess: (_result, variables) =>
      invalidateFamilyData(queryClient, [variables.parentId, variables.childId]),
  });
}

export function useLinkPartners() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ partnerAId, partnerBId, status }: { partnerAId: string; partnerBId: string; status?: string }) =>
      familyMembersService.linkPartners(partnerAId, partnerBId, status),
    onSuccess: (_result, variables) =>
      invalidateFamilyData(queryClient, [variables.partnerAId, variables.partnerBId]),
  });
}

export function useUnlinkPartners() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ partnerAId, partnerBId }: { partnerAId: string; partnerBId: string }) =>
      familyMembersService.unlinkPartners(partnerAId, partnerBId),
    onSuccess: (_result, variables) =>
      invalidateFamilyData(queryClient, [variables.partnerAId, variables.partnerBId]),
  });
}

export function useMarkAsMe() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => familyMembersService.markAsMe(id),
    onMutate: async (id: string) => {
      // reținem cine era "eu" ÎNAINTE de schimbare, ca să-i putem invalida
      // și lui pagina de detaliu (își pierde badge-ul de "Tu")
      const previousSelf = queryClient.getQueryData<FamilyMemberDetail | null>(familyKeys.self());
      return { previousSelfId: previousSelf?.id, newSelfId: id };
    },
    onSuccess: (_result, id, context) => {
      const ids = [id];
      if (context?.previousSelfId && context.previousSelfId !== id) ids.push(context.previousSelfId);
      invalidateFamilyData(queryClient, ids);
    },
  });
}

export function useUnmarkAsMe() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => familyMembersService.unmarkAsMe(),
    onMutate: async () => {
      const previousSelf = queryClient.getQueryData<FamilyMemberDetail | null>(familyKeys.self());
      return { previousSelfId: previousSelf?.id };
    },
    onSuccess: (_result, _vars, context) =>
      invalidateFamilyData(queryClient, context?.previousSelfId ? [context.previousSelfId] : []),
  });
}

// ── reordonare (drag & drop în arbore) — optimistă ──
// Aici NU așteptăm refetch-ul pentru feedback vizual: actualizăm direct
// cache-ul arborelui (onMutate), ca drag & drop-ul să rămână instant și
// fluid — exact ca înainte. Dacă requestul eșuează, revenim la starea
// dinainte (onError). Indiferent de rezultat, la final invalidăm arborele
// (onSettled), ca să rămână garantat sincronizat cu backend-ul.
export function useReorderMembers() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (updates: { memberId: string; manualOrder: number; manualRank?: number }[]) =>
      Promise.all(
        updates.map((u) =>
          familyMembersService.update(u.memberId, {
            manualOrder: u.manualOrder,
            ...(u.manualRank !== undefined ? { manualRank: u.manualRank } : {}),
          }),
        ),
      ),
    onMutate: async (updates) => {
      await queryClient.cancelQueries({ queryKey: familyKeys.tree() });
      const previousTree = queryClient.getQueryData<FamilyTreeData>(familyKeys.tree());
      if (previousTree) {
        const byId = new Map(updates.map((u) => [u.memberId, u]));
        queryClient.setQueryData<FamilyTreeData>(familyKeys.tree(), {
          ...previousTree,
          members: previousTree.members.map((m) => {
            const u = byId.get(m.id);
            if (!u) return m;
            return {
              ...m,
              manualOrder: u.manualOrder,
              ...(u.manualRank !== undefined ? { manualRank: u.manualRank } : {}),
            };
          }),
        });
      }
      return { previousTree };
    },
    onError: (_err, _updates, context) => {
      if (context?.previousTree) {
        queryClient.setQueryData(familyKeys.tree(), context.previousTree);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: familyKeys.tree() });
    },
  });
}