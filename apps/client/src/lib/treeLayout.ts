import type { FamilyMember, FamilyTreeData, Partnership } from '../types/family';

// ─────────────────────────────────────────────────────────────
// CONSTANTE — reglează doar aici, algoritmul nu se schimbă
// ─────────────────────────────────────────────────────────────
export const LAYOUT = {
  CARD_WIDTH: 180,
  CARD_HEIGHT: 120,
  COUPLE_GAP: 24,
  SIBLING_GAP: 40,
  RANK_GAP: 130,
  UNION_SIZE: 14,
  COUPLE_FRAME_PADDING: 14,
  MAX_ORDER_PASSES: 12,
  MAX_COORD_PASSES: 8,
  COORD_EPSILON: 0.5,
  MAX_TRANSPOSE_PASSES: 20, // de obicei converge în 2-5 treceri pt. un arbore de dimensiunea ta
};

// ─────────────────────────────────────────────────────────────
// TIPURI DE IEȘIRE
// ─────────────────────────────────────────────────────────────
export interface LayoutMemberPosition {
  id: string;
  x: number;
  y: number;
  rank: number;      // NOU
  unitId: string;    // NOU
  member: FamilyMember;
}

export interface LayoutCoupleFrame {
  unitId: string;
  rank: number;       // NOU
  x: number;
  y: number;
  width: number;
  height: number;
  unionX: number;
  unionY: number;
}

export interface LayoutEdge {
  id: string;
  path: string;
  kind: 'parent-child' | 'union-child' | 'secondary-partner';
  long?: boolean; // NOU: sare peste >1 generație — semnul vizual al "cuscrilor din ramuri diferite"
}

export interface FamilyTreeLayout {
  members: LayoutMemberPosition[];
  couples: LayoutCoupleFrame[];
  edges: LayoutEdge[];
  contentWidth: number;
  contentHeight: number;
}

// ─────────────────────────────────────────────────────────────
// TIPURI INTERNE
// ─────────────────────────────────────────────────────────────
interface Unit {
  id: string;                 // 'u-<partnershipId>' sau 'm-<memberId>'
  rank: number;
  memberIds: string[];        // 1 sau 2 elemente
  partnershipId?: string;
}

// ─────────────────────────────────────────────────────────────
// UTILITARE MICI
// ─────────────────────────────────────────────────────────────
function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor((sorted.length - 1) / 2);
  return sorted.length % 2 === 1 ? sorted[mid] : (sorted[mid] + sorted[mid + 1]) / 2;
}

function arraysEqual(a: string[], b: string[]): boolean {
  return a.length === b.length && a.every((v, i) => v === b[i]);
}

function getManualOrderByUnit(units: Unit[], membersById: Map<string, FamilyMember>): Map<string, number> {
  const map = new Map<string, number>();
  for (const unit of units) {
    for (const memberId of unit.memberIds) {
      const m = membersById.get(memberId);
      if (m?.manualOrder != null) {
        map.set(unit.id, m.manualOrder);
        break;
      }
    }
  }
  return map;
}

// ─────────────────────────────────────────────────────────────
// PASUL 1 — RANKING (generații) prin relaxare iterativă
// ─────────────────────────────────────────────────────────────
function computeRanks(
  members: FamilyMember[],
  relations: { parentId: string; childId: string }[],
  partnerships: Partnership[],
): Map<string, number> {
  const rank = new Map<string, number>();
  members.forEach((m) => rank.set(m.id, 0));

  // ignorăm relații evident corupte (cineva "propriul părinte") ca să nu strice iterația
  const validRelations = relations.filter((r) => r.parentId !== r.childId);
  const maxIter = members.length + partnerships.length + 5; // limită de siguranță anti-buclă

  let stabilized = false;

  for (let iter = 0; iter < maxIter; iter++) {
    let changed = false;

    // regula 1: copilul e cu cel puțin un nivel sub părinte
    for (const rel of validRelations) {
      const pr = rank.get(rel.parentId);
      const cr = rank.get(rel.childId);
      if (pr === undefined || cr === undefined) continue;
      if (cr < pr + 1) {
        rank.set(rel.childId, pr + 1);
        changed = true;
      }
    }

    // regula 2: partenerii sunt mereu pe același nivel (egalăm la maxim) —
    // asta ridică automat partenerul "din afară", fără părinți proprii, la rank-ul corect
    for (const p of partnerships) {
      if (p.partnerAId === p.partnerBId) continue;
      const ra = rank.get(p.partnerAId);
      const rb = rank.get(p.partnerBId);
      if (ra === undefined || rb === undefined) continue;
      const maxR = Math.max(ra, rb);
      if (ra !== maxR) { rank.set(p.partnerAId, maxR); changed = true; }
      if (rb !== maxR) { rank.set(p.partnerBId, maxR); changed = true; }
    }

    if (!changed) { stabilized = true; break; }
  }

  if (!stabilized && import.meta.env.DEV) {
    console.warn(
      '[treeLayout] Rank-urile nu s-au stabilizat — verifică datele pentru un ciclu ' +
      '(ex. cineva marcat, direct sau indirect, ca propriul strămoș).',
    );
  }

  return rank;
}

