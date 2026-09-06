import React, { useMemo, useState } from 'react';
import type { FamilyTreeData } from '../../types/family';
import { buildMemberHierarchy, type HierarchyUnitNode } from '../../lib/memberHierarchy';

const MAX_DEPTH = 25; // protecție minimă în caz de date ciclice

interface HierarchyItemProps {
  node: HierarchyUnitNode;
  depth: number;
  onNavigate: (id: string) => void;
}

const HierarchyItem: React.FC<HierarchyItemProps> = ({ node, depth, onNavigate }) => {
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
            aria-label={expanded ? 'Restrânge' : 'Extinde'}
          >
            <span className={`inline-block transition-transform text-[10px] ${expanded ? 'rotate-90' : ''}`}>▶</span>
          </button>
        ) : (
          <span className="w-5 h-5 flex-shrink-0" />
        )}

        <div className="flex items-center gap-1 min-w-0 flex-wrap">
          {node.members.map((m, i) => (
            <React.Fragment key={m.id}>
              {i > 0 && <span className="text-earbore-300 text-xs px-0.5">&amp;</span>}
              <button
                onClick={() => onNavigate(m.id)}
                className="flex items-center gap-1.5 text-sm text-earbore-ink hover:text-earbore-700 cursor-pointer"
                title={`${m.firstName} ${m.lastName}`}
              >
                <span className="w-5 h-5 rounded-full bg-earbore-100 text-earbore-700 flex items-center justify-center text-[10px] font-bold flex-shrink-0">
                  {m.firstName[0]}{m.lastName[0]}
                </span>
                <span className="truncate max-w-[140px]">{m.firstName} {m.lastName}</span>
              </button>
            </React.Fragment>
          ))}
        </div>
      </div>

      {hasChildren && expanded && (
        <div>
          {node.children.map((child) => (
            <HierarchyItem key={child.unitId} node={child} depth={depth + 1} onNavigate={onNavigate} />
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
  const roots = useMemo(() => buildMemberHierarchy(treeData), [treeData]);

  if (roots.length === 0) {
    return <p className="px-4 py-3 text-sm text-earbore-gray">Niciun membru încă.</p>;
  }

  return (
    <div className="py-1">
      {roots.map((root) => (
        <HierarchyItem key={root.unitId} node={root} depth={0} onNavigate={onNavigate} />
      ))}
    </div>
  );
};

export default MembersAccordionMenu;