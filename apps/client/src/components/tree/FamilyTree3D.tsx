// FamilyTree3D.tsx
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { Canvas, type RootState } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { useNavigate } from 'react-router-dom';
import type { FamilyTreeData } from '../../types/family';
import { layoutFamilyTree, type TreeDirection } from '../../lib/treeLayout';
import MemberCard3D, { ORB_RADIUS } from './MemberCard3D';

interface Props {
  treeData?: FamilyTreeData;
  direction?: TreeDirection;
  // rotație automată a camerei în jurul arborelui (folosită pe landing)
  autoRotate?: boolean;
  autoRotateSpeed?: number;
  // false = arbore doar de privit: fără rotire/zoom/pan manual și fără
  // să captureze scroll-ul paginii (pointer-events: none). Implicit true.
  interactive?: boolean;
  // multiplicator pentru distanța camerei (<1 = mai aproape). Implicit 1.
  cameraZoom?: number;
  // true oprește complet randarea (ex. când canvas-ul e în afara ecranului)
  paused?: boolean;
  // NOU — versiune ușoară (landing): fără umbre, fără transmission, dpr mic
  lite?: boolean;
}

const RANK_HEIGHT = 3.8;

const ANGLE_STEP = 0.42;
const ARC_SPAN = Math.PI * 1.5;
const BASE_RADIUS = 1.4;
const RADIUS_GROWTH = 1.15;
const MIN_ARC_PER_MEMBER = 0.85;

const CONNECTOR_GAP = 0.1;
const MIN_CONNECTOR_LENGTH = 0.05;

// NOU — dacă WebGL pierde contextul, încercăm să recreăm Canvas-ul de maxim
// atâtea ori (evităm bucla infinită pe dispozitive foarte slabe)
const MAX_CONTEXT_RETRIES = 3;

type Vec3 = [number, number, number];

// NOU — trunchiul e pe axa de rotație (0, 0). Toată scena (spirala, ținta
// camerei, solul) se învârte în jurul aceleiași axe, deci piciorul arborelui
// rămâne fix pe loc, iar rotația e un cerc perfect.
const TRUNK_TOP: Vec3 = [0, 0, 0];
const GROUND_Y = -0.9;

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
    <mesh position={transform.mid} quaternion={transform.quaternion}>
      <cylinderGeometry args={[radius, radius, transform.length, 8, 1]} />
      <meshStandardMaterial color={color} roughness={0.45} metalness={0.15} transparent opacity={opacity} />
    </mesh>
  );
};

const Trunk: React.FC<{ fromY: number; toY: number; lite: boolean }> = ({ fromY, toY, lite }) => {
  const height = toY - fromY;
  if (height <= 0) return null;
  return (
    <mesh position={[0, fromY + height / 2, 0]} castShadow={!lite} receiveShadow={!lite}>
      <cylinderGeometry args={[0.12, 0.2, height, 12]} />
      <meshStandardMaterial color="#8a7f6e" roughness={0.7} metalness={0.1} />
    </mesh>
  );
};

const Bud: React.FC<{ position: Vec3; lite: boolean }> = ({ position, lite }) => {
  const seed = position[0] * 3.7 + position[2] * 5.1;
  const scale = 0.16 + (Math.sin(seed) * 0.5 + 0.5) * 0.06;
  return (
    <mesh position={[position[0], position[1] + ORB_RADIUS + 0.15, position[2]]}>
      <sphereGeometry args={[scale, 16, 16]} />
      {lite ? (
        <meshStandardMaterial color="#9cb583" transparent opacity={0.55} roughness={0.3} />
      ) : (
        <meshPhysicalMaterial
          color="#9cb583"
          transparent
          opacity={0.5}
          roughness={0.3}
          transmission={0.4}
          thickness={0.3}
        />
      )}
    </mesh>
  );
};