// ─────────────────────────────────────────────────────────────
// PASUL 2 — alegerea parteneriatului "primar" per persoană
// (parteneriatele în plus, ex. o căsătorie anterioară, devin conectori secundari mai jos)
// ─────────────────────────────────────────────────────────────
const PARTNERSHIP_STATUS_PRIORITY: Record<string, number> = {
  MARRIED: 0,
  PARTNER: 1,
  WIDOWED: 2,
  DIVORCED: 3,
};

function pickPrimaryPartnerships(partnerships: Partnership[]) {
  const valid = partnerships.filter((p) => p.partnerAId !== p.partnerBId);
  const sorted = [...valid].sort(
    (a, b) => (PARTNERSHIP_STATUS_PRIORITY[a.status] ?? 9) - (PARTNERSHIP_STATUS_PRIORITY[b.status] ?? 9),
  );

  const used = new Set<string>();
  const primary: Partnership[] = [];
  const secondary: Partnership[] = [];

  for (const p of sorted) {
    if (used.has(p.partnerAId) || used.has(p.partnerBId)) {
      secondary.push(p);
      continue;
    }
    primary.push(p);
    used.add(p.partnerAId);
    used.add(p.partnerBId);
  }

  return { primary, secondary };
}

// ─────────────────────────────────────────────────────────────
// PASUL 3 — construirea unităților (cuplu = 1 unitate, single = 1 unitate)
// ─────────────────────────────────────────────────────────────
function buildUnits(
  members: FamilyMember[],
  primaryPartnerships: Partnership[],
  rank: Map<string, number>,
): { units: Unit[]; memberToUnit: Map<string, string> } {
  const units: Unit[] = [];
  const memberToUnit = new Map<string, string>();
  const used = new Set<string>();

  for (const p of primaryPartnerships) {
    if (used.has(p.partnerAId) || used.has(p.partnerBId)) continue; // siguranță
    const r = rank.get(p.partnerAId) ?? rank.get(p.partnerBId) ?? 0;
    const unitId = `u-${p.id}`;
    units.push({ id: unitId, rank: r, memberIds: [p.partnerAId, p.partnerBId], partnershipId: p.id });
    used.add(p.partnerAId);
    used.add(p.partnerBId);
    memberToUnit.set(p.partnerAId, unitId);
    memberToUnit.set(p.partnerBId, unitId);
  }

  for (const m of members) {
    if (used.has(m.id)) continue;
    const unitId = `m-${m.id}`;
    units.push({ id: unitId, rank: rank.get(m.id) ?? 0, memberIds: [m.id] });
    used.add(m.id);
    memberToUnit.set(m.id, unitId);
  }

  return { units, memberToUnit };
}

// ─────────────────────────────────────────────────────────────
// PASUL 4 — adiacența între UNITĂȚI (nu între persoane), pe baza relațiilor părinte-copil
// ─────────────────────────────────────────────────────────────
function buildUnitAdjacency(
  units: Unit[],
  memberToUnit: Map<string, string>,
  relations: { parentId: string; childId: string }[],
) {
  const parentUnitsOf = new Map<string, Set<string>>();
  const childUnitsOf = new Map<string, Set<string>>();
  units.forEach((u) => {
    parentUnitsOf.set(u.id, new Set());
    childUnitsOf.set(u.id, new Set());
  });

  for (const rel of relations) {
    const parentUnit = memberToUnit.get(rel.parentId);
    const childUnit = memberToUnit.get(rel.childId);
    if (!parentUnit || !childUnit || parentUnit === childUnit) continue;
    childUnitsOf.get(parentUnit)!.add(childUnit);
    parentUnitsOf.get(childUnit)!.add(parentUnit);
  }

  return { parentUnitsOf, childUnitsOf };
}

