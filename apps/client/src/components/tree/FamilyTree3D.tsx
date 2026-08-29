import React, { useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Line, Html } from '@react-three/drei';
import { useNavigate } from 'react-router-dom';
import type { FamilyTreeData } from '../../types/family';
import { layoutFamilyTree, LAYOUT, type TreeDirection } from '../../lib/treeLayout';
import MemberCard3D from './MemberCard3D';

interface Props {
  treeData?: FamilyTreeData;
  direction: TreeDirection;
}

// scală de conversie din pixeli (spațiul de layout 2D) în unități 3D
const SCALE = 0.016;
// distanța pe Z dintre generații — dă efectul de "rafturi" 3D
const DEPTH_STEP = 1.6;

type Vec3 = [number, number, number];

const FamilyTree3D: React.FC<Props> = ({ treeData, direction }) => {
  const navigate = useNavigate();

  // refolosim exact același algoritm de layout ca la 2D, ca cele două vizualizări
  // să rămână sincronizate (aceleași generații, aceeași ordine, respectă direcția)
  const layout = useMemo(() => layoutFamilyTree(treeData, direction), [treeData, direction]);

  const positions = useMemo(() => {
    const map = new Map<string, Vec3>();
    const cx = layout.contentWidth / 2;
    const cy = layout.contentHeight / 2;
    layout.members.forEach((m) => {
      const px = (m.x + LAYOUT.CARD_WIDTH / 2 - cx) * SCALE;
      const py = -(m.y + LAYOUT.CARD_HEIGHT / 2 - cy) * SCALE;
      const pz = m.rank * DEPTH_STEP;
      map.set(m.id, [px, py, pz]);
    });
    return map;
  }, [layout]);

  // liniile de conexiune se calculează direct din datele arborelui (relații,
  // parteneriate, alianțe) — mai simplu și suficient de clar pentru navigare 3D
  const lines = useMemo(() => {
    if (!treeData) return [] as { id: string; points: [Vec3, Vec3]; color: string; dashed?: boolean }[];
    const result: { id: string; points: [Vec3, Vec3]; color: string; dashed?: boolean }[] = [];

    treeData.relations.forEach((r) => {
      const from = positions.get(r.parentId);
      const to = positions.get(r.childId);
      if (from && to) result.push({ id: `r-${r.id}`, points: [from, to], color: '#9b72e0' });
    });

    treeData.partnerships.forEach((p) => {
      const from = positions.get(p.partnerAId);
      const to = positions.get(p.partnerBId);
      if (from && to) result.push({ id: `p-${p.id}`, points: [from, to], color: '#7c4dd4', dashed: true });
    });

    (treeData.alliances ?? []).forEach((a) => {
      const from = positions.get(a.memberAId);
      const to = positions.get(a.memberBId);
      if (from && to) result.push({ id: `a-${a.id}`, points: [from, to], color: '#2f9e6a', dashed: true });
    });

    return result;
  }, [treeData, positions]);

  return (
    <div style={{ width: '100%', height: '100%', touchAction: 'none' }}>
      <Canvas camera={{ position: [0, 2, 16], fov: 50 }} dpr={[1, 2]}>
        <color attach="background" args={['#f8f6fb']} />
        <ambientLight intensity={0.95} />
        <directionalLight position={[6, 10, 8]} intensity={0.55} />

        <OrbitControls
          makeDefault
          enableDamping
          dampingFactor={0.12}
          minDistance={4}
          maxDistance={70}
          maxPolarAngle={Math.PI * 0.85}
        />

        {lines.map((l) => (
          <Line
            key={l.id}
            points={l.points}
            color={l.color}
            lineWidth={1.4}
            dashed={l.dashed}
            dashScale={l.dashed ? 6 : undefined}
            transparent
            opacity={0.85}
          />
        ))}

        {layout.members.map((m) => {
          const pos = positions.get(m.id);
          if (!pos) return null;
          return (
            <Html key={m.id} position={pos} transform occlude={false} distanceFactor={8} zIndexRange={[10, 0]}>
              <MemberCard3D member={m.member} onOpen={() => navigate(`/members/${m.id}`)} />
            </Html>
          );
        })}
      </Canvas>
    </div>
  );
};

export default FamilyTree3D;