import React from 'react';
import type { LayoutCoupleFrame, LayoutEdge } from '../../lib/treeLayout';
import { LAYOUT } from '../../lib/treeLayout';

interface Props {
  edges: LayoutEdge[];
  couples: LayoutCoupleFrame[];
  width: number;
  height: number;
}

const EDGE_COLORS: Record<LayoutEdge['kind'], string> = {
  'union-child': 'var(--color-earbore-500)',
  'parent-child': 'var(--color-earbore-400)',
  'secondary-partner': 'var(--color-earbore-warning)',
  'alliance': 'var(--color-earbore-success)', // NOU — linia care indică "cuscri"
};

const DASHED_KINDS = new Set<LayoutEdge['kind']>(['secondary-partner', 'alliance']); // NOU

function TreeEdgesLayer({ edges, couples, width, height }: Props) {
  return (
    <>
      <svg
        width={width}
        height={height}
        style={{ position: 'absolute', top: 0, left: 0, overflow: 'visible', pointerEvents: 'none' }}
      >
        {edges.map((edge) => (
          <path
            key={edge.id}
            d={edge.path}
            fill="none"
            stroke={EDGE_COLORS[edge.kind]}
            strokeWidth={edge.kind === 'secondary-partner' || edge.kind === 'alliance' ? 2 : 2.2}
            strokeDasharray={DASHED_KINDS.has(edge.kind) || edge.long ? '5 5' : undefined}
            opacity={edge.long ? 0.5 : 1}
          />
        ))}
        {couples.map((c) => (
          <circle key={c.unitId} cx={c.unionX} cy={c.unionY} r={LAYOUT.UNION_SIZE / 2} fill="var(--color-earbore-500)" />
        ))}
      </svg>

      {couples.map((c) => (
        <div
          key={c.unitId}
          style={{
            position: 'absolute',
            left: c.x,
            top: c.y,
            width: c.width,
            height: c.height,
            borderRadius: 20,
            border: '1.5px dashed #c9b3ec',
            background: 'rgba(124, 77, 212, 0.03)',
            pointerEvents: 'none',
          }}
        />
      ))}
    </>
  );
}

export default React.memo(TreeEdgesLayer);