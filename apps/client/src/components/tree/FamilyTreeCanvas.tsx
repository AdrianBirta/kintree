import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Paper, IconButton, Tooltip } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import CropFreeIcon from '@mui/icons-material/CropFree';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import type { FamilyTreeData } from '../../types/family';
import { layoutFamilyTree, LAYOUT, type TreeDirection } from '../../lib/treeLayout';
import { usePanZoom } from '../../hooks/usePanZoom';
import { useCardDrag } from '../../hooks/useCardDrag';
import MemberCard from './MemberCard';
import TreeEdgesLayer from './TreeEdgesLayer';
import { useHighlightedLineage } from '../../hooks/useHighlightedLineage';

interface Props {
  treeData?: FamilyTreeData;
  direction: TreeDirection;
  onReorder: (updates: { memberId: string; manualOrder: number; manualRank?: number }[]) => void;
}

const FamilyTreeCanvas: React.FC<Props> = ({ treeData, direction, onReorder }) => {
  const navigate = useNavigate();
  const { setFocusId, isDimmed } = useHighlightedLineage(treeData);
  const { containerRef, transform, onPointerDown, onPointerMove, stopPan, zoomBy, reset, fitToContent } =
    usePanZoom();

  const layout = useMemo(() => layoutFamilyTree(treeData, direction), [treeData, direction]);

  const hasFitted = useRef(false);
  useEffect(() => {
    if (hasFitted.current || layout.contentWidth === 0) return;
    fitToContent(layout.contentWidth, layout.contentHeight);
    hasFitted.current = true;
  }, [layout.contentWidth, layout.contentHeight, fitToContent]);

  // NOU — la schimbarea direcției, reîncadrăm conținutul (pozițiile s-au inversat)
  const prevDirectionRef = useRef(direction);
  useEffect(() => {
    if (prevDirectionRef.current !== direction) {
      fitToContent(layout.contentWidth, layout.contentHeight);
      prevDirectionRef.current = direction;
    }
  }, [direction, layout.contentWidth, layout.contentHeight, fitToContent]);

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
    (targetRank: number, orderedUnitIds: string[], movedUnitId: string, sourceRank: number) => {
      const updates: { memberId: string; manualOrder: number; manualRank?: number }[] = [];

      orderedUnitIds.forEach((unitId, index) => {
        const memberIds = memberIdsByUnit.get(unitId) ?? [];
        memberIds.forEach((memberId) => {
          const update: { memberId: string; manualOrder: number; manualRank?: number } = {
            memberId,
            manualOrder: index,
          };
          if (unitId === movedUnitId && targetRank !== sourceRank) {
            update.manualRank = targetRank;
          }
          updates.push(update);
        });
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
          const dy = isDraggingThis ? dragState!.currentY - dragState!.originalTopY : 0;
          return (
            <MemberCard
              key={m.id}
              member={m.member}
              x={m.x + dx}
              y={m.y + dy}
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
              left: dragState.slot.x - dragState.slot.width / 2,
              top: dragState.slot.y,
              width: dragState.slot.width,
              height: dragState.slot.height,
              border: '2px dashed var(--color-earbore-400)',
              borderRadius: 16,
              background: 'rgba(124, 77, 212, 0.06)',
              pointerEvents: 'none',
            }}
          />
        )}
      </div>

      <Paper elevation={3} sx={{ position: 'absolute', bottom: 16, right: 16, display: 'flex', flexDirection: 'column', gap: 0.5, p: 0.5, borderRadius: 3 }}>
        <Tooltip title="Mărește" placement="left">
          <IconButton size="small" onClick={() => zoomBy(1.2)}><AddIcon fontSize="small" /></IconButton>
        </Tooltip>
        <Tooltip title="Micșorează" placement="left">
          <IconButton size="small" onClick={() => zoomBy(1 / 1.2)}><RemoveIcon fontSize="small" /></IconButton>
        </Tooltip>
        <Tooltip title="Încadrează tot arborele" placement="left">
          <IconButton size="small" onClick={() => fitToContent(layout.contentWidth, layout.contentHeight)}><CropFreeIcon fontSize="small" /></IconButton>
        </Tooltip>
        <Tooltip title="Resetează zoom-ul" placement="left">
          <IconButton size="small" onClick={reset}><RestartAltIcon fontSize="small" /></IconButton>
        </Tooltip>
      </Paper>
    </div>
  );
};

export default FamilyTreeCanvas;