// MemberCard3D.tsx
import React, { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { Billboard, Text } from '@react-three/drei';
import type { FamilyMember } from '../../types/family';
import { calculateAge, isDeceased } from '../../utils/age';
import { useTranslation } from 'react-i18next';

interface Props {
  member: FamilyMember;
  position: [number, number, number];
  onOpen: () => void;
  lite?: boolean;
  // false = card doar decorativ: fără click, hover, zoom sau cursor "pointer"
  clickable?: boolean;
}

const PHOTO_RADIUS = 0.46;
// exportat — FamilyTree3D are nevoie de valoarea asta ca să știe unde
// să "taie" conectorii (la marginea sferei, nu la centrul ei)
export const ORB_RADIUS = PHOTO_RADIUS + 0.14;

function cssVar(name: string, fallback: string): string {
  if (typeof window === 'undefined') return fallback;
  const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return value || fallback;
}

function getAccentColor(gender: string | null | undefined, deceased: boolean): string {
  if (deceased) return cssVar('--color-earbore-gray', '#9a95a3');
  if (gender === 'FEMALE') return cssVar('--color-earbore-danger', '#c14a5f');
  if (gender === 'MALE') return cssVar('--color-earbore-info', '#3f6fb0');
  return cssVar('--color-earbore-400', '#9b7fc4');
}

// ── încărcare poză: întâi direct (rapid, merge pentru /assets/...),
//    apoi prin fetch cu credentials (pentru poze protejate din backend) ──
function loadImageElement(url: string, crossOrigin?: 'anonymous'): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    if (crossOrigin) img.crossOrigin = crossOrigin;
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Image load failed: ${url}`));
    img.src = url;
  });
}

async function loadPortraitImage(url: string): Promise<HTMLImageElement> {
  try {
    return await loadImageElement(url, 'anonymous');
  } catch {
    // încercăm și varianta cu cookies/credentials
  }
  const res = await fetch(url, { credentials: 'include' });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  const blob = await res.blob();
  const objectUrl = URL.createObjectURL(blob);
  try {
    return await loadImageElement(objectUrl);
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

function drawCoverTexture(img: HTMLImageElement, deceased: boolean): THREE.Texture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  const srcRatio = img.width / img.height;
  let sx = 0, sy = 0, sw = img.width, sh = img.height;
  if (srcRatio > 1) {
    sw = img.height;
    sx = (img.width - sw) / 2;
  } else if (srcRatio < 1) {
    sh = img.width;
    sy = (img.height - sh) / 2;
  }

  if (deceased) ctx.filter = 'grayscale(65%) brightness(0.97)';
  ctx.drawImage(img, sx, sy, sw, sh, 0, 0, 256, 256);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

function makeInitialsTexture(initials: string, deceased: boolean): THREE.Texture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = deceased ? '#e9e6df' : '#f1e4cf';
  ctx.fillRect(0, 0, 256, 256);
  ctx.fillStyle = deceased ? '#948f80' : '#6b4a2f';
  ctx.font = '600 92px Inter, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(initials, 128, 136);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

function usePortraitTexture(member: FamilyMember, deceased: boolean): THREE.Texture | null {
  const [texture, setTexture] = useState<THREE.Texture | null>(null);
  const currentRef = useRef<THREE.Texture | null>(null);

  // dispose doar la demontare, nu la fiecare schimbare de dependențe
  useEffect(() => () => {
    currentRef.current?.dispose();
    currentRef.current = null;
  }, []);

  useEffect(() => {
    let cancelled = false;
    const imageUrl = member.imageUrl;
    const initials = `${member.firstName[0] ?? ''}${member.lastName[0] ?? ''}`.toUpperCase();

    // înlocuiește textura curentă; o pe cea veche o eliberăm cu puțină
    // întârziere, ca să nu o ștergem cât timp mai e folosită într-un frame
    const publish = (tex: THREE.Texture) => {
      const old = currentRef.current;
      currentRef.current = tex;
      setTexture(tex);
      if (old && old !== tex) window.setTimeout(() => old.dispose(), 200);
    };

    // până se încarcă poza (sau dacă nu există), arătăm literele
    publish(makeInitialsTexture(initials, deceased));

    if (imageUrl) {
      loadPortraitImage(imageUrl)
        .then((img) => {
          if (cancelled) return;
          publish(drawCoverTexture(img, deceased));
        })
        .catch((err) => {
          if (import.meta.env.DEV) {
            console.warn('[MemberCard3D] poza nu s-a putut încărca, rămân inițialele:', imageUrl, err);
          }
        });
    }

    return () => {
      cancelled = true;
    };
  }, [member.imageUrl, member.firstName, member.lastName, deceased]);

  return texture;
}

const MemberCard3D: React.FC<Props> = ({ member, position, onOpen, lite = false, clickable = true }) => {
  const { t } = useTranslation();
  const deceased = isDeceased(member.deathDate);
  const age = calculateAge(member.birthDate, member.deathDate);
  const texture = usePortraitTexture(member, deceased);

  const accent = useMemo(() => getAccentColor(member.gender, deceased), [member.gender, deceased]);

  const photoGeometry = useMemo(() => new THREE.CircleGeometry(PHOTO_RADIUS, lite ? 32 : 48), [lite]);
  const orbGeometry = useMemo(
    () => new THREE.SphereGeometry(ORB_RADIUS, lite ? 20 : 32, lite ? 20 : 32),
    [lite],
  );
  const ringGeometry = useMemo(
    () => new THREE.RingGeometry(PHOTO_RADIUS + 0.005, PHOTO_RADIUS + 0.03, lite ? 32 : 48),
    [lite],
  );

  useEffect(() => () => {
    photoGeometry.dispose();
    orbGeometry.dispose();
    ringGeometry.dispose();
  }, [photoGeometry, orbGeometry, ringGeometry]);

  const billboardRef = useRef<THREE.Group>(null);
  const orbRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);
  const targetScale = useRef(1);
  targetScale.current = clickable && hovered ? 1.1 : 1;

  useFrame((state) => {
    if (billboardRef.current) {
      const current = billboardRef.current.scale.x;
      const next = current + (targetScale.current - current) * 0.18;
      billboardRef.current.scale.setScalar(next);
    }
    if (orbRef.current) {
      orbRef.current.rotation.y = state.clock.elapsedTime * 0.05;
    }
  });

  useEffect(() => () => { document.body.style.cursor = 'auto'; }, []);

  const interactionHandlers = clickable
    ? {
      onPointerOver: (e: any) => {
        e.stopPropagation();
        setHovered(true);
        document.body.style.cursor = 'pointer';
      },
      onPointerOut: (e: any) => {
        e.stopPropagation();
        setHovered(false);
        document.body.style.cursor = 'auto';
      },
      onClick: (e: any) => {
        e.stopPropagation();
        onOpen();
      },
    }
    : {};

  return (
    <group position={position}>
      <mesh ref={orbRef} geometry={orbGeometry}>
        {lite ? (
          // material ieftin: fără transmission (cel mai scump efect din scenă)
          <meshStandardMaterial
            color={accent}
            transparent
            opacity={0.18}
            roughness={0.3}
            metalness={0}
            side={THREE.DoubleSide}
            depthWrite={false}
          />
        ) : (
          <meshPhysicalMaterial
            color={accent}
            transparent
            opacity={0.14}
            roughness={0.25}
            metalness={0}
            transmission={0.55}
            thickness={0.4}
            clearcoat={0.6}
            clearcoatRoughness={0.3}
            side={THREE.DoubleSide}
            depthWrite={false}
          />
        )}
      </mesh>

      <Billboard>
        <group ref={billboardRef} {...interactionHandlers}>
          <mesh geometry={photoGeometry} position={[0, 0, 0.001]}>
            <meshStandardMaterial
              key={texture?.uuid ?? 'no-texture'}
              map={texture ?? undefined}
              color={texture ? '#ffffff' : '#e5ddc9'}
              roughness={0.55}
              metalness={0}
              emissive={hovered ? accent : '#000000'}
              emissiveIntensity={hovered ? 0.1 : 0}
            />
          </mesh>

          <mesh geometry={ringGeometry} position={[0, 0, 0.002]}>
            <meshBasicMaterial color={accent} transparent opacity={0.9} side={THREE.DoubleSide} />
          </mesh>
        </group>
      </Billboard>

      <Billboard position={[0, -(PHOTO_RADIUS + 0.24), 0]}>
        <Text
          fontSize={0.15}
          color={deceased ? '#8a8272' : '#3d2e1c'}
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.004}
          outlineColor="#f3f1ea"
          maxWidth={2}
        >
          {member.firstName} {member.lastName}
        </Text>
        {(age !== null || deceased) && (
          <Text
            position={[0, -0.18, 0]}
            fontSize={0.1}
            color="#9a8f7a"
            anchorX="center"
            anchorY="middle"
            outlineWidth={0.003}
            outlineColor="#f3f1ea"
          >
            {age !== null ? `${age} ${t('common.years')}` : ''}
            {deceased ? ' ✝' : ''}
          </Text>
        )}
      </Billboard>
    </group>
  );
};

export default MemberCard3D;