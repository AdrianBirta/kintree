import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Paper, IconButton, Tooltip } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import CropFreeIcon from '@mui/icons-material/CropFree';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import OpenWithIcon from '@mui/icons-material/OpenWith';
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
  onQuickAdd: (memberId: string, kind: 'parent' | 'child') => void;
}

const ORDER_STEP = 2;

const FamilyTreeCanvas: React.FC<Props> = ({ treeData, direction, onReorder, onQuickAdd }) => {
  const navigate = useNavigate();
  const { setFocusId, isDimmed } = useHighlightedLineage(treeData);
  const { containerRef, transform, onPointerDown, onPointerMove, stopPan, zoomBy, resetZoom, fitToContent } =
    usePanZoom();

  const topMeansParent = direction === 'top-down';
  const handleAddTop = useCallback(
    (memberId: string) => onQuickAdd(memberId, topMeansParent ? 'parent' : 'child'),
    [onQuickAdd, topMeansParent],
  );
  const handleAddBottom = useCallback(
    (memberId: string) => onQuickAdd(memberId, topMeansParent ? 'child' : 'parent'),
    [onQuickAdd, topMeansParent],
  );

  const layout = useMemo(() => layoutFamilyTree(treeData, direction), [treeData, direction]);

  const hasFitted = useRef(false);
  useEffect(() => {
    if (hasFitted.current || layout.contentWidth === 0) return;
    let rafId: number | undefined;
    let cancelled = false;

    const tryFit = () => {
      if (cancelled) return;
      const ok = fitToContent(layout.contentWidth, layout.contentHeight);
      if (ok) {
        hasFitted.current = true;
      } else {
        rafId = requestAnimationFrame(tryFit);
      }
    };
    tryFit();

    return () => {
      cancelled = true;
      if (rafId !== undefined) cancelAnimationFrame(rafId);
    };
  }, [layout.contentWidth, layout.contentHeight, fitToContent]);

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

  const membersById = useMemo(
    () => new Map((treeData?.members ?? []).map((m) => [m.id, m])),
    [treeData],
  );

  const handleDrop = useCallback(
    (targetRank: number, orderedUnitIds: string[], movedUnitId: string, sourceRank: number) => {
      const updates: { memberId: string; manualOrder: number; manualRank?: number }[] = [];

      orderedUnitIds.forEach((unitId, index) => {
        const memberIds = memberIdsByUnit.get(unitId) ?? [];
        memberIds.forEach((memberId) => {
          const existing = membersById.get(memberId);
          const orientationBit = existing?.manualOrder != null ? existing.manualOrder % ORDER_STEP : 0;
          const update: { memberId: string; manualOrder: number; manualRank?: number } = {
            memberId,
            manualOrder: index * ORDER_STEP + orientationBit,
          };
          if (unitId === movedUnitId && targetRank !== sourceRank) {
            update.manualRank = targetRank;
          }
          updates.push(update);
        });
      });

      onReorder(updates);
    },
    [memberIdsByUnit, membersById, onReorder],
  );

  const { dragState, startDrag, updateDrag, endDrag } = useCardDrag(layout, transform, containerRef, handleDrop);

  const getRankOrderedUnitIds = useCallback(
    (rank: number) => {
      const seen = new Set<string>();
      const items: { unitId: string; centerX: number }[] = [];
      layout.members.forEach((m) => {
        if (m.rank !== rank || seen.has(m.unitId)) return;
        seen.add(m.unitId);
        const couple = layout.couples.find((c) => c.unitId === m.unitId);
        items.push({ unitId: m.unitId, centerX: couple ? couple.unionX : m.x + LAYOUT.CARD_WIDTH / 2 });
      });
      items.sort((a, b) => a.centerX - b.centerX);
      return items.map((i) => i.unitId);
    },
    [layout],
  );

  const handleSwapPartners = useCallback(
    (unitId: string) => {
      const memberIds = memberIdsByUnit.get(unitId);
      if (!memberIds || memberIds.length !== 2) return;
      const memberPos = layout.members.find((m) => m.unitId === unitId);
      if (!memberPos) return;

      const [leftId, rightId] = memberIds;
      const rankOrderedUnitIds = getRankOrderedUnitIds(memberPos.rank);

      const updates: { memberId: string; manualOrder: number }[] = [];
      rankOrderedUnitIds.forEach((uId, index) => {
        if (uId === unitId) {
          updates.push({ memberId: rightId, manualOrder: index * ORDER_STEP });
          updates.push({ memberId: leftId, manualOrder: index * ORDER_STEP + 1 });
          return;
        }
        (memberIdsByUnit.get(uId) ?? []).forEach((memberId) => {
          const existing = membersById.get(memberId);
          const bit = existing?.manualOrder != null ? existing.manualOrder % ORDER_STEP : 0;
          updates.push({ memberId, manualOrder: index * ORDER_STEP + bit });
        });
      });

      onReorder(updates);
    },
    [memberIdsByUnit, layout, getRankOrderedUnitIds, membersById, onReorder],
  );

  const handleCoupleMovePointerDown = useCallback(
    (unitId: string) => (e: React.PointerEvent) => {
      e.stopPropagation();
      e.preventDefault();
      try { (e.currentTarget as Element).setPointerCapture(e.pointerId); } catch { /* ignorăm */ }
      startDrag(unitId, e.clientX, e.clientY);
    },
    [startDrag],
  );

  const handleCoupleMovePointerMove = useCallback(
    (e: React.PointerEvent) => updateDrag(e.clientX, e.clientY),
    [updateDrag],
  );

  const handleCoupleMovePointerUp = useCallback(
    (e: React.PointerEvent) => {
      e.stopPropagation();
      try { (e.currentTarget as Element).releasePointerCapture(e.pointerId); } catch { /* deja eliberat */ }
      endDrag();
    },
    [endDrag],
  );

  const [hoveredMoveId, setHoveredMoveId] = useState<string | null>(null);

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
          const isCoupled = (memberIdsByUnit.get(m.unitId)?.length ?? 1) === 2;
          return (
            <MemberCard
              key={m.id}
              member={m.member}
              x={m.x + dx}
              y={m.y + dy}
              unitId={m.unitId}
              canDrag={!isCoupled}
              isSelf={!!treeData?.selfMemberId && treeData.selfMemberId === m.id}
              onAddTop={handleAddTop}
              onAddBottom={handleAddBottom}
              topLabel={topMeansParent ? 'Adaugă părinte' : 'Adaugă copil'}
              bottomLabel={topMeansParent ? 'Adaugă copil' : 'Adaugă părinte'}
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

        {layout.couples.map((c) => {
          const ids = memberIdsByUnit.get(c.unitId) ?? [];
          if (ids.length !== 2) return null;
          const isMoveHovered = hoveredMoveId === c.unitId;
          const isDraggingThisCouple = dragState?.unitId === c.unitId;

          return (
            <React.Fragment key={`couple-controls-${c.unitId}`}>
              {/* Buton swap — mereu vizibil, indiferent de dispozitiv */}
              <div
                style={{
                  position: 'absolute',
                  left: c.unionX - 22,
                  top: c.y - 8,
                  width: 44,
                  height: 36,
                  pointerEvents: 'auto',
                  zIndex: 56,
                }}
              >
                <Tooltip title="Inversează pozițiile partenerilor" placement="top">
                  <IconButton
                    size="small"
                    onPointerDown={(e) => e.stopPropagation()}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSwapPartners(c.unitId);
                    }}
                    sx={{
                      position: 'absolute',
                      top: 0,
                      left: '50%',
                      transform: 'translateX(-50%)',
                      width: 30,
                      height: 30,
                      background: 'var(--color-earbore-500)',
                      border: '2px solid white',
                      opacity: 1,
                      boxShadow: '0 3px 8px rgba(20,10,40,0.3)',
                      cursor: 'pointer',
                      '&:hover': { background: 'var(--color-earbore-600)' },
                    }}
                  >
                    <SwapHorizIcon sx={{ fontSize: 18, color: 'white' }} />
                  </IconButton>
                </Tooltip>
              </div>

              {/* Buton mutare cuplu — la hover pe desktop, MEREU vizibil pe
                  touch (era complet inaccesibil pe mobil înainte). */}
              <div
                onMouseEnter={() => setHoveredMoveId(c.unitId)}
                onMouseLeave={() => setHoveredMoveId((prev) => (prev === c.unitId ? null : prev))}
                style={{
                  position: 'absolute',
                  left: c.x + c.width - 28,
                  top: c.y - 8,
                  width: 36,
                  height: 36,
                  pointerEvents: 'auto',
                  zIndex: 56,
                }}
              >
                <Tooltip title="Mută tot cuplul" placement="right">
                  <IconButton
                    size="small"
                    onPointerDown={handleCoupleMovePointerDown(c.unitId)}
                    onPointerMove={handleCoupleMovePointerMove}
                    onPointerUp={handleCoupleMovePointerUp}
                    onPointerCancel={handleCoupleMovePointerUp}
                    onClick={(e) => e.stopPropagation()}
                    sx={{
                      position: 'absolute',
                      top: 0,
                      left: '50%',
                      transform: 'translateX(-50%)',
                      width: 26,
                      height: 26,
                      background: 'white',
                      border: '1px solid',
                      borderColor: 'divider',
                      opacity: isMoveHovered || isDraggingThisCouple ? 1 : 0,
                      transition: 'opacity 0.15s',
                      boxShadow: '0 2px 6px rgba(20,10,40,0.15)',
                      cursor: isDraggingThisCouple ? 'grabbing' : 'grab',
                      touchAction: 'none',
                      '@media (hover: none)': { opacity: 1, width: 32, height: 32 },
                    }}
                  >
                    <OpenWithIcon sx={{ fontSize: 15, color: 'var(--color-earbore-gray)' }} />
                  </IconButton>
                </Tooltip>
              </div>
            </React.Fragment>
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

      <Paper
        elevation={3}
        onPointerDown={(e) => e.stopPropagation()}
        sx={{
          position: 'absolute',
          bottom: { xs: 8, sm: 16 },
          right: { xs: 8, sm: 16 },
          display: 'flex',
          flexDirection: 'column',
          gap: 0.5,
          p: 0.5,
          borderRadius: 3,
        }}
      >
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
          <IconButton size="small" onClick={() => resetZoom(layout.contentWidth)}><RestartAltIcon fontSize="small" /></IconButton>
        </Tooltip>
      </Paper>
    </div>
  );
};

export default FamilyTreeCanvas;