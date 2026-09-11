import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { FamilyTreeData } from '../../types/family';
import { buildMemberHierarchy, type HierarchyUnitNode } from '../../lib/memberHierarchy';

const MAX_DEPTH = 25;

interface HierarchyItemProps {
  node: HierarchyUnitNode;
  depth: number;
  onNavigate: (id: string) => void;
  selfMemberId?: string | null;
  collapseLabel: string;
  expandLabel: string;
  t: (key: string) => string;
}

const HierarchyItem: React.FC<HierarchyItemProps> = ({ node, depth, onNavigate, selfMemberId, collapseLabel, expandLabel, t }) => {
  const [expanded, setExpanded] = useState(depth === 0);
  const hasChildren = node.children.length > 0;

  if (depth > MAX_DEPTH) return null;

  return (
    <div>
      <div
        className="flex items-center gap-1 py-1.5 pr-3 hover:bg-earbore-50 rounded-lg transition-colors"
        style={{ paddingLeft: 12 + depth * 18 }}
      >
        {hasChildren ? (
          <button
            onClick={() => setExpanded((v) => !v)}
            className="w-5 h-5 flex items-center justify-center text-earbore-gray hover:text-earbore-700 cursor-pointer flex-shrink-0"
            aria-label={expanded ? collapseLabel : expandLabel}
          >
            <span className={`inline-block transition-transform text-[10px] ${expanded ? 'rotate-90' : ''}`}>▶</span>
          </button>
        ) : (
          <span className="w-5 h-5 flex-shrink-0" />
        )}

        <div className="flex items-center gap-1 min-w-0 flex-wrap">
          {node.members.map((m, i) => {
            const isSelf = !!selfMemberId && selfMemberId === m.id;
            return (
              <React.Fragment key={m.id}>
                {i > 0 && <span className="text-earbore-300 text-xs px-0.5">&amp;</span>}
                <button
                  onClick={() => onNavigate(m.id)}
                  className="flex items-center gap-1.5 text-sm text-earbore-ink hover:text-earbore-700 cursor-pointer"
                  title={`${m.firstName} ${m.lastName}`}
                >
                  <span
                    className={`w-5 h-5 rounded-full overflow-hidden flex items-center justify-center text-[10px] font-bold flex-shrink-0 ${isSelf ? 'ring-2 ring-earbore-500' : ''
                      } ${m.imageUrl ? '' : 'bg-earbore-100 text-earbore-700'}`}
                  >
                    {m.imageUrl ? (
                      <img
                        src={m.imageUrl}
                        alt={`${m.firstName} ${m.lastName}`}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span>{m.firstName[0]}{m.lastName[0]}</span>
                    )}
                  </span>
                  <span className="truncate max-w-[140px]">
                    {m.firstName} {m.lastName}
                    {isSelf && <span className="ml-1 text-[10px] text-earbore-500 font-semibold">({t('dashboard.youBadge')})</span>}
                  </span>
                </button>
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {hasChildren && expanded && (
        <div>
          {node.children.map((child) => (
            <HierarchyItem
              key={child.unitId}
              node={child}
              depth={depth + 1}
              onNavigate={onNavigate}
              selfMemberId={selfMemberId}
              collapseLabel={collapseLabel}
              expandLabel={expandLabel}
              t={t}
            />
          ))}
        </div>
      )}
    </div>
  );
};

interface Props {
  treeData?: FamilyTreeData;
  onNavigate: (id: string) => void;
}

const MembersAccordionMenu: React.FC<Props> = ({ treeData, onNavigate }) => {
  const { t } = useTranslation();
  const roots = useMemo(() => buildMemberHierarchy(treeData), [treeData]);

  if (roots.length === 0) {
    return <p className="px-4 py-3 text-sm text-earbore-gray">{t('membersMenu.noMembers')}</p>;
  }

  return (
    <div className="py-1">
      {roots.map((root) => (
        <HierarchyItem
          key={root.unitId}
          node={root}
          depth={0}
          onNavigate={onNavigate}
          selfMemberId={treeData?.selfMemberId}
          collapseLabel={t('membersMenu.collapse')}
          expandLabel={t('membersMenu.expand')}
          t={t}
        />
      ))}
    </div>
  );
};

export default MembersAccordionMenu;