// ─────────────────────────────────────────────────────────────
// PASUL 5 — ORDONARE prin MEDIANĂ (nu medie), până la stabilizare
// Mediana e mai robustă decât media: o singură rudă/cuscru foarte îndepărtat(ă)
// nu mai trage tot grupul după el, cum s-ar întâmpla cu o medie aritmetică.
// ─────────────────────────────────────────────────────────────
function orderLevels(
  levelsMap: Map<number, string[]>,
  parentUnitsOf: Map<string, Set<string>>,
  childUnitsOf: Map<string, Set<string>>,
  manualOrderByUnit: Map<string, number>,
) {
  const ranks = [...levelsMap.keys()].sort((a, b) => a - b);
  const order = new Map<string, number>();

  const firstRankUnits = levelsMap.get(ranks[0])!;
  const firstWithPriority = firstRankUnits.map((id, i) => ({
    id,
    priority: manualOrderByUnit.get(id) ?? i,
    fallback: i,
  }));
  firstWithPriority.sort((a, b) => a.priority - b.priority || a.fallback - b.fallback);
  firstWithPriority.forEach((u, i) => order.set(u.id, i));
  levelsMap.set(ranks[0], firstWithPriority.map((u) => u.id));

  for (let i = 1; i < ranks.length; i++) {
    const r = ranks[i];
    const withPriority = levelsMap.get(r)!.map((id) => {
      const manual = manualOrderByUnit.get(id);
      if (manual != null) return { id, priority: manual };
      const parents = [...parentUnitsOf.get(id)!].map((p) => order.get(p) ?? 0);
      const priority = parents.length ? median(parents) : Number.MAX_SAFE_INTEGER;
      return { id, priority };
    });
    withPriority.sort((a, b) => a.priority - b.priority);
    withPriority.forEach((u, idx) => order.set(u.id, idx));
    levelsMap.set(r, withPriority.map((u) => u.id));
  }

  for (let pass = 0; pass < LAYOUT.MAX_ORDER_PASSES; pass++) {
    const downward = pass % 2 === 0;
    const passRanks = downward ? ranks.slice(1) : [...ranks].reverse().slice(1);
    const refMap = downward ? parentUnitsOf : childUnitsOf;
    let anyChange = false;

    for (const r of passRanks) {
      const current = levelsMap.get(r)!;
      const withPriority = current.map((id) => {
        const manual = manualOrderByUnit.get(id);
        const oldOrder = order.get(id)!;
        if (manual != null) return { id, priority: manual, oldOrder };
        const refs = [...refMap.get(id)!].map((p) => order.get(p) ?? 0);
        const priority = refs.length ? median(refs) : oldOrder;
        return { id, priority, oldOrder };
      });
      withPriority.sort((a, b) => a.priority - b.priority || a.oldOrder - b.oldOrder);
      const next = withPriority.map((u) => u.id);
      if (!arraysEqual(current, next)) anyChange = true;
      levelsMap.set(r, next);
      next.forEach((id, idx) => order.set(id, idx));
    }
    if (!anyChange) break;
  }

  return levelsMap;
}

// ─────────────────────────────────────────────────────────────
// PASUL 5B — RAFINARE PRIN TRANSPUNERE
// Mediana de mai sus apropie unitățile de "medie", dar nu garantează zero
// încrucișări. Aici numărăm EXACT intersecțiile dintre două niveluri vecine
// și testăm explicit interschimbarea a doi vecini — păstrăm swap-ul DOAR
// dacă reduce numărul real de intersecții. Repetăm până se stabilizează.
// ─────────────────────────────────────────────────────────────
function countCrossingsBetweenRanks(
  upperOrder: string[],
  lowerOrder: string[],
  childUnitsOf: Map<string, Set<string>>,
): number {
  const lowerPos = new Map<string, number>();
  lowerOrder.forEach((id, i) => lowerPos.set(id, i));

  const edgePositions: [number, number][] = [];
  upperOrder.forEach((upperId, upperIdx) => {
    childUnitsOf.get(upperId)?.forEach((lowerId) => {
      const lowerIdx = lowerPos.get(lowerId);
      if (lowerIdx !== undefined) edgePositions.push([upperIdx, lowerIdx]);
    });
  });

  // două muchii se intersectează dacă ordinea lor se inversează între cele
  // două niveluri — adică diferențele de poziție au semne opuse
  let crossings = 0;
  for (let i = 0; i < edgePositions.length; i++) {
    for (let j = i + 1; j < edgePositions.length; j++) {
      const [a1, b1] = edgePositions[i];
      const [a2, b2] = edgePositions[j];
      if ((a1 - a2) * (b1 - b2) < 0) crossings++;
    }
  }
  return crossings;
}

