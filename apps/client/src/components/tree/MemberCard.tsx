import React, { useRef, useState } from 'react';
import { Card, Typography, Chip, Box } from '@mui/material';
import type { FamilyMember } from '../../types/family';
import { calculateAge, isDeceased } from '../../utils/age';
import { LAYOUT } from '../../lib/treeLayout';

interface Props {
  member: FamilyMember;
  x: number;
  y: number;
  unitId: string;
  onClick: (id: string) => void;
  onDragStart?: (unitId: string, clientX: number, clientY: number) => void;
  onDragMove?: (clientX: number, clientY: number) => void;
  onDragEnd?: () => void;
  isDragging?: boolean;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
  style?: React.CSSProperties;
}

function MemberCard({
  member, x, y, unitId, onClick, onDragStart, onDragMove, onDragEnd, isDragging, onMouseEnter, onMouseLeave, style,
}: Props) {
  const deceased = isDeceased(member.deathDate);
  const age = calculateAge(member.birthDate, member.deathDate);

  const movedRef = useRef(false);
  const pointerDownPos = useRef({ x: 0, y: 0 });
  const [imageExpanded, setImageExpanded] = useState(false);

  const handlePointerDown = (e: React.PointerEvent) => {
    e.stopPropagation();
    movedRef.current = false;
    pointerDownPos.current = { x: e.clientX, y: e.clientY };
    e.currentTarget.setPointerCapture(e.pointerId);
    onDragStart?.(unitId, e.clientX, e.clientY);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!onDragMove) return;
    // prag de 4px — altfel orice tremur minim al mâinii în timpul unui click simplu
    // era interpretat ca "drag" și click-ul pe card nu mai naviga nicăieri
    const dx = e.clientX - pointerDownPos.current.x;
    const dy = e.clientY - pointerDownPos.current.y;
    if (Math.hypot(dx, dy) > 4) {
      movedRef.current = true;
    }
    onDragMove(e.clientX, e.clientY);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    try { e.currentTarget.releasePointerCapture(e.pointerId); } catch { /* deja eliberat */ }
    if (movedRef.current) {
      onDragEnd?.();
    } else {
      onClick(member.id);
    }
  };

  // click pe poză: se oprește propagarea către card (nu declanșează drag/navigare),
  // și doar comută zoom-ul in-place al pozei
  const handlePhotoPointerDown = (e: React.PointerEvent) => e.stopPropagation();
  const handlePhotoPointerUp = (e: React.PointerEvent) => e.stopPropagation();
  const handlePhotoClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (member.imageUrl) setImageExpanded((prev) => !prev);
  };

  // la ieșirea cursorului de pe card, resetăm și highlight-ul de rudenie (primit din
  // FamilyTreeCanvas) și poza mărită, ca să nu rămână "agățată" deschisă
  const handleCardMouseLeave = () => {
    setImageExpanded(false);
    onMouseLeave?.();
  };

  const initials = `${member.firstName[0] ?? ''}${member.lastName[0] ?? ''}`;

  return (
    <Card
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onMouseEnter={onMouseEnter}
      onMouseLeave={handleCardMouseLeave}
      elevation={isDragging ? 6 : 0}
      sx={{
        position: 'absolute',
        left: x,
        top: y,
        width: LAYOUT.CARD_WIDTH,
        height: LAYOUT.CARD_HEIGHT,
        touchAction: 'none',
        zIndex: isDragging ? 50 : imageExpanded ? 70 : undefined,
        cursor: 'grab',
        borderWidth: 2,
        borderStyle: 'solid',
        borderColor: deceased ? 'divider' : 'primary.light',
        filter: deceased ? 'grayscale(40%)' : undefined,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'visible', // clipping-ul e gestionat separat, de fiecare zonă (poză / text)
        transition: 'box-shadow 0.2s, opacity 0.2s',
        '&:hover': { boxShadow: isDragging ? undefined : 2 },
        ...style,
      }}
    >
      {/* Poza — 60% din înălțimea cardului, lipită de marginile de sus/stânga/dreapta, ca un header */}
      <Box
        onPointerDown={handlePhotoPointerDown}
        onPointerUp={handlePhotoPointerUp}
        onClick={handlePhotoClick}
        sx={{
          position: 'relative',
          width: '100%',
          height: '60%',
          flexShrink: 0,
          zIndex: 2,
          borderTopLeftRadius: 'inherit',
          borderTopRightRadius: 'inherit',
          overflow: imageExpanded ? 'visible' : 'hidden',
          cursor: member.imageUrl ? (imageExpanded ? 'zoom-out' : 'zoom-in') : 'default',
        }}
      >
        {member.imageUrl ? (
          <Box
            component="img"
            src={member.imageUrl}
            alt={`${member.firstName} ${member.lastName}`}
            sx={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              borderTopLeftRadius: 'inherit',
              borderTopRightRadius: 'inherit',
              borderBottomLeftRadius: imageExpanded ? '12px' : 0,
              borderBottomRightRadius: imageExpanded ? '12px' : 0,
              transform: imageExpanded ? 'scale(1.7)' : 'scale(1)',
              transformOrigin: 'center top',
              transition: 'transform 0.25s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.25s ease, border-radius 0.25s ease',
              boxShadow: imageExpanded ? '0 16px 32px rgba(20, 10, 40, 0.35)' : 'none',
            }}
          />
        ) : (
          <Box
            sx={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderTopLeftRadius: 'inherit',
              borderTopRightRadius: 'inherit',
              bgcolor: deceased ? 'grey.100' : 'primary.light',
              color: deceased ? 'text.secondary' : 'primary.dark',
              fontSize: 26,
              fontWeight: 700,
            }}
          >
            {initials}
          </Box>
        )}
      </Box>

      {/* Text — restul de 40%: nume, nume anterior, vârstă, status decedat */}
      <Box
        sx={{
          position: 'relative',
          zIndex: 1,
          flex: 1,
          minHeight: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          gap: 0.25,
          px: 1,
          py: 0.5,
        }}
      >
        <Typography
          variant="body2"
          sx={{
            fontWeight: 600,
            lineHeight: 1.2,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {member.firstName} {member.lastName}
        </Typography>
        {member.maidenName && (
          <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic', lineHeight: 1.1 }}>
            n. {member.maidenName}
          </Typography>
        )}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mt: 0.25 }}>
          {age !== null && <Typography variant="caption" color="text.secondary">{age} ani</Typography>}
          {deceased && <Chip label="✝ decedat" size="small" variant="outlined" sx={{ height: 20, fontSize: 11 }} />}
        </Box>
      </Box>
    </Card>
  );
}

export default React.memo(MemberCard);