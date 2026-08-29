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

    const alliancesOf = new Map<string, string[]>();
    (treeData.alliances ?? []).forEach((al) => {
      const a = alliancesOf.get(al.memberAId) ?? [];
      a.push(al.memberBId);
      alliancesOf.set(al.memberAId, a);
      const b = alliancesOf.get(al.memberBId) ?? [];
      b.push(al.memberAId);
      alliancesOf.set(al.memberBId, b);
    });

    // 1) Linia de sânge a persoanei asupra căreia stă cursorul: strămoși + descendenți.
    //    Aici căutarea RĂMÂNE nelimitată — asta chiar înseamnă "lineage".
    const bloodline = new Set<string>([focusId]);

    const upQueue = [focusId];
    while (upQueue.length > 0) {
      const id = upQueue.shift()!;
      (parentsByChild.get(id) ?? []).forEach((parentId) => {
        if (!bloodline.has(parentId)) {
          bloodline.add(parentId);
          upQueue.push(parentId);
        }
      });
    }

    const downQueue = [focusId];
    while (downQueue.length > 0) {
      const id = downQueue.shift()!;
      (childrenByParent.get(id) ?? []).forEach((childId) => {
        if (!bloodline.has(childId)) {
          bloodline.add(childId);
          downQueue.push(childId);
        }
      });
    }

    // 2) Partenerii direcți ai fiecărei persoane din linia de sânge — UN SINGUR pas.
    //    Nu continuăm căutarea mai departe pornind de la ei, altfel am ajunge din nou
    //    să "inundăm" tot arborele prin părinții/rudele partenerului.
    const visited = new Set(bloodline);
    bloodline.forEach((id) => {
      (partnersOf.get(id) ?? []).forEach((partnerId) => visited.add(partnerId));
    });

    // 3) Alianțele (cuscri) — tot un singur pas, doar pentru cei deja evidențiați.
    //    Arată legătura dintre familii, dar nu sare mai departe în cealaltă familie extinsă.
    const withAlliances = new Set(visited);
    visited.forEach((id) => {
      (alliancesOf.get(id) ?? []).forEach((alliedId) => withAlliances.add(alliedId));
    });

    return withAlliances;
  }, [focusId, treeData]);

  const isDimmed = useCallback(
    (memberId: string) => highlighted !== null && !highlighted.has(memberId),
    [highlighted],
  );

  return { setFocusId, isDimmed };
}