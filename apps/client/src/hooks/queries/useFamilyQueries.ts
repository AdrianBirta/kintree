import { useQuery } from '@tanstack/react-query';
import { familyMembersService } from '../../api/familyMembersService';
import { familyKeys } from '../../api/queryKeys';

// ── citiri — un singur loc de adevăr pentru fiecare tip de date ──
// Orice pagină/componentă care are nevoie de arbore, de lista de membri, de
// un membru anume sau de "eu" folosește hook-ul de aici, NU apelează
// familyMembersService direct. Așa, două pagini care cer același lucru
// (ex. arborele, cerut și de Header și de DashboardPage) ajung să
// folosească exact aceeași cheie de query — React Query le deduplichează
// automat: un singur request în zbor, un singur loc în cache, ambele
// componente văd instant același rezultat.

export function useTreeQuery() {
  return useQuery({
    queryKey: familyKeys.tree(),
    queryFn: familyMembersService.getTree,
  });
}

// NOU — lista "plată" de membri e deja conținută integral în arbore
// (`treeData.members`), așa că nu mai cerem separat endpoint-ul
// /family-members: ar fi fost același request, dus de două ori. Orice
// componentă care avea nevoie doar de listă (fără relații) folosește tot
// acest hook, dar citește automat din cache-ul arborelui.
export function useMembersQuery() {
  const treeQuery = useTreeQuery();
  return {
    ...treeQuery,
    data: treeQuery.data?.members,
  };
}

export function useMemberQuery(id: string | undefined) {
  return useQuery({
    queryKey: familyKeys.memberDetail(id ?? ''),
    queryFn: () => familyMembersService.getOne(id as string),
    enabled: !!id,
  });
}

export function useSelfQuery() {
  return useQuery({
    queryKey: familyKeys.self(),
    queryFn: familyMembersService.getSelf,
  });
}