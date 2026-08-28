import { useCallback, useRef, useState } from 'react';
import type { FamilyTreeLayout } from '../lib/treeLayout';
import { LAYOUT } from '../lib/treeLayout';

interface Transform {
  x: number;
  y: number;
  scale: number;
}

interface RankUnit {
  unitId: string;
  centerX: number;
  width: number;
  height: number;
  topY: number;
}

interface DragSlot {
  rank: number;
  insertIndex: number;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface CardDragState {
  unitId: string;
  sourceRank: number;
  originalCenterX: number;
  originalTopY: number;
  offsetX: number;
  offsetY: number;
  currentX: number;
  currentY: number;
  width: number;
  height: number;
  slot: DragSlot;
}

// distanța verticală dintre generații — trebuie să fie exact ca în treeLayout.ts,
// unde `y = rank * (CARD_HEIGHT + RANK_GAP)`
const RANK_STEP = LAYOUT.CARD_HEIGHT + LAYOUT.RANK_GAP;

export function useCardDrag(
  layout: FamilyTreeLayout,
  transform: Transform,
  containerRef: React.RefObject<HTMLDivElement | null>,
  onDrop: (targetRank: number, orderedUnitIds: string[], unitId: string, sourceRank: number) => void,
) {
  const [dragState, setDragState] = useState<CardDragState | null>(null);
  const unitsByRankRef = useRef<Map<number, RankUnit[]>>(new Map());
  const maxRankRef = useRef(0);

  const toWorldX = useCallback(
    (clientX: number) => {
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return 0;
      return (clientX - rect.left - transform.x) / transform.scale;
    },
    [containerRef, transform],
  );

  const toWorldY = useCallback(
    (clientY: number) => {
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return 0;
      return (clientY - rect.top - transform.y) / transform.scale;
    },
    [containerRef, transform],
  );

  // instantaneu complet rank -> unități, construit o singură dată la începutul
  // drag-ului; în timpul mutării lucrăm doar cu acest instantaneu (nu recalculăm
  // layout-ul live la fiecare pixel mutat)
  const buildUnitsByRank = useCallback((): Map<number, RankUnit[]> => {
    const byRank = new Map<number, RankUnit[]>();
    const seenUnits = new Set<string>();
    let maxRank = 0;

    layout.members.forEach((m) => {
      maxRank = Math.max(maxRank, m.rank);
      if (seenUnits.has(m.unitId)) return;
      seenUnits.add(m.unitId);

      const couple = layout.couples.find((c) => c.unitId === m.unitId);
      const unit: RankUnit = couple
        ? { unitId: m.unitId, centerX: couple.unionX, width: couple.width, height: couple.height, topY: couple.y }
        : { unitId: m.unitId, centerX: m.x + LAYOUT.CARD_WIDTH / 2, width: LAYOUT.CARD_WIDTH, height: LAYOUT.CARD_HEIGHT, topY: m.y };

      const list = byRank.get(m.rank) ?? [];
      list.push(unit);
      byRank.set(m.rank, list);
    });

    maxRankRef.current = maxRank;
    byRank.forEach((list) => list.sort((a, b) => a.centerX - b.centerX));
    return byRank;
  }, [layout]);

  const startDrag = useCallback(
    (unitId: string, clientX: number, clientY: number) => {
      const memberPos = layout.members.find((m) => m.unitId === unitId);
      if (!memberPos) return;

      const unitsByRank = buildUnitsByRank();
      unitsByRankRef.current = unitsByRank;

      const rankUnits = unitsByRank.get(memberPos.rank) ?? [];
      const self = rankUnits.find((u) => u.unitId === unitId);
      if (!self) return;

      setDragState({
        unitId,
        sourceRank: memberPos.rank,
        originalCenterX: self.centerX,
        originalTopY: self.topY,
        offsetX: toWorldX(clientX) - self.centerX,
        offsetY: toWorldY(clientY) - self.topY,
        currentX: self.centerX,
        currentY: self.topY,
        width: self.width,
        height: self.height,
        slot: {
          rank: memberPos.rank,
          insertIndex: rankUnits.findIndex((u) => u.unitId === unitId),
          x: self.centerX,
          y: self.topY,
          width: self.width,
          height: self.height,
        },
      });
    },
    [layout, buildUnitsByRank, toWorldX, toWorldY],
  );

  const updateDrag = useCallback(
    (clientX: number, clientY: number) => {
      setDragState((prev) => {
        if (!prev) return prev;

        const currentX = toWorldX(clientX) - prev.offsetX;
        const currentY = toWorldY(clientY) - prev.offsetY;

        // rank-ul țintă se deduce din poziția Y a cursorului, rotunjit la cea mai
        // apropiată generație existentă (limitat la generațiile deja prezente în arbore)
        const rawTargetRank = Math.round(currentY / RANK_STEP);
        const targetRank = Math.min(Math.max(rawTargetRank, 0), maxRankRef.current);

        const others = (unitsByRankRef.current.get(targetRank) ?? []).filter((u) => u.unitId !== prev.unitId);
        const centerXNow = currentX + prev.width / 2;

        const insertIndex = others.filter((u) => u.centerX < centerXNow).length;

        // FIX: calculul de mai jos ține cont de lățimea REALĂ a fiecărei unități
        // (cuplu vs. persoană singură) — asta era cauza dreptunghiului "decalat":
        // înainte se presupunea că toate unitățile au aceeași lățime (un card)
        let slotX = centerXNow;
        if (others.length > 0) {
          if (insertIndex === 0) {
            const first = others[0];
            slotX = first.centerX - first.width / 2 - LAYOUT.SIBLING_GAP - prev.width / 2;
          } else if (insertIndex >= others.length) {
            const last = others[others.length - 1];
            slotX = last.centerX + last.width / 2 + LAYOUT.SIBLING_GAP + prev.width / 2;
          } else {
            const left = others[insertIndex - 1];
            const right = others[insertIndex];
            slotX = (left.centerX + right.centerX) / 2;
          }
        }

        // dacă unitatea mutată e un cuplu, cadrul are un mic padding față de card
        // (COUPLE_FRAME_PADDING) — îl reflectăm și pe Y ca placeholder-ul să se
        // alinieze exact cu cadrul punctat al cuplurilor din TreeEdgesLayer
        const verticalPad = (prev.height - LAYOUT.CARD_HEIGHT) / 2;
        const slotY = targetRank * RANK_STEP - verticalPad;

        return {
          ...prev,
          currentX,
          currentY,
          slot: { rank: targetRank, insertIndex, x: slotX, y: slotY, width: prev.width, height: prev.height },
        };
      });
    },
    [toWorldX, toWorldY],
  );

  const endDrag = useCallback(() => {
    setDragState((prev) => {
      if (!prev) return null;
      const others = (unitsByRankRef.current.get(prev.slot.rank) ?? [])
        .filter((u) => u.unitId !== prev.unitId)
        .map((u) => u.unitId);
      others.splice(prev.slot.insertIndex, 0, prev.unitId);
      onDrop(prev.slot.rank, others, prev.unitId, prev.sourceRank);
      return null;
    });
  }, [onDrop]);

  return { dragState, startDrag, updateDrag, endDrag };
}