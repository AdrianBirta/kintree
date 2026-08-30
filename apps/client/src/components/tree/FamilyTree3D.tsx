import React, { useMemo } from 'react';
import * as THREE from 'three';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { useNavigate } from 'react-router-dom';
import type { FamilyTreeData } from '../../types/family';
import { layoutFamilyTree, LAYOUT, type TreeDirection } from '../../lib/treeLayout';
import MemberCard3D from './MemberCard3D';

interface Props {
  treeData?: FamilyTreeData;
  // NOU — păstrat doar pentru compatibilitate cu DashboardPage (2D folosește direcția),
  // dar orientarea 3D e FIXĂ: strămoșii (rank 0) mereu jos, descendenții mereu cresc în sus.
  direction?: TreeDirection;
}

// scală de conversie din pixeli (spațiul de layout 2D) în unități 3D, doar pe orizontală
const SCALE_X = 0.014;
// distanța verticală dintre generații
const RANK_HEIGHT = 3.1;

type Vec3 = [number, number, number];

// ─────────────────────────────────────────────────────────────
// O ramură — tub subțire, ușor curbat, mai gros spre trunchi
// ─────────────────────────────────────────────────────────────
interface BranchProps {
  from: Vec3;
  to: Vec3;
  radius: number;
  color: string;
}

const Branch: React.FC<BranchProps> = ({ from, to, radius, color }) => {
  const geometry = useMemo(() => {
    const start = new THREE.Vector3(...from);
    const end = new THREE.Vector3(...to);
    const mid = start.clone().lerp(end, 0.5);
    const bendSeed = from[0] * 12.9898 + to[0] * 78.233;
    mid.x += Math.sin(bendSeed) * 0.18;

    const curve = new THREE.CatmullRomCurve3([start, mid, end]);
    return new THREE.TubeGeometry(curve, 10, radius, 6, false);
  }, [from, to, radius]);

  return (
    <mesh geometry={geometry} castShadow receiveShadow>
      <meshStandardMaterial color={color} roughness={0.9} metalness={0} />
    </mesh>
  );
};

// ─────────────────────────────────────────────────────────────
// Trunchi — cilindru simplu, drept, de la sol până la prima generație (rank 0)
// ─────────────────────────────────────────────────────────────
const Trunk: React.FC<{ x: number; z: number; fromY: number; toY: number }> = ({ x, z, fromY, toY }) => {
  const height = toY - fromY;
  if (height <= 0) return null;
  return (
    <mesh position={[x, fromY + height / 2, z]} castShadow receiveShadow>
      <cylinderGeometry args={[0.16, 0.26, height, 8]} />
      <meshStandardMaterial color="#7a5a40" roughness={0.95} />
    </mesh>
  );
};

// ─────────────────────────────────────────────────────────────
// Frunziș minimal — doar pentru capetele de ramură (membri fără copii)
// ─────────────────────────────────────────────────────────────
const FoliageCluster: React.FC<{ position: Vec3 }> = ({ position }) => {
  const seed = position[0] * 3.7 + position[2] * 5.1;
  const scale = 0.4 + (Math.sin(seed) * 0.5 + 0.5) * 0.15;
  return (
    <mesh position={[position[0], position[1] + 0.75, position[2]]}>
      <icosahedronGeometry args={[scale, 1]} />
      <meshStandardMaterial color="#7fac68" roughness={1} flatShading />
    </mesh>
  );
};

