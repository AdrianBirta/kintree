import type { FamilyMember, FamilyTreeData } from '../types/family';

export interface HierarchyUnitNode {
  unitId: string;
  members: FamilyMember[]; // 1 (single) sau 2 (cuplu)
  children: HierarchyUnitNode[];
}

const PARTNERSHIP_STATUS_PRIORITY: Record<string, number> = {
  MARRIED: 0,
  PARTNER: 1,
  WIDOWED: 2,
  DIVORCED: 3,
};

/**
 * Construiește arborele genealogic ca listă de rădăcini (strămoșii cei mai
 * "de sus" din datele existente), fiecare nod fiind o unitate (cuplu sau
 * persoană singură) cu lista ei de copii (tot unități).
 *
 * Notă: dacă cei doi părinți ai unui copil nu sunt parteneri (ex. divorț,
 * recăsătorire), copilul poate apărea sub ambele "ramuri" — e un
 * comportament acceptabil pentru un meniu de navigare, nu pentru layout-ul
 * vizual al arborelui (acolo se ocupă deja treeLayout.ts de asta).
 */
export function buildMemberHierarchy(treeData?: FamilyTreeData): HierarchyUnitNode[] {
  if (!treeData || treeData.members.length === 0) return [];

  const { members, relations, partnerships } = treeData;
  const membersById = new Map(members.map((m) => [m.id, m]));

  // 1) alegem un singur parteneriat "primar" per persoană
  const validPartnerships = partnerships.filter((p) => p.partnerAId !== p.partnerBId);
  const sortedPartnerships = [...validPartnerships].sort(
    (a, b) => (PARTNERSHIP_STATUS_PRIORITY[a.status] ?? 9) - (PARTNERSHIP_STATUS_PRIORITY[b.status] ?? 9),
  );

  const usedInCouple = new Set<string>();
  const memberToUnit = new Map<string, string>();
  const units = new Map<string, HierarchyUnitNode>();

  for (const p of sortedPartnerships) {
    if (usedInCouple.has(p.partnerAId) || usedInCouple.has(p.partnerBId)) continue;
    const a = membersById.get(p.partnerAId);
    const b = membersById.get(p.partnerBId);
    if (!a || !b) continue;

    const unitId = `u-${p.id}`;
    units.set(unitId, { unitId, members: [a, b], children: [] });
    usedInCouple.add(a.id);
    usedInCouple.add(b.id);
    memberToUnit.set(a.id, unitId);
    memberToUnit.set(b.id, unitId);
  }

  for (const m of members) {
    if (usedInCouple.has(m.id)) continue;
    const unitId = `m-${m.id}`;
    units.set(unitId, { unitId, members: [m], children: [] });
    memberToUnit.set(m.id, unitId);
  }

  // 2) legăm unitățile părinte -> copil
  const parentUnitsOfChildUnit = new Map<string, Set<string>>();
  relations.forEach((rel) => {
    if (rel.parentId === rel.childId) return;
    const parentUnitId = memberToUnit.get(rel.parentId);
    const childUnitId = memberToUnit.get(rel.childId);
    if (!parentUnitId || !childUnitId || parentUnitId === childUnitId) return;

    const set = parentUnitsOfChildUnit.get(childUnitId) ?? new Set<string>();
    set.add(parentUnitId);
    parentUnitsOfChildUnit.set(childUnitId, set);
  });

  const isChildUnit = new Set<string>();
  parentUnitsOfChildUnit.forEach((parentSet, childUnitId) => {
    const childNode = units.get(childUnitId);
    if (!childNode) return;

    parentSet.forEach((parentUnitId) => {
      const parentNode = units.get(parentUnitId);
      if (!parentNode) return;
      if (!parentNode.children.some((c) => c.unitId === childNode.unitId)) {
        parentNode.children.push(childNode);
      }
    });
    isChildUnit.add(childUnitId);
  });

  // 3) sortăm copiii după data nașterii (cei fără dată, la final)
  const sortByBirthDate = (nodes: HierarchyUnitNode[]) => {
    nodes.sort((n1, n2) => {
      const d1 = n1.members[0]?.birthDate ? new Date(n1.members[0].birthDate!).getTime() : Infinity;
      const d2 = n2.members[0]?.birthDate ? new Date(n2.members[0].birthDate!).getTime() : Infinity;
      return d1 - d2;
    });
    nodes.forEach((n) => sortByBirthDate(n.children));
  };

  // 4) rădăcinile = unitățile care nu sunt copil al nimănui (strămoșii)
  const roots = [...units.values()].filter((u) => !isChildUnit.has(u.unitId));
  sortByBirthDate(roots);

  return roots;
}