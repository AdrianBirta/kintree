import React, { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { Billboard, Text } from '@react-three/drei';
import type { FamilyMember } from '../../types/family';
import { calculateAge, isDeceased } from '../../utils/age';

interface Props {
  member: FamilyMember;
  position: [number, number, number];
  onOpen: () => void;
}

// ─────────────────────────────────────────────────────────────
// Medalionul e un obiect 3D real (monedă/pandantiv), nu un card HTML plat —
// are grosime, muchie și verso, deci arată corect din orice unghi de rotație.
// ─────────────────────────────────────────────────────────────
const MEDALLION_RADIUS = 0.62;
const MEDALLION_DEPTH = 0.16;
const RIM_METALNESS = 0.35;
const RIM_ROUGHNESS = 0.4;

function cssVar(name: string, fallback: string): string {
  if (typeof window === 'undefined') return fallback;
  const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return value || fallback;
}

// Aceeași convenție ca la cardurile 2D: roșu = femei, albastru = bărbați,
// mov neutru = nespecificat, gri estompat = decedat.
function getRimColor(gender: string | null | undefined, deceased: boolean): string {
  if (deceased) return cssVar('--color-earbore-gray', '#5b5468');
  if (gender === 'FEMALE') return cssVar('--color-earbore-danger', '#d3324a');
  if (gender === 'MALE') return cssVar('--color-earbore-info', '#2f6fed');
  return cssVar('--color-earbore-400', '#9b72e0');
}

// Încarcă poza ca textură reală; fără poză, desenăm inițialele pe un canvas.
// Pentru membrii decedați aplicăm grayscale direct pe pixelii texturii
// (echivalentul filtrului CSS de pe cardurile 2D).
function usePortraitTexture(member: FamilyMember, deceased: boolean): THREE.Texture | null {
  const [texture, setTexture] = useState<THREE.Texture | null>(null);

  useEffect(() => {
    let cancelled = false;
    let owned: THREE.Texture | null = null;
    const initials = `${member.firstName[0] ?? ''}${member.lastName[0] ?? ''}`;
    const imageUrl = member.imageUrl;

    const makeInitialsTexture = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 256;
      canvas.height = 256;
      const ctx = canvas.getContext('2d')!;
      ctx.fillStyle = deceased ? '#e7e2d8' : '#f1e4cf';
      ctx.fillRect(0, 0, 256, 256);
      ctx.fillStyle = deceased ? '#8a8272' : '#6b4a2f';
      ctx.font = '700 96px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(initials, 128, 138);
      const tex = new THREE.CanvasTexture(canvas);
      tex.colorSpace = THREE.SRGBColorSpace;
      return tex;
    };

    if (!imageUrl) {
      owned = makeInitialsTexture();
      setTexture(owned);
      return () => owned?.dispose();
    }

    if (!deceased) {
      const loader = new THREE.TextureLoader();
      loader.setCrossOrigin('anonymous');
      loader.load(
        imageUrl,
        (tex) => {
          if (cancelled) { tex.dispose(); return; }
          tex.colorSpace = THREE.SRGBColorSpace;
          owned = tex;
          setTexture(tex);
        },
        undefined,
        () => { if (!cancelled) setTexture(makeInitialsTexture()); },
      );
    } else {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        if (cancelled) return;
        try {
          const canvas = document.createElement('canvas');
          canvas.width = 256;
          canvas.height = 256;
          const ctx = canvas.getContext('2d')!;
          ctx.filter = 'grayscale(65%) brightness(0.97)';
          ctx.drawImage(img, 0, 0, 256, 256);
          const tex = new THREE.CanvasTexture(canvas);
          tex.colorSpace = THREE.SRGBColorSpace;
          owned = tex;
          setTexture(tex);
        } catch {
          // fallback dacă Cloudinary nu trimite headerele CORS necesare citirii de pixeli
          const tex = new THREE.TextureLoader().load(imageUrl);
          tex.colorSpace = THREE.SRGBColorSpace;
          owned = tex;
          setTexture(tex);
        }
      };
      img.onerror = () => { if (!cancelled) setTexture(makeInitialsTexture()); };
      img.src = imageUrl;
    }

    return () => {
      cancelled = true;
      owned?.dispose();
    };
  }, [member.imageUrl, member.firstName, member.lastName, deceased]);

  return texture;
}

