// FamilyTree3D.tsx
import React, { useMemo } from 'react';
import * as THREE from 'three';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { useNavigate } from 'react-router-dom';
import type { FamilyTreeData } from '../../types/family';
import { layoutFamilyTree, type TreeDirection } from '../../lib/treeLayout';
import MemberCard3D, { ORB_RADIUS } from './MemberCard3D';

interface Props {
  treeData?: FamilyTreeData;
  direction?: TreeDirection;
}

const RANK_HEIGHT = 3.8;

const ANGLE_STEP = 0.42;
const ARC_SPAN = Math.PI * 1.5;
const BASE_RADIUS = 1.4;
const RADIUS_GROWTH = 1.15;
const MIN_ARC_PER_MEMBER = 0.85;

// spațiu liber lăsat între marginea sferei și capătul liniei — ca
// linia să nu "lipească" vizual de poză, ci să plutească la mică distanță
const CONNECTOR_GAP = 0.1;
// dacă după tăiere nu mai rămâne o linie vizibilă (membri prea apropiați),
// nu randăm deloc conectorul, ca să evităm o geometrie inversată/glitch
const MIN_CONNECTOR_LENGTH = 0.05;

type Vec3 = [number, number, number];

// ─────────────────────────────────────────────────────────────
// Conector — înlocuiește complet vechea "ramură" (tub curbat, culoare
// de scoarță). E o tijă dreaptă, subțire, orientată direct între cele
// două puncte primite. Design intenționat "grafic"/minimalist, nu
// organic — liniile nu se mai vor niciodată a fi ramuri de copac
// literale, ci conectori clari între generații.
//
// IMPORTANT: `from`/`to` primite aici sunt deja PRE-TĂIATE (vezi
// `trimToOrbEdge` mai jos) — componenta nu mai știe nimic despre
// sfere, doar desenează segmentul care i se dă.
// ─────────────────────────────────────────────────────────────
interface ConnectorProps {
  from: Vec3;
  to: Vec3;
  radius: number;
  color: string;
  opacity?: number;
}

const UP = new THREE.Vector3(0, 1, 0);

const Connector: React.FC<ConnectorProps> = ({ from, to, radius, color, opacity = 0.6 }) => {
  const transform = useMemo(() => {
    const start = new THREE.Vector3(...from);
    const end = new THREE.Vector3(...to);
    const delta = end.clone().sub(start);
    const length = delta.length();
    if (length < MIN_CONNECTOR_LENGTH) return null;

    const mid = start.clone().add(end).multiplyScalar(0.5);
    const quaternion = new THREE.Quaternion().setFromUnitVectors(UP, delta.clone().normalize());
    return { mid, quaternion, length };
  }, [from, to]);

  if (!transform) return null;

  return (
    <mesh position={transform.mid} quaternion={transform.quaternion} castShadow receiveShadow>
      <cylinderGeometry args={[radius, radius, transform.length, 8, 1]} />
      <meshStandardMaterial color={color} roughness={0.45} metalness={0.15} transparent opacity={opacity} />
    </mesh>
  );
};

// ─────────────────────────────────────────────────────────────
// Trunchi — neschimbat structural, doar culoare puțin mai neutră,
// aliniată cu paleta noilor conectori.
// ─────────────────────────────────────────────────────────────
const Trunk: React.FC<{ x: number; z: number; fromY: number; toY: number }> = ({ x, z, fromY, toY }) => {
  const height = toY - fromY;
  if (height <= 0) return null;
  return (
    <mesh position={[x, fromY + height / 2, z]} castShadow receiveShadow>
      <cylinderGeometry args={[0.1, 0.16, height, 12]} />
      <meshStandardMaterial color="#8a7f6e" roughness={0.7} metalness={0.1} />
    </mesh>
  );
};

