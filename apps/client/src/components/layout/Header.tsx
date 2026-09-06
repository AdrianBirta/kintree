import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { IconButton, Tooltip } from '@mui/material';
import TableRowsIcon from '@mui/icons-material/TableRows';
import { useAuth } from '../../hooks/useAuth';
import type { FamilyTreeData } from '../../types/family';
import MembersAccordionMenu from './MembersAccordionMenu';

interface Props {
  treeData?: FamilyTreeData;
}

const Header: React.FC<Props> = ({ treeData }) => {
  const navigate = useNavigate();
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

  return (
    <header className="w-full border-b border-earbore-border bg-white/90 backdrop-blur-sm z-20">
      <div className="px-6 py-3 flex items-center justify-between">
        <button onClick={() => navigate('/dashboard')} className="flex items-center gap-2 cursor-pointer">
          <span className="text-xl font-extrabold text-earbore-700">eArbore</span>
        </button>

        <div className="flex items-center gap-3">
          {/* Buton către tabelul de membri (CRUD) */}
          <Tooltip title="Tabel membri">
            <IconButton size="small" onClick={() => navigate('/members')} sx={{ color: 'var(--color-earbore-gray)' }}>
              <TableRowsIcon fontSize="small" />
            </IconButton>
          </Tooltip>

          {/* Dropdown membri — arbore genealogic tip acordeon */}
          <div className="relative" ref={membersMenuRef}>
            <button
              onClick={() => setMembersMenuOpen((v) => !v)}
              className="flex items-center gap-2 text-sm font-medium text-earbore-gray hover:text-earbore-700 px-3 py-2 rounded-lg hover:bg-earbore-50 transition-colors cursor-pointer"
            >
              Membri ({memberCount})
              <span className={`transition-transform ${membersMenuOpen ? 'rotate-180' : ''}`}>▾</span>
            </button>

            {membersMenuOpen && (
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg border border-earbore-border py-2 max-h-96 overflow-y-auto">
                <MembersAccordionMenu treeData={treeData} onNavigate={handleNavigateToMember} />
              </div>
            )}
          </div>

          {/* Dropdown user */}
          <div className="relative" ref={userMenuRef}>
            <button
              onClick={() => setUserMenuOpen((v) => !v)}
              className="w-9 h-9 rounded-full bg-earbore-600 text-white flex items-center justify-center text-sm font-bold cursor-pointer hover:bg-earbore-700 transition-colors"
            >
              {initials}
            </button>

            {userMenuOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-earbore-border py-2">
                <div className="px-4 py-2 border-b border-earbore-border mb-1">
                  <p className="text-sm font-semibold text-earbore-ink">{user?.firstName} {user?.lastName}</p>
                  <p className="text-xs text-earbore-gray">{user?.email}</p>
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