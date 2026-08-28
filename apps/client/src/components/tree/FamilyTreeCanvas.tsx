import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import type { FamilyTreeData } from '../../types/family';
import { layoutFamilyTree, LAYOUT } from '../../lib/treeLayout';
import { usePanZoom } from '../../hooks/usePanZoom';
import { useCardDrag } from '../../hooks/useCardDrag';
import MemberCard from './MemberCard';
import TreeEdgesLayer from './TreeEdgesLayer';
import { useHighlightedLineage } from '../../hooks/useHighlightedLineage';

interface Props {
  treeData?: FamilyTreeData;
  onReorder: (updates: { memberId: string; manualOrder: number }[]) => void;
}

const FamilyTreeCanvas: React.FC<Props> = ({ treeData, onReorder }) => {
  const navigate = useNavigate();
  const { setFocusId, isDimmed } = useHighlightedLineage(treeData);
  const { containerRef, transform, onPointerDown, onPointerMove, stopPan, zoomBy, reset, fitToContent } =
    usePanZoom();

  const layout = useMemo(() => layoutFamilyTree(treeData), [treeData]);

  const hasFitted = useRef(false);
  useEffect(() => {
    if (hasFitted.current || layout.contentWidth === 0) return;
    fitToContent(layout.contentWidth, layout.contentHeight);
    hasFitted.current = true;
  }, [layout.contentWidth, layout.contentHeight, fitToContent]);

  const handleCardClick = useCallback((id: string) => navigate(`/members/${id}`), [navigate]);

  const memberIdsByUnit = useMemo(() => {
    const map = new Map<string, string[]>();
    layout.members.forEach((m) => {
      const list = map.get(m.unitId) ?? [];
      list.push(m.id);
      map.set(m.unitId, list);
    });
    return map;
  }, [layout]);

  const handleDrop = useCallback(
    (_rank: number, orderedUnitIds: string[]) => {
      const updates: { memberId: string; manualOrder: number }[] = [];
      orderedUnitIds.forEach((unitId, index) => {
        (memberIdsByUnit.get(unitId) ?? []).forEach((memberId) => updates.push({ memberId, manualOrder: index }));
      });
      onReorder(updates);
    },
    [memberIdsByUnit, onReorder],
  );

  const { dragState, startDrag, updateDrag, endDrag } = useCardDrag(layout, transform, containerRef, handleDrop);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full overflow-hidden bg-earbore-grayLight cursor-grab active:cursor-grabbing touch-none select-none"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={stopPan}
      onPointerCancel={stopPan}
    >
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: layout.contentWidth,
          height: layout.contentHeight,
          transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`,
          transformOrigin: '0 0',
        }}
      >
        <TreeEdgesLayer edges={layout.edges} couples={layout.couples} width={layout.contentWidth} height={layout.contentHeight} />

        {layout.members.map((m) => {
          const isDraggingThis = dragState?.unitId === m.unitId;
          const dx = isDraggingThis ? dragState!.currentX - dragState!.originalCenterX : 0;
          return (
            <MemberCard
              key={m.id}
              member={m.member}
              x={m.x + dx}
              y={m.y}
              unitId={m.unitId}
              onClick={handleCardClick}
              onDragStart={startDrag}
              onDragMove={updateDrag}
              onDragEnd={endDrag}
              onMouseLeave={() => setFocusId(null)}
              onMouseEnter={() => setFocusId(m.id)}
              style={{ opacity: isDimmed(m.id) ? 0.25 : undefined }}
              isDragging={isDraggingThis}
            />
          );
        })}

        {dragState && (
          <div
            style={{
              position: 'absolute',
              left: dragState.slot.x - LAYOUT.CARD_WIDTH / 2,
              top: dragState.slot.y,
              width: LAYOUT.CARD_WIDTH,
              height: LAYOUT.CARD_HEIGHT,
              border: '2px dashed var(--color-earbore-400)',
              borderRadius: 16,
              background: 'rgba(124, 77, 212, 0.06)',
              pointerEvents: 'none',
            }}
          />
        )}
      </div>

      <div className="absolute bottom-4 right-4 flex flex-col gap-2 bg-white rounded-xl shadow-md border border-earbore-border p-1.5">
        <button onClick={() => zoomBy(1.2)} className="w-8 h-8 rounded-lg hover:bg-earbore-50 font-bold text-earbore-700 cursor-pointer" title="Mărește">+</button>
        <button onClick={() => zoomBy(1 / 1.2)} className="w-8 h-8 rounded-lg hover:bg-earbore-50 font-bold text-earbore-700 cursor-pointer" title="Micșorează">−</button>
        <button onClick={() => fitToContent(layout.contentWidth, layout.contentHeight)} className="w-8 h-8 rounded-lg hover:bg-earbore-50 text-earbore-700 text-sm cursor-pointer" title="Încadrează tot arborele">⛶</button>
        <button onClick={reset} className="w-8 h-8 rounded-lg hover:bg-earbore-50 text-earbore-gray text-xs cursor-pointer" title="Resetează zoom-ul">⟲</button>
      </div>
    </div>
  );
};

export default FamilyTreeCanvas;