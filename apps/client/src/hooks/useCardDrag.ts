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
}

interface DragSlot {
  rank: number;
  insertIndex: number;
  x: number;
  y: number;
}

export interface CardDragState {
  unitId: string;
  originalCenterX: number;
  offsetX: number;
  currentX: number;
  slot: DragSlot;
}

export function useCardDrag(
  layout: FamilyTreeLayout,
  transform: Transform,
  containerRef: React.RefObject<HTMLDivElement | null>,
  onDrop: (rank: number, orderedUnitIds: string[]) => void,
) {
  const [dragState, setDragState] = useState<CardDragState | null>(null);
  const rankUnitsRef = useRef<RankUnit[]>([]);

  const toWorldX = useCallback(
    (clientX: number) => {
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return 0;
      return (clientX - rect.left - transform.x) / transform.scale;
    },
    [containerRef, transform],
  );

  // unitățile din același rank, ordonate după X curent — sursa de-adevăr rămâne mereu ce e randat
  const collectRankUnits = useCallback(
    (rank: number): RankUnit[] => {
      const byUnit = new Map<string, RankUnit>();
      layout.members
        .filter((m) => m.rank === rank)
        .forEach((m) => {
          if (byUnit.has(m.unitId)) return;
          const couple = layout.couples.find((c) => c.unitId === m.unitId);
          byUnit.set(m.unitId, {
            unitId: m.unitId,
            centerX: couple ? couple.unionX : m.x + LAYOUT.CARD_WIDTH / 2,
          });
        });
      return [...byUnit.values()].sort((a, b) => a.centerX - b.centerX);
    },
    [layout],
  );

  const startDrag = useCallback(
    (unitId: string, clientX: number) => {
      const memberPos = layout.members.find((m) => m.unitId === unitId);
      if (!memberPos) return;

      const rankUnits = collectRankUnits(memberPos.rank);
      rankUnitsRef.current = rankUnits;

      const self = rankUnits.find((u) => u.unitId === unitId);
      if (!self) return;

      setDragState({
        unitId,
        originalCenterX: self.centerX,
        offsetX: toWorldX(clientX) - self.centerX,
        currentX: self.centerX,
        slot: {
          rank: memberPos.rank,
          insertIndex: rankUnits.findIndex((u) => u.unitId === unitId),
          x: self.centerX,
          y: memberPos.y,
        },
      });
    },
    [layout, collectRankUnits, toWorldX],
  );

  const updateDrag = useCallback(
    (clientX: number) => {
      setDragState((prev) => {
        if (!prev) return prev;
        const others = rankUnitsRef.current.filter((u) => u.unitId !== prev.unitId);
        const currentX = toWorldX(clientX) - prev.offsetX;

        const insertIndex = others.filter((u) => u.centerX < currentX).length;
        let slotX = currentX;
        if (others.length > 0) {
          if (insertIndex === 0) slotX = others[0].centerX - LAYOUT.SIBLING_GAP * 2;
          else if (insertIndex >= others.length) slotX = others[others.length - 1].centerX + LAYOUT.SIBLING_GAP * 2;
          else slotX = (others[insertIndex - 1].centerX + others[insertIndex].centerX) / 2;
        }

        return { ...prev, currentX, slot: { ...prev.slot, insertIndex, x: slotX } };
      });
    },
    [toWorldX],
  );

  const endDrag = useCallback(() => {
    setDragState((prev) => {
      if (!prev) return null;
      const others = rankUnitsRef.current.filter((u) => u.unitId !== prev.unitId).map((u) => u.unitId);
      others.splice(prev.slot.insertIndex, 0, prev.unitId);
      onDrop(prev.slot.rank, others);
      return null;
    });
  }, [onDrop]);

  return { dragState, startDrag, updateDrag, endDrag };
}