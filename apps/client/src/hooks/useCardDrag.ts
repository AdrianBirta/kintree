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

const RANK_STEP = LAYOUT.CARD_HEIGHT + LAYOUT.RANK_GAP;

export function useCardDrag(
  layout: FamilyTreeLayout,
  transform: Transform,
  containerRef: React.RefObject<HTMLDivElement | null>,
  onDrop: (targetRank: number, orderedUnitIds: string[], unitId: string, sourceRank: number) => void,
) {
  const [dragState, setDragState] = useState<CardDragState | null>(null);
  const unitsByRankRef = useRef<Map<number, RankUnit[]>>(new Map());

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

  const buildUnitsByRank = useCallback((): Map<number, RankUnit[]> => {
    const byRank = new Map<number, RankUnit[]>();
    const seenUnits = new Set<string>();

    layout.members.forEach((m) => {
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

      document.body.style.cursor = 'grabbing'; // cursorul rămâne "grabbing" oriunde te-ai muta pe ecran

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

        // conversia Y -> rank ține cont de direcție: în 'bottom-up' rank-ul 0
        // (strămoșii) e jos de tot, deci Y mare, iar rank-ul maxim e sus (Y mic).
        const maxRank = layout.maxRank;
        const rawRank = Math.round(currentY / RANK_STEP);
        const rawTargetRank = layout.direction === 'bottom-up' ? maxRank - rawRank : rawRank;
        const targetRank = Math.min(Math.max(rawTargetRank, 0), maxRank);

        const others = (unitsByRankRef.current.get(targetRank) ?? []).filter((u) => u.unitId !== prev.unitId);
        const centerXNow = currentX + prev.width / 2;

        // FIX — pragul de trecere e la MIJLOCUL golului dintre vecini, nu la centrul
        // vecinului. Comparând cu centrul vecinului, reacția venea abia după ce cardul
        // tras trecea complet de el, ceea ce dădea senzația de highlight "cu un pas în urmă".
        let insertIndex = 0;
        for (let i = 0; i < others.length; i++) {
          const boundary =
            i === 0
              ? others[i].centerX - others[i].width / 2 - LAYOUT.SIBLING_GAP / 2
              : (others[i - 1].centerX + others[i].centerX) / 2;
          if (centerXNow > boundary) insertIndex = i + 1;
          else break;
        }

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

        // Y-ul placeholder-ului trebuie calculat cu aceeași formulă rank -> Y
        // folosită de treeLayout.ts (rankToY), altfel dreptunghiul punctat "sare"
        // pe direcție greșită când arborele e inversat.
        const verticalPad = (prev.height - LAYOUT.CARD_HEIGHT) / 2;
        const rankTopY = layout.direction === 'bottom-up'
          ? (maxRank - targetRank) * RANK_STEP
          : targetRank * RANK_STEP;
        const slotY = rankTopY - verticalPad;

        return {
          ...prev,
          currentX,
          currentY,
          slot: { rank: targetRank, insertIndex, x: slotX, y: slotY, width: prev.width, height: prev.height },
        };
      });
    },
    [toWorldX, toWorldY, layout.direction, layout.maxRank],
  );

  const endDrag = useCallback(() => {
    document.body.style.cursor = ''; // resetăm cursorul la final
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