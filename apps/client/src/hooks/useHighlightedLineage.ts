import { useCallback, useMemo, useState } from 'react';
import type { FamilyTreeData } from '../types/family';

export function useHighlightedLineage(treeData: FamilyTreeData | undefined) {
  const [focusId, setFocusId] = useState<string | null>(null);

  const highlighted = useMemo(() => {
    if (!focusId || !treeData) return null;

    const parentsByChild = new Map<string, string[]>();
    const childrenByParent = new Map<string, string[]>();
    treeData.relations.forEach((r) => {
      const parents = parentsByChild.get(r.childId) ?? [];
      parents.push(r.parentId);
      parentsByChild.set(r.childId, parents);
      const children = childrenByParent.get(r.parentId) ?? [];
      children.push(r.childId);
      childrenByParent.set(r.parentId, children);
    });

    const partnersOf = new Map<string, string[]>();
    treeData.partnerships.forEach((p) => {
      const a = partnersOf.get(p.partnerAId) ?? [];
      a.push(p.partnerBId);
      partnersOf.set(p.partnerAId, a);
      const b = partnersOf.get(p.partnerBId) ?? [];
      b.push(p.partnerAId);
      partnersOf.set(p.partnerBId, b);
    });

    // NOU: alianțele (cuscri) intră și ele în lanțul evidențiat la hover
    const alliancesOf = new Map<string, string[]>();
    (treeData.alliances ?? []).forEach((al) => {
      const a = alliancesOf.get(al.memberAId) ?? [];
      a.push(al.memberBId);
      alliancesOf.set(al.memberAId, a);
      const b = alliancesOf.get(al.memberBId) ?? [];
      b.push(al.memberAId);
      alliancesOf.set(al.memberBId, b);
    });

    const visited = new Set<string>();
    const queue = [focusId];
    while (queue.length > 0) {
      const id = queue.shift()!;
      if (visited.has(id)) continue;
      visited.add(id);
      [
        ...(parentsByChild.get(id) ?? []),
        ...(childrenByParent.get(id) ?? []),
        ...(partnersOf.get(id) ?? []),
        ...(alliancesOf.get(id) ?? []),
      ].forEach((relatedId) => queue.push(relatedId));
    }
    return visited;
  }, [focusId, treeData]);

  const isDimmed = useCallback((memberId: string) => highlighted !== null && !highlighted.has(memberId), [highlighted]);

  return { setFocusId, isDimmed };
}