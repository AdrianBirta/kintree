import React from 'react';
import type { LayoutCoupleFrame, LayoutEdge } from '../../lib/treeLayout';
import { LAYOUT } from '../../lib/treeLayout';

interface Props {
  edges: LayoutEdge[];
  couples: LayoutCoupleFrame[];
  width: number;
  height: number;
}

// culorile pt. union-child/parent-child sunt exact earbore-500/earbore-400 din design system —
// legate de variabilele CSS, nu hardcodate, ca să rămână sincron dacă schimbați paleta
const EDGE_COLORS: Record<LayoutEdge['kind'], string> = {
  'union-child': 'var(--color-earbore-500)',
  'parent-child': 'var(--color-earbore-400)',
  'secondary-partner': 'var(--color-earbore-warning)',
};

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
            strokeWidth={edge.kind === 'secondary-partner' ? 2 : 2.2}
            strokeDasharray={edge.kind === 'secondary-partner' || edge.long ? '5 5' : undefined}
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
            border: '1.5px dashed #c9b3ec', // nuanță proprie, între earbore-200 și 300 — păstrată ca în original
            background: 'rgba(124, 77, 212, 0.03)',
            pointerEvents: 'none',
          }}
        />
      ))}
    </>
  );
}

// memo: edges/couples vin din același obiect `layout` memoizat în FamilyTreeCanvas —
// referința rămâne stabilă cât timp treeData nu se schimbă, deci acest strat nu trebuie
// re-randat la fiecare tick de pan/zoom
export default React.memo(TreeEdgesLayer);