function transposeReduceCrossings(
  levelsMap: Map<number, string[]>,
  childUnitsOf: Map<string, Set<string>>,
) {
  const ranks = [...levelsMap.keys()].sort((a, b) => a - b);

  let improved = true;
  let safetyPass = 0;

  while (improved && safetyPass < LAYOUT.MAX_TRANSPOSE_PASSES) {
    improved = false;
    safetyPass++;

    for (let ri = 0; ri < ranks.length; ri++) {
      const order = levelsMap.get(ranks[ri])!;
      const upperOrder = ri > 0 ? levelsMap.get(ranks[ri - 1])! : null;
      const lowerOrder = ri < ranks.length - 1 ? levelsMap.get(ranks[ri + 1])! : null;

      for (let i = 0; i < order.length - 1; i++) {
        const costBefore =
          (upperOrder ? countCrossingsBetweenRanks(upperOrder, order, childUnitsOf) : 0) +
          (lowerOrder ? countCrossingsBetweenRanks(order, lowerOrder, childUnitsOf) : 0);

        [order[i], order[i + 1]] = [order[i + 1], order[i]];

        const costAfter =
          (upperOrder ? countCrossingsBetweenRanks(upperOrder, order, childUnitsOf) : 0) +
          (lowerOrder ? countCrossingsBetweenRanks(order, lowerOrder, childUnitsOf) : 0);

        if (costAfter < costBefore) {
          improved = true; // chiar ajută — păstrăm
        } else {
          [order[i], order[i + 1]] = [order[i + 1], order[i]]; // nu ajută — revenim
        }
      }
    }
  }

  return levelsMap;
}

// ─────────────────────────────────────────────────────────────
// PASUL 6 — COORDONATE X, cu rezolvare bidirecțională a suprapunerilor
// ─────────────────────────────────────────────────────────────
function unitWidth(unit: Unit) {
  return unit.memberIds.length === 2
    ? LAYOUT.CARD_WIDTH * 2 + LAYOUT.COUPLE_GAP
    : LAYOUT.CARD_WIDTH;
}

function assignCoordinates(
  unitsById: Map<string, Unit>,
  levelsMap: Map<number, string[]>,
  parentUnitsOf: Map<string, Set<string>>,
  childUnitsOf: Map<string, Set<string>>,
) {
  const ranks = [...levelsMap.keys()].sort((a, b) => a - b);
  const centerX = new Map<string, number>();

  for (const r of ranks) {
    let cursor = 0;
    for (const unitId of levelsMap.get(r)!) {
      const w = unitWidth(unitsById.get(unitId)!);
      centerX.set(unitId, cursor + w / 2);
      cursor += w + LAYOUT.SIBLING_GAP;
    }
  }

  // Aliniază un nivel spre media unităților de referință (părinți sau copii), rezolvând
  // suprapunerile din AMBELE direcții și mediind rezultatul.
  // De ce: o rezolvare doar stânga→dreapta împinge tot ce urmează la fiecare suprapunere,
  // iar pe seturi mari arborele "driftează" constant spre dreapta. Trecerea inversă
  // (dreapta→stânga) + media celor două anulează driftul — și matematic media a două
  // șiruri care respectă AMÂNDOUĂ distanța minimă între vecini respectă automat aceeași
  // distanță minimă (media a două numere ≥ X e tot ≥ X), deci nu reapar suprapuneri.
  const alignRow = (r: number, refMap: Map<string, Set<string>>): number => {
    const levelUnits = levelsMap.get(r)!;
    const desired = levelUnits.map((id) => {
      const refs = [...refMap.get(id)!];
      const avg = refs.length
        ? refs.reduce((s, p) => s + (centerX.get(p) ?? 0), 0) / refs.length
        : centerX.get(id)!;
      return { id, avg, w: unitWidth(unitsById.get(id)!) };
    });

    const forward: number[] = [];
    let prevRight = -Infinity;
    for (const d of desired) {
      let left = d.avg - d.w / 2;
      if (left < prevRight + LAYOUT.SIBLING_GAP) left = prevRight + LAYOUT.SIBLING_GAP;
      forward.push(left + d.w / 2);
      prevRight = left + d.w;
    }

    const backward: number[] = new Array(desired.length);
    let prevLeft = Infinity;
    for (let i = desired.length - 1; i >= 0; i--) {
      const d = desired[i];
      let right = d.avg + d.w / 2;
      if (right > prevLeft - LAYOUT.SIBLING_GAP) right = prevLeft - LAYOUT.SIBLING_GAP;
      backward[i] = right - d.w / 2;
      prevLeft = right - d.w;
    }

    let maxDelta = 0;
    desired.forEach((d, i) => {
      const finalX = (forward[i] + backward[i]) / 2;
      maxDelta = Math.max(maxDelta, Math.abs(finalX - centerX.get(d.id)!));
      centerX.set(d.id, finalX);
    });
    return maxDelta;
  };

  for (let pass = 0; pass < LAYOUT.MAX_COORD_PASSES; pass++) {
    let maxDelta = 0;
    for (const r of ranks) {
      if (r !== ranks[0]) maxDelta = Math.max(maxDelta, alignRow(r, parentUnitsOf));
    }
    for (let i = ranks.length - 2; i >= 0; i--) {
      maxDelta = Math.max(maxDelta, alignRow(ranks[i], childUnitsOf));
    }
    if (maxDelta < LAYOUT.COORD_EPSILON) break; // convergență
  }

  return centerX;
}