const MemberCard3D: React.FC<Props> = ({ member, position, onOpen }) => {
  const deceased = isDeceased(member.deathDate);
  const age = calculateAge(member.birthDate, member.deathDate);
  const texture = usePortraitTexture(member, deceased);

  const rimColor = useMemo(() => getRimColor(member.gender, deceased), [member.gender, deceased]);
  const backColor = deceased ? '#c7c0d2' : '#caa46a';

  const medallionGeometry = useMemo(
    () => new THREE.CylinderGeometry(MEDALLION_RADIUS, MEDALLION_RADIUS, MEDALLION_DEPTH, 48),
    [],
  );
  const loopGeometry = useMemo(() => new THREE.TorusGeometry(0.11, 0.028, 8, 20), []);

  useEffect(() => () => {
    medallionGeometry.dispose();
    loopGeometry.dispose();
  }, [medallionGeometry, loopGeometry]);

  const groupRef = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);
  const targetScale = useRef(1);
  targetScale.current = hovered ? 1.1 : 1;

  useFrame(() => {
    if (!groupRef.current) return;
    const current = groupRef.current.scale.x;
    const next = current + (targetScale.current - current) * 0.18;
    groupRef.current.scale.setScalar(next);
  });

  useEffect(() => () => { document.body.style.cursor = 'auto'; }, []);

  return (
    <group
      ref={groupRef}
      position={position}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHovered(true);
        document.body.style.cursor = 'pointer';
      }}
      onPointerOut={(e) => {
        e.stopPropagation();
        setHovered(false);
        document.body.style.cursor = 'auto';
      }}
      onClick={(e) => {
        e.stopPropagation();
        onOpen();
      }}
    >
      {/* Medalionul — monedă/pandantiv 3D real. Fața cu poza privește spre +Z
          (spre camera implicită); verso-ul e o culoare "de medalie", nu o oglindă stricată. */}
      <mesh geometry={medallionGeometry} rotation={[Math.PI / 2, 0, 0]} castShadow receiveShadow>
        <meshStandardMaterial
          attach="material-0"
          color={rimColor}
          metalness={RIM_METALNESS}
          roughness={RIM_ROUGHNESS}
          emissive={hovered ? rimColor : '#000000'}
          emissiveIntensity={hovered ? 0.15 : 0}
        />
        <meshStandardMaterial attach="material-1" map={texture ?? undefined} roughness={0.55} metalness={0.05} />
        <meshStandardMaterial attach="material-2" color={backColor} metalness={0.3} roughness={0.45} />
      </mesh>

      {/* Bucla de agățare — accentuează forma de pandantiv; se citește ca obiect 3D
          din orice unghi, spre deosebire de un card plat. */}
      <mesh geometry={loopGeometry} position={[0, MEDALLION_RADIUS - 0.02, 0]}>
        <meshStandardMaterial color={rimColor} metalness={0.5} roughness={0.3} />
      </mesh>

      {/* Eticheta cu numele — billboard (se rotește mereu spre cameră), ca un
          nameplate dintr-un joc 3D. Obiectul principal rămâne medalionul de mai sus. */}
      <Billboard position={[0, -(MEDALLION_RADIUS + 0.28), 0]}>
        <Text
          fontSize={0.16}
          color={deceased ? '#8a8272' : '#3d2e1c'}
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.008}
          outlineColor="#ffffff"
          maxWidth={2}
        >
          {member.firstName} {member.lastName}
        </Text>
        {(age !== null || deceased) && (
          <Text
            position={[0, -0.19, 0]}
            fontSize={0.115}
            color="#8a7e6c"
            anchorX="center"
            anchorY="middle"
            outlineWidth={0.006}
            outlineColor="#ffffff"
          >
            {age !== null ? `${age} ani` : ''}
            {deceased ? ' ✝' : ''}
          </Text>
        )}
      </Billboard>
    </group>
  );
};

export default MemberCard3D;