function connectorColorForRank(rank: number, maxRank: number): string {
  const t = maxRank > 0 ? rank / maxRank : 0;
  const dark = new THREE.Color('#8a8272');
  const light = new THREE.Color('#c9c2b0');
  return dark.lerp(light, t).getStyle();
}

// taie ambele capete ale liniei la marginea sferelor
function trimToOrbEdge(from: Vec3, to: Vec3, offset: number): { from: Vec3; to: Vec3 } | null {
  const start = new THREE.Vector3(...from);
  const end = new THREE.Vector3(...to);
  const delta = end.clone().sub(start);
  const dist = delta.length();
  if (dist <= offset * 2 + MIN_CONNECTOR_LENGTH) return null;

  const dir = delta.clone().normalize();
  const trimmedStart = start.clone().add(dir.clone().multiplyScalar(offset));
  const trimmedEnd = end.clone().sub(dir.clone().multiplyScalar(offset));
  return {
    from: [trimmedStart.x, trimmedStart.y, trimmedStart.z],
    to: [trimmedEnd.x, trimmedEnd.y, trimmedEnd.z],
  };
}

// NOU — ramura de la vârful trunchiului spre un membru din prima generație:
// tăiem doar capătul dinspre sferă (capătul dinspre trunchi rămâne lipit)
function trimBranchEnd(from: Vec3, to: Vec3, offset: number): { from: Vec3; to: Vec3 } | null {
  const start = new THREE.Vector3(...from);
  const end = new THREE.Vector3(...to);
  const delta = end.clone().sub(start);
  const dist = delta.length();
  if (dist <= offset + MIN_CONNECTOR_LENGTH) return null;

  const dir = delta.clone().normalize();
  const trimmedEnd = end.clone().sub(dir.multiplyScalar(offset));
  return { from, to: [trimmedEnd.x, trimmedEnd.y, trimmedEnd.z] };
}

type ConnectorData = { id: string; from: Vec3; to: Vec3; radius: number; color: string; opacity?: number };