// ─────────────────────────────────────────────────────────────
// PASUL 7 — EDGE-URI (curbe Bézier)
// ─────────────────────────────────────────────────────────────
function bezierPath(x1: number, y1: number, x2: number, y2: number, long = false): string {
  const midY = (y1 + y2) / 2;
  if (!long) {
    return `M ${x1} ${y1} C ${x1} ${midY}, ${x2} ${midY}, ${x2} ${y2}`;
  }
  const bulge = Math.min(Math.abs(x2 - x1) * 0.15, 60);
  const dir = x2 >= x1 ? 1 : -1;
  return `M ${x1} ${y1} C ${x1 + dir * bulge} ${midY}, ${x2 - dir * bulge} ${midY}, ${x2} ${y2}`;
}

function partnerConnectorPath(ax: number, ay: number, bx: number, by: number): string {
  const [x1, y1, x2, y2] = ax <= bx ? [ax, ay, bx, by] : [bx, by, ax, ay];
  const midX = (x1 + x2) / 2;
  return `M ${x1} ${y1} C ${midX} ${y1}, ${midX} ${y2}, ${x2} ${y2}`;
}

// ─────────────────────────────────────────────────────────────
// FUNCȚIA PRINCIPALĂ — pură: primește FamilyTreeData, întoarce layout complet
// ─────────────────────────────────────────────────────────────
export function layoutFamilyTree(data: FamilyTreeData | undefined): FamilyTreeLayout {
  if (!data || data.members.length === 0) {
    return { members: [], couples: [], edges: [], contentWidth: 0, contentHeight: 0 };
  }

  const { members, relations, partnerships } = data;
  const membersById = new Map(members.map((m) => [m.id, m]));

  const rank = computeRanks(members, relations, partnerships);
  const { primary, secondary } = pickPrimaryPartnerships(partnerships);
  const { units, memberToUnit } = buildUnits(members, primary, rank);
  const manualOrderByUnit = getManualOrderByUnit(units, membersById);
  const unitsById = new Map(units.map((u) => [u.id, u]));
  const { parentUnitsOf, childUnitsOf } = buildUnitAdjacency(units, memberToUnit, relations);

  const levelsMap = new Map<number, string[]>();
  units.forEach((u) => {
    const list = levelsMap.get(u.rank) ?? [];
    list.push(u.id);
    levelsMap.set(u.rank, list);
  });

  orderLevels(levelsMap, parentUnitsOf, childUnitsOf, manualOrderByUnit);
  transposeReduceCrossings(levelsMap, childUnitsOf); // NOU — elimină încrucișările rămase
  const centerX = assignCoordinates(unitsById, levelsMap, parentUnitsOf, childUnitsOf);

  const memberPositions: LayoutMemberPosition[] = [];
  const couples: LayoutCoupleFrame[] = [];
  let maxX = 0;
  let maxY = 0;

  for (const [r, unitIds] of levelsMap) {
    const y = r * (LAYOUT.CARD_HEIGHT + LAYOUT.RANK_GAP);
    for (const unitId of unitIds) {
      const unit = unitsById.get(unitId)!;
      const cx = centerX.get(unitId)!;
      const w = unitWidth(unit);
      const left = cx - w / 2;

      if (unit.memberIds.length === 2) {
        const [aId, bId] = unit.memberIds;
        const aX = left;
        const bX = left + LAYOUT.CARD_WIDTH + LAYOUT.COUPLE_GAP;
        memberPositions.push({ id: aId, x: aX, y, rank: r, unitId, member: membersById.get(aId)! });
        memberPositions.push({ id: bId, x: bX, y, rank: r, unitId, member: membersById.get(bId)! });

        const frameX = aX - LAYOUT.COUPLE_FRAME_PADDING;
        const frameY = y - LAYOUT.COUPLE_FRAME_PADDING;
        const frameW = w + LAYOUT.COUPLE_FRAME_PADDING * 2;
        const frameH = LAYOUT.CARD_HEIGHT + LAYOUT.COUPLE_FRAME_PADDING * 2;

        couples.push({
          unitId, rank: r, x: frameX, y: frameY, width: frameW, height: frameH,
          unionX: cx, unionY: y + LAYOUT.CARD_HEIGHT,
        });

        maxX = Math.max(maxX, frameX + frameW);
      } else {
        const id = unit.memberIds[0];
        memberPositions.push({ id, x: left, y, rank: r, unitId, member: membersById.get(id)! });
        maxX = Math.max(maxX, left + LAYOUT.CARD_WIDTH);
      }
      maxY = Math.max(maxY, y + LAYOUT.CARD_HEIGHT);
    }
  }

  const posById = new Map(memberPositions.map((p) => [p.id, p]));
  const coupleByUnit = new Map(couples.map((c) => [c.unitId, c]));

  const edges: LayoutEdge[] = [];
  const parentsByChild = new Map<string, string[]>();
  relations.forEach((rel) => {
    if (rel.parentId === rel.childId) return;
    const list = parentsByChild.get(rel.childId) ?? [];
    list.push(rel.parentId);
    parentsByChild.set(rel.childId, list);
  });

  const drawnEdgeKeys = new Set<string>();

  parentsByChild.forEach((parentIds, childId) => {
    const childPos = posById.get(childId);
    if (!childPos) return;
    const childTopX = childPos.x + LAYOUT.CARD_WIDTH / 2;
    const childTopY = childPos.y;

    const parentUnitIds = new Set(
      parentIds.map((pid) => memberToUnit.get(pid)).filter((v): v is string => !!v),
    );

    parentUnitIds.forEach((unitId) => {
      const key = `${unitId}->${childId}`;
      if (drawnEdgeKeys.has(key)) return;
      drawnEdgeKeys.add(key);

      const parentRank = unitsById.get(unitId)!.rank;
      const isLong = childPos.rank - parentRank > 1;
      const couple = coupleByUnit.get(unitId);
      if (couple) {
        edges.push({
          id: key,
          kind: 'union-child',
          long: isLong,
          path: bezierPath(couple.unionX, couple.unionY, childTopX, childTopY, isLong),
        });
      } else {
        const pid = unitsById.get(unitId)!.memberIds[0];
        const pPos = posById.get(pid);
        if (!pPos) return;
        edges.push({
          id: key,
          kind: 'parent-child',
          long: isLong,
          path: bezierPath(pPos.x + LAYOUT.CARD_WIDTH / 2, pPos.y + LAYOUT.CARD_HEIGHT, childTopX, childTopY, isLong),
        });
      }
    });
  });

  // parteneriate secundare (ex. căsătorie anterioară) — doar conector punctat, informativ,
  // fără impact asupra pozițiilor calculate mai sus
  secondary.forEach((p) => {
    const posA = posById.get(p.partnerAId);
    const posB = posById.get(p.partnerBId);
    if (!posA || !posB) return;
    edges.push({
      id: `secondary-${p.id}`,
      kind: 'secondary-partner',
      path: partnerConnectorPath(
        posA.x + LAYOUT.CARD_WIDTH / 2, posA.y + LAYOUT.CARD_HEIGHT / 2,
        posB.x + LAYOUT.CARD_WIDTH / 2, posB.y + LAYOUT.CARD_HEIGHT / 2,
      ),
    });
  });

  return {
    members: memberPositions,
    couples,
    edges,
    contentWidth: maxX + LAYOUT.SIBLING_GAP,
    contentHeight: maxY + LAYOUT.RANK_GAP,
  };
}