const Bud: React.FC<{ position: Vec3 }> = ({ position }) => {
  const seed = position[0] * 3.7 + position[2] * 5.1;
  const scale = 0.16 + (Math.sin(seed) * 0.5 + 0.5) * 0.06;
  return (
    <mesh position={[position[0], position[1] + ORB_RADIUS + 0.15, position[2]]}>
      <sphereGeometry args={[scale, 16, 16]} />
      <meshPhysicalMaterial
        color="#9cb583"
        transparent
        opacity={0.5}
        roughness={0.3}
        transmission={0.4}
        thickness={0.3}
      />
    </mesh>
  );
};

function connectorColorForRank(rank: number, maxRank: number): string {
  const t = maxRank > 0 ? rank / maxRank : 0;
  const dark = new THREE.Color('#8a8272');
  const light = new THREE.Color('#c9c2b0');
  return dark.lerp(light, t).getStyle();
}

// ─────────────────────────────────────────────────────────────
// Scurtează segmentul from→to cu `offset` la fiecare capăt, ca linia
// să se oprească exact la marginea sferelor (nu la centrul lor).
// E singura schimbare care rezolvă efectiv problema liniilor ce
// "intră și ies" prin poze.
// ─────────────────────────────────────────────────────────────
function trimToOrbEdge(from: Vec3, to: Vec3, offset: number): { from: Vec3; to: Vec3 } | null {
  const start = new THREE.Vector3(...from);
  const end = new THREE.Vector3(...to);
  const delta = end.clone().sub(start);
  const dist = delta.length();
  if (dist <= offset * 2 + MIN_CONNECTOR_LENGTH) return null; // membri prea apropiați — nu desenăm

  const dir = delta.clone().normalize();
  const trimmedStart = start.clone().add(dir.clone().multiplyScalar(offset));
  const trimmedEnd = end.clone().sub(dir.clone().multiplyScalar(offset));
  return {
    from: [trimmedStart.x, trimmedStart.y, trimmedStart.z],
    to: [trimmedEnd.x, trimmedEnd.y, trimmedEnd.z],
  };
}

