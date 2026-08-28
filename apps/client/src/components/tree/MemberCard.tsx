import React, { useRef } from 'react';
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

function MemberCard({ member, x, y, unitId, onClick, onDragStart, onDragMove, onDragEnd, isDragging, onMouseEnter, onMouseLeave, style }: Props) {
  const deceased = isDeceased(member.deathDate);
  const age = calculateAge(member.birthDate, member.deathDate);
  const movedRef = useRef(false);

  const handlePointerDown = (e: React.PointerEvent) => {
    e.stopPropagation();
    movedRef.current = false;
    e.currentTarget.setPointerCapture(e.pointerId);
    onDragStart?.(unitId, e.clientX, e.clientY);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!onDragMove) return;
    movedRef.current = true;
    onDragMove(e.clientX, e.clientY);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      // era deja eliberat — ignorăm
    }
    if (movedRef.current) {
      onDragEnd?.();
    } else {
      onClick(member.id);
    }
  };

  return (
    <div
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      style={{
        position: 'absolute',
        left: x,
        top: y,
        width: LAYOUT.CARD_WIDTH,
        height: LAYOUT.CARD_HEIGHT,
        touchAction: 'none',
        zIndex: isDragging ? 50 : undefined,
        cursor: 'grab',
        ...style,
      }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className={`rounded-2xl border-2 bg-white shadow-sm transition-shadow ${isDragging ? 'shadow-lg' : 'hover:shadow-md'
        } ${deceased ? 'border-earbore-border grayscale-[40%]' : 'border-earbore-300'}`}
    >
      <div className="p-3 flex flex-col items-center text-center h-full justify-center">
        <div
          className={`w-14 h-14 rounded-full overflow-hidden border-2 mb-2 flex items-center justify-center text-base font-bold ${deceased
            ? 'border-earbore-border bg-earbore-grayLight text-earbore-gray'
            : 'border-earbore-400 bg-earbore-100 text-earbore-700'
            }`}
        >
          {member.imageUrl ? (
            <img src={member.imageUrl} alt={member.firstName} className="w-full h-full object-cover" />
          ) : (
            <span>{member.firstName[0]}{member.lastName[0]}</span>
          )}
        </div>

        <p className="font-semibold text-sm text-earbore-ink leading-tight">
          {member.firstName} {member.lastName}
        </p>
        {member.maidenName && <p className="text-xs text-earbore-gray italic">n. {member.maidenName}</p>}

        <div className="flex items-center gap-1.5 mt-1">
          {age !== null && <span className="text-xs text-earbore-gray">{age} ani</span>}
          {deceased && (
            <span className="text-xs bg-earbore-ink/5 text-earbore-gray px-1.5 py-0.5 rounded-full border border-earbore-border">
              ✝ decedat
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export default React.memo(MemberCard);