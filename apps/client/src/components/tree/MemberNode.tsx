import React from 'react';
import { useTranslation } from 'react-i18next';
import { Handle, Position } from '@xyflow/react';
import { useNavigate } from 'react-router-dom';
import type { FamilyMember } from '../../types/family';
import { calculateAge, isDeceased } from '../../utils/age';

interface MemberNodeData {
  member: FamilyMember;
}

const MemberNode: React.FC<{ data: MemberNodeData }> = ({ data }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { member } = data;
  const deceased = isDeceased(member.deathDate);
  const age = calculateAge(member.birthDate, member.deathDate);

  return (
    <div
      onClick={() => navigate(`/members/${member.id}`)}
      className={`w-48 rounded-2xl border-2 bg-white shadow-sm cursor-pointer transition-all hover:shadow-md hover:-translate-y-0.5 ${deceased ? 'border-earbore-border grayscale-[40%]' : 'border-earbore-300'
        }`}
    >
      <Handle type="source" position={Position.Top} id="top-source" className="!bg-earbore-500" />
      <Handle type="target" position={Position.Bottom} id="bottom-target" className="!bg-earbore-500" />
      <Handle type="source" position={Position.Left} id="left-source" className="!bg-earbore-300" />
      <Handle type="target" position={Position.Left} id="left-target" className="!bg-earbore-300" />
      <Handle type="source" position={Position.Right} id="right-source" className="!bg-earbore-300" />
      <Handle type="target" position={Position.Right} id="right-target" className="!bg-earbore-300" />

      <div className="p-3 flex flex-col items-center text-center">
        <div
          className={`w-16 h-16 rounded-full overflow-hidden border-2 mb-2 flex items-center justify-center text-lg font-bold ${deceased ? 'border-earbore-border bg-earbore-grayLight text-earbore-gray' : 'border-earbore-400 bg-earbore-100 text-earbore-700'
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
        {member.maidenName && (
          <p className="text-xs text-earbore-gray italic">n. {member.maidenName}</p>
        )}

        <div className="flex items-center gap-1.5 mt-1">
          {age !== null && (
            <span className="text-xs text-earbore-gray">{age} {t('common.years')}</span>
          )}
          {deceased && (
            <span className="text-xs bg-earbore-ink/5 text-earbore-gray px-1.5 py-0.5 rounded-full border border-earbore-border">
              {t('dashboard.deceasedChip')}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default MemberNode;