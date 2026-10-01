import React, { useEffect, useMemo, useRef, useState } from 'react';
import { layoutFamilyTree, LAYOUT } from '../../lib/treeLayout';
import MemberCard from '../tree/MemberCard';
import TreeEdgesLayer from '../tree/TreeEdgesLayer';
import type { FamilyTreeData } from '../../types/family';

const PADDING = 20;
const noop = () => { };

interface Props {
  treeData: FamilyTreeData;
}

// Previzualizare 2D, strict decorativă: refolosește exact același layout și
// aceleași carduri ca în dashboard, dar fără pan/zoom/drag/click.
const TreePreview2D: React.FC<Props> = ({ treeData }) => {
  const layout = useMemo(() => layoutFamilyTree(treeData, 'top-down'), [treeData]);

  const bounds = useMemo(() => {
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    layout.members.forEach((m) => {
      minX = Math.min(minX, m.x);
      maxX = Math.max(maxX, m.x + LAYOUT.CARD_WIDTH);
      minY = Math.min(minY, m.y);
      maxY = Math.max(maxY, m.y + LAYOUT.CARD_HEIGHT);
    });
    layout.couples.forEach((c) => {
      minX = Math.min(minX, c.x);
      maxX = Math.max(maxX, c.x + c.width);
      minY = Math.min(minY, c.y);
      maxY = Math.max(maxY, c.y + c.height);
    });
    return { minX, minY, width: maxX - minX, height: maxY - minY };
  }, [layout]);

  const containerRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const update = () => {
      const rect = el.getBoundingClientRect();
      setSize({ w: rect.width, h: rect.height });
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const ready = size.w > 0 && size.h > 0;
  const scale = ready
    ? Math.min(1, (size.w - PADDING * 2) / bounds.width, (size.h - PADDING * 2) / bounds.height)
    : 0;
  const translateX = ready ? (size.w - bounds.width * scale) / 2 - bounds.minX * scale : 0;
  const translateY = ready ? (size.h - bounds.height * scale) / 2 - bounds.minY * scale : 0;

  return (
    <div ref={containerRef} className="absolute inset-0 overflow-hidden select-none pointer-events-none">
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: layout.contentWidth,
          height: layout.contentHeight,
          transform: `translate(${translateX}px, ${translateY}px) scale(${scale})`,
          transformOrigin: '0 0',
          opacity: ready ? 1 : 0,
          transition: 'opacity 0.4s ease',
        }}
      >
        <TreeEdgesLayer
          edges={layout.edges}
          couples={layout.couples}
          width={layout.contentWidth}
          height={layout.contentHeight}
        />

        {layout.members.map((m) => (
          <MemberCard
            key={m.id}
            member={m.member}
            x={m.x}
            y={m.y}
            unitId={m.unitId}
            canDrag={false}
            isSelf={treeData.selfMemberId === m.id}
            onClick={noop}
          />
        ))}
      </div>
    </div>
  );
};

export default TreePreview2D;