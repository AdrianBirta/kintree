import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useTreeQuery } from '../../hooks/queries/useFamilyQueries';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import TableRowsIcon from '@mui/icons-material/TableRows';
import GroupsIcon from '@mui/icons-material/Groups';
import CloseIcon from '@mui/icons-material/Close';
import { IconButton, useMediaQuery, useTheme } from '@mui/material';
import MembersAccordionMenu from './MembersAccordionMenu';

const Header: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // NOU — arborele nu mai vine ca prop de la pagina părinte, ci direct din
  // cache-ul React Query. Cum toate paginile cer aceeași cheie de query,
  // Header-ul primește instant aceleași date, fără niciun request în plus.
  const { data: treeData } = useTreeQuery();

  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [membersMenuOpen, setMembersMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const membersMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
      if (!isMobile && membersMenuRef.current && !membersMenuRef.current.contains(e.target as Node)) {
        setMembersMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isMobile]);

  useEffect(() => {
    if (isMobile && membersMenuOpen) {
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = ''; };
    }
  }, [isMobile, membersMenuOpen]);

  const initials = user ? `${user.firstName?.[0] ?? ''}${user.lastName?.[0] ?? ''}`.toUpperCase() : '';
  const memberCount = treeData?.members.length ?? 0;

  const handleNavigateToMember = (id: string) => {
    setMembersMenuOpen(false);
    navigate(`/members/${id}`);
  };

  const isTreeActive = location.pathname === '/dashboard' || /^\/members\/.+/.test(location.pathname);
  const isTableActive = location.pathname === '/members';

  const navButtonClass = (active: boolean) =>
    `flex items-center gap-1.5 text-sm font-semibold px-2.5 sm:px-3.5 py-2 rounded-lg transition-colors cursor-pointer flex-shrink-0 ${active
      ? 'bg-earbore-100 text-earbore-700'
      : 'text-earbore-gray hover:text-earbore-700 hover:bg-earbore-50'
    }`;

  return (
    <header className="w-full border-b border-earbore-border bg-white/90 backdrop-blur-sm sticky top-0 z-30">
      <div className="px-3 sm:px-6 py-2.5 sm:py-3 flex items-center justify-between gap-2">
        <button onClick={() => navigate('/dashboard')} className="flex items-center gap-2 cursor-pointer flex-shrink-0">
          <span className="text-lg sm:text-xl font-extrabold text-earbore-700">eArbore</span>
        </button>

        <div className="flex items-center gap-1 sm:gap-2 min-w-0">
          <button onClick={() => navigate('/dashboard')} className={navButtonClass(isTreeActive)}>
            <AccountTreeIcon fontSize="small" />
            <span className="hidden sm:inline">Arbore</span>
          </button>
          <button onClick={() => navigate('/members')} className={navButtonClass(isTableActive)}>
            <TableRowsIcon fontSize="small" />
            <span className="hidden sm:inline">Tabel membri</span>
          </button>

          {/* Dropdown / overlay membri */}
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

            {/* Dropdown normal — DOAR pe desktop, rămâne copil al header-ului */}
            {membersMenuOpen && !isMobile && (
              <div className="absolute right-0 mt-2 w-72 sm:w-80 max-w-[85vw] bg-white rounded-xl shadow-lg border border-earbore-border py-2 max-h-96 overflow-y-auto">
                <MembersAccordionMenu treeData={treeData} onNavigate={handleNavigateToMember} />
              </div>
            )}
          </div>

          {/* Dropdown user — neschimbat */}
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
                  onClick={() => { setUserMenuOpen(false); navigate('/profile'); }}
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

      {/* NOU — overlay full-screen pe mobil, randat printr-un PORTAL direct în
          document.body. E OBLIGATORIU să fie portal aici: header-ul are
          `backdrop-blur-sm` (backdrop-filter), iar backdrop-filter creează un
          "containing block" nou pentru orice descendent `position: fixed`.
          Fără portal, `fixed inset-0` s-ar raporta la cutia header-ului
          (înaltă doar cât bara de sus), nu la tot ecranul. */}
      {membersMenuOpen && isMobile && createPortal(
        <div className="fixed inset-0 z-50 bg-white flex flex-col">
          <div className="flex items-center justify-between px-4 py-3 border-b border-earbore-border flex-shrink-0">
            <h2 className="text-base font-bold text-earbore-ink">Membri ({memberCount})</h2>
            <IconButton onClick={() => setMembersMenuOpen(false)} size="small">
              <CloseIcon />
            </IconButton>
          </div>
          <div className="flex-1 overflow-y-auto py-2">
            <MembersAccordionMenu treeData={treeData} onNavigate={handleNavigateToMember} />
          </div>
        </div>,
        document.body,
      )}
    </header>
  );
};

export default Header;