const FamilyTree3D: React.FC<Props> = ({ treeData }) => {
  const navigate = useNavigate();

  const layout = useMemo(() => layoutFamilyTree(treeData, 'top-down'), [treeData]);
  const maxRank = layout.maxRank || 1;
  const rootRank = 0;

  const positions = useMemo(() => {
    const map = new Map<string, Vec3>();

    const byRank = new Map<number, typeof layout.members>();
    layout.members.forEach((m) => {
      const list = byRank.get(m.rank) ?? [];
      list.push(m);
      byRank.set(m.rank, list);
    });

    byRank.forEach((members, rank) => {
      const sorted = [...members].sort((a, b) => a.x - b.x);
      const count = sorted.length;

      const neededSpan = Math.min(ARC_SPAN, MIN_ARC_PER_MEMBER * Math.max(count - 1, 1));
      const rankBaseAngle = rank * ANGLE_STEP;
      const radius = BASE_RADIUS + rank * RADIUS_GROWTH;

      sorted.forEach((m, i) => {
        const t = count > 1 ? i / (count - 1) - 0.5 : 0;
        const angle = rankBaseAngle + t * neededSpan;

        const px = Math.cos(angle) * radius;
        const pz = Math.sin(angle) * radius;
        const py = m.rank * RANK_HEIGHT;

        map.set(m.id, [px, py, pz]);
      });
    });

    return map;
  }, [layout]);

  const connectors = useMemo(() => {
    if (!treeData) return [] as { id: string; from: Vec3; to: Vec3; radius: number; color: string; opacity?: number }[];
    const result: { id: string; from: Vec3; to: Vec3; radius: number; color: string; opacity?: number }[] = [];
    const gapOffset = ORB_RADIUS + CONNECTOR_GAP;

    const radiusForRank = (rank: number) => {
      const t = rank / maxRank;
      return Math.max(0.02, 0.05 * (1 - t) + 0.02);
    };

    treeData.relations.forEach((r) => {
      const from = positions.get(r.parentId);
      const to = positions.get(r.childId);
      if (!from || !to) return;
      const trimmed = trimToOrbEdge(from, to, gapOffset);
      if (!trimmed) return;
      const childRank = layout.members.find((m) => m.id === r.childId)?.rank ?? 0;
      result.push({
        id: `r-${r.id}`,
        ...trimmed,
        radius: radiusForRank(childRank),
        color: connectorColorForRank(childRank, maxRank),
      });
    });

    treeData.partnerships.forEach((p) => {
      const from = positions.get(p.partnerAId);
      const to = positions.get(p.partnerBId);
      if (!from || !to) return;
      const trimmed = trimToOrbEdge(from, to, gapOffset);
      if (!trimmed) return;
      result.push({ id: `p-${p.id}`, ...trimmed, radius: 0.016, color: '#c2a274', opacity: 0.7 });
    });

    (treeData.alliances ?? []).forEach((a) => {
      const from = positions.get(a.memberAId);
      const to = positions.get(a.memberBId);
      if (!from || !to) return;
      const trimmed = trimToOrbEdge(from, to, gapOffset);
      if (!trimmed) return;
      result.push({ id: `a-${a.id}`, ...trimmed, radius: 0.012, color: '#a3bd8f', opacity: 0.55 });
    });

    return result;
  }, [treeData, positions, layout.members, maxRank]);

  const leafMemberIds = useMemo(() => {
    if (!treeData) return new Set<string>();
    const hasChildren = new Set(treeData.relations.map((r) => r.parentId));
    return new Set(treeData.members.filter((m) => !hasChildren.has(m.id)).map((m) => m.id));
  }, [treeData]);

  const rootMembers = useMemo(
    () => layout.members.filter((m) => m.rank === rootRank),
    [layout.members],
  );
  const trunkX = rootMembers.length
    ? rootMembers.reduce((s, m) => s + (positions.get(m.id)?.[0] ?? 0), 0) / rootMembers.length
    : 0;
  const trunkZ = rootMembers.length
    ? rootMembers.reduce((s, m) => s + (positions.get(m.id)?.[2] ?? 0), 0) / rootMembers.length
    : 0;

  const totalHeight = maxRank * RANK_HEIGHT;
  const groundY = -0.9;

  return (
    <div style={{ width: '100%', height: '100%', touchAction: 'none' }}>
      <Canvas
        camera={{ position: [0.5, totalHeight * 0.55, totalHeight * 1.25 + 12], fov: 42 }}
        dpr={[1, 2]}
        shadows
      >
        <color attach="background" args={['#faf9f5']} />
        <fog attach="fog" args={['#faf9f5', totalHeight * 1.7, totalHeight * 3.4 + 26]} />

        <ambientLight intensity={0.85} />
        <directionalLight position={[6, totalHeight + 8, 8]} intensity={0.7} castShadow shadow-mapSize={[1024, 1024]} />
        <hemisphereLight args={['#f5f6ef', '#5b4632', 0.3]} />

        <OrbitControls
          makeDefault
          enableDamping
          dampingFactor={0.12}
          minDistance={3}
          maxDistance={100}
          maxPolarAngle={Math.PI * 0.49}
          target={[0, totalHeight * 0.5, 0]}
          enablePan
          screenSpacePanning
          panSpeed={0.9}
          zoomToCursor
        />

        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[trunkX, groundY - 0.01, trunkZ]} receiveShadow>
          <circleGeometry args={[3, 32]} />
          <meshStandardMaterial color="#dbe2cb" roughness={1} transparent opacity={0.55} />
        </mesh>

        <Trunk x={trunkX} z={trunkZ} fromY={groundY} toY={0} />

        {connectors.map((c) => (
          <Connector key={c.id} from={c.from} to={c.to} radius={c.radius} color={c.color} opacity={c.opacity} />
        ))}

        {layout.members.map((m) => {
          const pos = positions.get(m.id);
          if (!pos || !m.member) return null;
          return (
            <React.Fragment key={m.id}>
              {leafMemberIds.has(m.id) && <Bud position={pos} />}
              <MemberCard3D position={pos} member={m.member} onOpen={() => navigate(`/members/${m.id}`)} />
            </React.Fragment>
          );
        })}
      </Canvas>
    </div>
  );
};

export default FamilyTree3D;