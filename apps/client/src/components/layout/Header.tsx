import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import TableRowsIcon from '@mui/icons-material/TableRows';
import GroupsIcon from '@mui/icons-material/Groups';
import type { FamilyTreeData } from '../../types/family';
import MembersAccordionMenu from './MembersAccordionMenu';

interface Props {
  treeData?: FamilyTreeData;
}

const Header: React.FC<Props> = ({ treeData }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [membersMenuOpen, setMembersMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const membersMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
      if (membersMenuRef.current && !membersMenuRef.current.contains(e.target as Node)) {
        setMembersMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const initials = user ? `${user.firstName[0]}${user.lastName[0]}` : '';
  const memberCount = treeData?.members.length ?? 0;

  const handleNavigateToMember = (id: string) => {
    setMembersMenuOpen(false);
    navigate(`/members/${id}`);
  };

  // NOU — "Arbore" e considerat activ inclusiv pe pagina de detaliu a unui
  // membru (/members/:id), pentru că acolo tot din arbore ai venit conceptual.
  const isTreeActive = location.pathname === '/dashboard' || /^\/members\/.+/.test(location.pathname);
  const isTableActive = location.pathname === '/members';

  const navButtonClass = (active: boolean) =>
    `flex items-center gap-1.5 text-sm font-semibold px-2.5 sm:px-3.5 py-2 rounded-lg transition-colors cursor-pointer flex-shrink-0 ${active
      ? 'bg-earbore-100 text-earbore-700'
      : 'text-earbore-gray hover:text-earbore-700 hover:bg-earbore-50'
    }`;

  return (
    <header className="w-full border-b border-earbore-border bg-white/90 backdrop-blur-sm z-20">
      <div className="px-3 sm:px-6 py-2.5 sm:py-3 flex items-center justify-between gap-2">
        <button onClick={() => navigate('/dashboard')} className="flex items-center gap-2 cursor-pointer flex-shrink-0">
          <span className="text-lg sm:text-xl font-extrabold text-earbore-700">eArbore</span>
        </button>

        {/* NOU — Arbore / Tabel membri mutate lângă dropdown-ul de membri,
            în partea dreaptă. Pe mobil rămân doar iconițe, ca să nu aglomereze
            bara — dar sunt mereu vizibile, în același loc, indiferent de pagină. */}
        <div className="flex items-center gap-1 sm:gap-2 min-w-0">
          <button onClick={() => navigate('/dashboard')} className={navButtonClass(isTreeActive)}>
            <AccountTreeIcon fontSize="small" />
            <span className="hidden sm:inline">Arbore</span>
          </button>
          <button onClick={() => navigate('/members')} className={navButtonClass(isTableActive)}>
            <TableRowsIcon fontSize="small" />
            <span className="hidden sm:inline">Tabel membri</span>
          </button>

          {/* Dropdown membri — arbore genealogic tip acordeon */}
          <div className="relative flex-shrink-0" ref={membersMenuRef}>
            <button
              onClick={() => setMembersMenuOpen((v) => !v)}
              className="flex items-center gap-1.5 text-sm font-medium text-earbore-gray hover:text-earbore-700 px-2.5 sm:px-3 py-2 rounded-lg hover:bg-earbore-50 transition-colors cursor-pointer"
            >
              <GroupsIcon fontSize="small" className="sm:hidden" />
              <span className="hidden sm:inline">Membri ({memberCount})</span>
              <span className="sm:hidden text-xs font-semibold">{memberCount}</span>
              <span className={`hidden sm:inline transition-transform ${membersMenuOpen ? 'rotate-180' : ''}`}>▾</span>
            </button>

            {membersMenuOpen && (
              <div className="absolute right-0 mt-2 w-72 sm:w-80 max-w-[85vw] bg-white rounded-xl shadow-lg border border-earbore-border py-2 max-h-96 overflow-y-auto">
                <MembersAccordionMenu treeData={treeData} onNavigate={handleNavigateToMember} />
              </div>
            )}
          </div>

          {/* Dropdown user */}
          <div className="relative flex-shrink-0" ref={userMenuRef}>
            <button
              onClick={() => setUserMenuOpen((v) => !v)}
              className="w-9 h-9 rounded-full bg-earbore-600 text-white flex items-center justify-center text-sm font-bold cursor-pointer hover:bg-earbore-700 transition-colors flex-shrink-0"
            >
              {initials}
            </button>

            {userMenuOpen && (
              <div className="absolute right-0 mt-2 w-56 max-w-[85vw] bg-white rounded-xl shadow-lg border border-earbore-border py-2">
                <div className="px-4 py-2 border-b border-earbore-border mb-1">
                  <p className="text-sm font-semibold text-earbore-ink truncate">{user?.firstName} {user?.lastName}</p>
                  <p className="text-xs text-earbore-gray truncate">{user?.email}</p>
                </div>
                <button
                  onClick={() => {
                    setUserMenuOpen(false);
                    navigate('/profile');
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-earbore-ink hover:bg-earbore-50 transition-colors cursor-pointer"
                >
                  Profilul meu
                </button>
                <button
                  onClick={() => logout()}
                  className="w-full text-left px-4 py-2 text-sm text-earbore-danger hover:bg-red-50 transition-colors cursor-pointer"
                >
                  Deconectare
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;