const FamilyTree3D: React.FC<Props> = ({ treeData }) => {
  const navigate = useNavigate();

  // NOU — layout-ul e mereu calculat cu 'top-down' intern, DOAR ca sursă pentru rank și x;
  // nu folosim y-ul sau edge-urile calculate de layoutFamilyTree (acelea depind de direcție),
  // ci ne construim singuri poziția verticală pe baza rank-ului brut, mereu în același sens.
  const layout = useMemo(() => layoutFamilyTree(treeData, 'top-down'), [treeData]);
  const maxRank = layout.maxRank || 1;

  // rădăcina (strămoșii) e mereu rank 0 — FIX, nu depinde de toggle-ul din Dashboard
  const rootRank = 0;

  const positions = useMemo(() => {
    const map = new Map<string, Vec3>();
    const cx = layout.contentWidth / 2;
    layout.members.forEach((m) => {
      const px = (m.x + LAYOUT.CARD_WIDTH / 2 - cx) * SCALE_X;
      // rank mic (strămoși) => y mic (jos); rank mare (descendenți) => y mare (sus) — FIX
      const py = m.rank * RANK_HEIGHT;
      const seed = m.x * 0.011;
      const pz = Math.sin(seed) * 0.35;
      map.set(m.id, [px, py, pz]);
    });
    return map;
  }, [layout]);

  const branches = useMemo(() => {
    if (!treeData) return [] as { id: string; from: Vec3; to: Vec3; radius: number; color: string }[];
    const result: { id: string; from: Vec3; to: Vec3; radius: number; color: string }[] = [];

    const radiusForRank = (rank: number) => {
      const t = rank / maxRank;
      return Math.max(0.045, 0.14 * (1 - t) + 0.045);
    };

    treeData.relations.forEach((r) => {
      const from = positions.get(r.parentId);
      const to = positions.get(r.childId);
      const childRank = layout.members.find((m) => m.id === r.childId)?.rank ?? 0;
      if (from && to) result.push({ id: `r-${r.id}`, from, to, radius: radiusForRank(childRank), color: '#8a6448' });
    });

    treeData.partnerships.forEach((p) => {
      const from = positions.get(p.partnerAId);
      const to = positions.get(p.partnerBId);
      if (from && to) result.push({ id: `p-${p.id}`, from, to, radius: 0.03, color: '#c2a274' });
    });

    (treeData.alliances ?? []).forEach((a) => {
      const from = positions.get(a.memberAId);
      const to = positions.get(a.memberBId);
      if (from && to) result.push({ id: `a-${a.id}`, from, to, radius: 0.025, color: '#a3bd8f' });
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
        camera={{ position: [0.5, totalHeight * 0.55, totalHeight * 1.15 + 9], fov: 42 }}
        dpr={[1, 2]}
        shadows
      >
        <color attach="background" args={['#f3f1ea']} />
        <fog attach="fog" args={['#f3f1ea', totalHeight * 1.6, totalHeight * 3.2 + 20]} />

        <ambientLight intensity={0.75} />
        <directionalLight position={[6, totalHeight + 8, 8]} intensity={0.9} castShadow shadow-mapSize={[1024, 1024]} />
        <hemisphereLight args={['#eef2e4', '#5b4632', 0.35]} />

        <OrbitControls
          makeDefault
          enableDamping
          dampingFactor={0.12}
          minDistance={4}
          maxDistance={80}
          maxPolarAngle={Math.PI * 0.48}
          target={[0, totalHeight * 0.5, 0]}
        />

        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[trunkX, groundY - 0.01, trunkZ]} receiveShadow>
          <circleGeometry args={[2.4, 32]} />
          <meshStandardMaterial color="#c9d6b3" roughness={1} transparent opacity={0.7} />
        </mesh>

        <Trunk x={trunkX} z={trunkZ} fromY={groundY} toY={0} />

        {branches.map((b) => (
          <Branch key={b.id} from={b.from} to={b.to} radius={b.radius} color={b.color} />
        ))}

        {layout.members.map((m) => {
          const pos = positions.get(m.id);
          if (!pos) return null;
          return (
            <React.Fragment key={m.id}>
              {leafMemberIds.has(m.id) && <FoliageCluster position={pos} />}
              <MemberCard3D position={pos} member={m.member} onOpen={() => navigate(`/members/${m.id}`)} />
            </React.Fragment>
          );
        })}
      </Canvas>
    </div>
  );
};

export default FamilyTree3D;