const FamilyTree3D: React.FC<Props> = ({
  treeData,
  autoRotate = false,
  autoRotateSpeed = 1.2,
  interactive = true,
  cameraZoom = 1,
  paused = false,
  lite = false,
}) => {
  const navigate = useNavigate();

  // ── plasă de siguranță: dacă browserul pierde contextul WebGL, recreăm Canvas-ul ──
  const [canvasKey, setCanvasKey] = useState(0);
  const retriesRef = useRef(0);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const handleCreated = useCallback(({ gl }: RootState) => {
    const canvas = gl.domElement;
    let timer: number | undefined;

    const onLost = (e: Event) => {
      e.preventDefault(); // permite browserului să încerce restaurarea
      window.clearTimeout(timer);
      // dacă în ~0.8s contextul nu revine singur, recreăm Canvas-ul
      timer = window.setTimeout(() => {
        if (!mountedRef.current || !canvas.isConnected) return;
        if (retriesRef.current >= MAX_CONTEXT_RETRIES) return;
        retriesRef.current += 1;
        setCanvasKey((k) => k + 1);
      }, 800);
    };
    const onRestored = () => window.clearTimeout(timer);

    canvas.addEventListener('webglcontextlost', onLost);
    canvas.addEventListener('webglcontextrestored', onRestored);
  }, []);

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
    if (!treeData) return [] as ConnectorData[];
    const result: ConnectorData[] = [];
    const gapOffset = ORB_RADIUS + CONNECTOR_GAP;

    const radiusForRank = (rank: number) => {
      const t = rank / maxRank;
      return Math.max(0.02, 0.05 * (1 - t) + 0.02);
    };

    const rankById = new Map(layout.members.map((m) => [m.id, m.rank]));

    // NOU — ramuri de la trunchi spre fiecare membru din prima generație
    layout.members
      .filter((m) => m.rank === rootRank)
      .forEach((m) => {
        const to = positions.get(m.id);
        if (!to) return;
        const trimmed = trimBranchEnd(TRUNK_TOP, to, gapOffset);
        if (!trimmed) return;
        result.push({
          id: `trunk-${m.id}`,
          ...trimmed,
          radius: 0.06,
          color: connectorColorForRank(0, maxRank),
          opacity: 0.75,
        });
      });

    treeData.relations.forEach((r) => {
      const from = positions.get(r.parentId);
      const to = positions.get(r.childId);
      if (!from || !to) return;
      const trimmed = trimToOrbEdge(from, to, gapOffset);
      if (!trimmed) return;
      const childRank = rankById.get(r.childId) ?? 0;
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

  const totalHeight = maxRank * RANK_HEIGHT;
  // discul de la sol acoperă toată raza spiralei
  const groundRadius = BASE_RADIUS + maxRank * RADIUS_GROWTH + 1.4;

  // memoizat ca să nu "resetăm" ținta camerei la fiecare re-render
  const controlsTarget = useMemo<Vec3>(() => [0, totalHeight * 0.5, 0], [totalHeight]);

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        touchAction: interactive ? 'none' : 'auto',
        pointerEvents: interactive ? 'auto' : 'none',
      }}
    >
      <Canvas
        key={canvasKey}
        // x = 0: camera e exact pe axa Z, deci orbita e un cerc perfect în jurul trunchiului
        camera={{
          position: [0, totalHeight * 0.55, (totalHeight * 1.25 + 12) * cameraZoom],
          fov: 42,
        }}
        dpr={lite ? [1, 1.5] : [1, 2]}
        shadows={lite ? false : 'percentage'}
        gl={{ antialias: !lite, powerPreference: 'high-performance' }}
        frameloop={paused ? 'demand' : 'always'}
        onCreated={handleCreated}
      >
        <color attach="background" args={['#faf9f5']} />
        <fog attach="fog" args={['#faf9f5', totalHeight * 1.7, totalHeight * 3.4 + 26]} />

        <ambientLight intensity={0.85} />
        <directionalLight
          position={[6, totalHeight + 8, 8]}
          intensity={0.7}
          castShadow={!lite}
          shadow-mapSize={[1024, 1024]}
        />
        <hemisphereLight args={['#f5f6ef', '#5b4632', 0.3]} />

        <OrbitControls
          makeDefault
          enableDamping
          dampingFactor={0.12}
          minDistance={3}
          maxDistance={100}
          maxPolarAngle={Math.PI * 0.49}
          target={controlsTarget}
          enableRotate={interactive}
          enableZoom={interactive}
          enablePan={interactive}
          screenSpacePanning
          panSpeed={0.9}
          zoomToCursor
          autoRotate={autoRotate}
          autoRotateSpeed={autoRotateSpeed}
        />

        {/* solul — centrat pe axa de rotație, ca trunchiul */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, GROUND_Y - 0.01, 0]} receiveShadow={!lite}>
          <circleGeometry args={[groundRadius, 48]} />
          <meshStandardMaterial color="#dbe2cb" roughness={1} transparent opacity={0.55} />
        </mesh>

        <Trunk fromY={GROUND_Y} toY={TRUNK_TOP[1]} lite={lite} />

        {connectors.map((c) => (
          <Connector key={c.id} from={c.from} to={c.to} radius={c.radius} color={c.color} opacity={c.opacity} />
        ))}

        {layout.members.map((m) => {
          const pos = positions.get(m.id);
          if (!pos || !m.member) return null;
          return (
            <React.Fragment key={m.id}>
              {leafMemberIds.has(m.id) && <Bud position={pos} lite={lite} />}
              <MemberCard3D
                position={pos}
                member={m.member}
                lite={lite}
                onOpen={() => navigate(`/members/${m.id}`)}
              />
            </React.Fragment>
          );
        })}
      </Canvas>
    </div>
  );
};

export default FamilyTree3D;