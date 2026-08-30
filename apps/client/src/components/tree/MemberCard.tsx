import React, { useRef, useState } from 'react';
import { Card, Typography, Chip, Box, IconButton, Tooltip } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import OpenWithIcon from '@mui/icons-material/OpenWith';
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
  onAddTop?: (memberId: string) => void;
  onAddBottom?: (memberId: string) => void;
  topLabel?: string;
  bottomLabel?: string;
}

// NOU — culoarea borderului în funcție de gen: roșu pt. femei, albastru pt. bărbați,
// mov neutru (culoarea implicită de brand) pt. gen nespecificat/altul
function getBorderColor(gender?: string | null): string {
  if (gender === 'FEMALE') return 'var(--color-earbore-danger)';
  if (gender === 'MALE') return 'var(--color-earbore-info)';
  return 'var(--color-earbore-400)';
}

function MemberCard({
  member, x, y, unitId, onClick, onDragStart, onDragMove, onDragEnd, isDragging, onMouseEnter, onMouseLeave, style,
  onAddTop, onAddBottom, topLabel = 'Adaugă', bottomLabel = 'Adaugă',
}: Props) {
  const deceased = isDeceased(member.deathDate);
  const age = calculateAge(member.birthDate, member.deathDate);

  const movedRef = useRef(false);
  const pointerDownPos = useRef({ x: 0, y: 0 });
  const [imageExpanded, setImageExpanded] = useState(false);
  const [hovered, setHovered] = useState(false);

  // ── click pe card (navigare către profil) ──
  // Nu mai pornim drag de aici — drag-ul se face STRICT din butonul "Mută" de mai jos.
  // Poza, butoanele +, și handle-ul de mutare își opresc singure propagarea click-ului,
  // așa că acest onClick prinde doar restul cardului.
  const handleCardClick = () => {
    if (!movedRef.current) onClick(member.id);
    movedRef.current = false;
  };

  const handleCardPointerDown = (e: React.PointerEvent) => {
    e.stopPropagation();
  };

  // ── handle-ul de mutare — AICI pornește efectiv drag-ul ──
  const handleMovePointerDown = (e: React.PointerEvent) => {
    e.stopPropagation();
    e.preventDefault();
    movedRef.current = false;
    pointerDownPos.current = { x: e.clientX, y: e.clientY };
    e.currentTarget.setPointerCapture(e.pointerId);
    onDragStart?.(unitId, e.clientX, e.clientY);
  };

  const handleMovePointerMove = (e: React.PointerEvent) => {
    if (!onDragMove) return;
    const dx = e.clientX - pointerDownPos.current.x;
    const dy = e.clientY - pointerDownPos.current.y;
    if (Math.hypot(dx, dy) > 4) movedRef.current = true;
    onDragMove(e.clientX, e.clientY);
  };

  const handleMovePointerUp = (e: React.PointerEvent) => {
    e.stopPropagation();
    try { e.currentTarget.releasePointerCapture(e.pointerId); } catch { /* deja eliberat */ }
    onDragEnd?.();
  };

  const handlePhotoPointerDown = (e: React.PointerEvent) => e.stopPropagation();
  const handlePhotoPointerUp = (e: React.PointerEvent) => e.stopPropagation();
  const handlePhotoClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (member.imageUrl) setImageExpanded((prev) => !prev);
  };

  // NOU — la ieșirea cursorului de pe card NU mai închidem poza expandată.
  // Poza rămâne mărită până dai click din nou pe ea (toggle).
  const handleCardMouseLeave = () => {
    setHovered(false);
    onMouseLeave?.();
  };

  const handleCardMouseEnter = () => {
    setHovered(true);
    onMouseEnter?.();
  };

  // butoanele + nu trebuie să declanșeze click-ul cardului
  const stopAndRun = (fn?: (id: string) => void) => (e: React.PointerEvent | React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    fn?.(member.id);
  };

  const initials = `${member.firstName[0] ?? ''}${member.lastName[0] ?? ''}`;
  const borderColor = deceased ? 'divider' : getBorderColor(member.gender);

  return (
    <Card
      onClick={handleCardClick}
      onPointerDown={handleCardPointerDown}
      onMouseEnter={handleCardMouseEnter}
      onMouseLeave={handleCardMouseLeave}
      elevation={isDragging ? 6 : 0}
      sx={{
        position: 'absolute',
        left: x,
        top: y,
        width: LAYOUT.CARD_WIDTH,
        height: LAYOUT.CARD_HEIGHT,
        touchAction: 'none',
        zIndex: isDragging ? 50 : imageExpanded ? 70 : hovered ? 40 : undefined,
        cursor: 'pointer', // NOU — implicit pointer pe tot cardul (nu grab); grab e doar pe handle
        borderWidth: 3, // era 2 — border puțin mai gros
        borderStyle: 'solid',
        borderColor,
        filter: deceased ? 'grayscale(40%)' : undefined,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'visible',
        transition: 'box-shadow 0.2s, opacity 0.2s, border-color 0.2s',
        '&:hover': { boxShadow: isDragging ? undefined : 2 },
        ...style,
      }}
    >
      {/* Buton sus — adaugă părinte/copil, apare la hover */}
      {onAddTop && (
        <Tooltip title={topLabel} placement="top">
          <IconButton
            size="small"
            onPointerDown={stopAndRun()}
            onClick={stopAndRun(onAddTop)}
            sx={{
              position: 'absolute',
              top: -14,
              left: '50%',
              transform: 'translateX(-50%)',
              width: 26,
              height: 26,
              zIndex: 60,
              bgcolor: 'primary.main',
              color: 'white',
              opacity: hovered ? 1 : 0,
              transition: 'opacity 0.15s',
              boxShadow: 2,
              cursor: 'pointer',
              '&:hover': { bgcolor: 'primary.dark' },
            }}
          >
            <AddIcon sx={{ fontSize: 16 }} />
          </IconButton>
        </Tooltip>
      )}

      {/* NOU — handle dedicat de mutare. Doar de-aici pornește drag-ul cardului. */}
      <Tooltip title="Mută cardul" placement="left">
        <IconButton
          size="small"
          onPointerDown={handleMovePointerDown}
          onPointerMove={handleMovePointerMove}
          onPointerUp={handleMovePointerUp}
          onPointerCancel={handleMovePointerUp}
          onClick={(e) => e.stopPropagation()}
          sx={{
            position: 'absolute',
            top: -14,
            right: -14,
            width: 26,
            height: 26,
            zIndex: 61,
            bgcolor: 'white',
            color: 'earbore.gray',
            border: '1px solid',
            borderColor: 'divider',
            opacity: hovered || isDragging ? 1 : 0,
            transition: 'opacity 0.15s',
            boxShadow: 2,
            touchAction: 'none',
            cursor: isDragging ? 'grabbing' : 'grab',
            '&:hover': { bgcolor: 'earbore.50', color: 'primary.main' },
          }}
        >
          <OpenWithIcon sx={{ fontSize: 15 }} />
        </IconButton>
      </Tooltip>

      {/* Poza */}
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
              transform: imageExpanded ? 'scale(2.3)' : 'scale(1)', // era 1.7 — acum mai mare
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

      {/* Text */}
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

      {/* Buton jos — adaugă părinte/copil, apare la hover */}
      {onAddBottom && (
        <Tooltip title={bottomLabel} placement="bottom">
          <IconButton
            size="small"
            onPointerDown={stopAndRun()}
            onClick={stopAndRun(onAddBottom)}
            sx={{
              position: 'absolute',
              bottom: -14,
              left: '50%',
              transform: 'translateX(-50%)',
              width: 26,
              height: 26,
              zIndex: 60,
              bgcolor: 'primary.main',
              color: 'white',
              opacity: hovered ? 1 : 0,
              transition: 'opacity 0.15s',
              boxShadow: 2,
              cursor: 'pointer',
              '&:hover': { bgcolor: 'primary.dark' },
            }}
          >
            <AddIcon sx={{ fontSize: 16 }} />
          </IconButton>
        </Tooltip>
      )}
    </Card>
  );
}

export default React.memo(MemberCard);