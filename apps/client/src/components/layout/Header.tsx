import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../hooks/useAuth';
import { useTreeQuery } from '../../hooks/queries/useFamilyQueries';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import TableRowsIcon from '@mui/icons-material/TableRows';
import GroupsIcon from '@mui/icons-material/Groups';
import CloseIcon from '@mui/icons-material/Close';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import { IconButton, useMediaQuery, useTheme, Menu, MenuItem, ListItemIcon, ListItemText } from '@mui/material';
import MembersAccordionMenu from './MembersAccordionMenu';
import ConfirmDialog from '../common/ConfirmDialog';
import LanguageSwitcher from '../common/LanguageSwitcher';
import ShareManagementModal from '../sharing/ShareManagementModal';
import { usePermissions } from '../../hooks/usePermissions';
import { useActiveTreeStore } from '../../store/activeTreeStore';

const ChatBubbleOutlineIcon: React.FC<{ fontSize?: 'small' }> = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <path d="M20 11.5C20 15.6421 16.4183 19 12 19C10.8475 19 9.75782 18.7744 8.7898 18.3692L4 20L5.47422 16.3199C4.54823 15.0011 4 13.3164 4 11.5C4 7.35786 7.58172 4 12 4C16.4183 4 20 7.35786 20 11.5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const Header: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  // NOU — sub 400px, navigarea principală (Arbore/Tabel/Mesaje) nu mai
  // încape lângă restul header-ului (membri, limbă, avatar), deci o
  // colapsăm într-un singur buton cu meniu dropdown.
  const isCompactNav = useMediaQuery(theme.breakpoints.down(400));

  const { activeOwner, setActiveOwner } = useActiveTreeStore();
  const { viewingOwnerName } = usePermissions();

  const [shareModalOpen, setShareModalOpen] = useState(false);

  const { data: treeData } = useTreeQuery();

  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [membersMenuOpen, setMembersMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const membersMenuRef = useRef<HTMLDivElement>(null);

  // NOU — anchor pentru meniul de navigare colapsat
  const [navMenuAnchor, setNavMenuAnchor] = useState<HTMLElement | null>(null);

  const [confirmLogoutOpen, setConfirmLogoutOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

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

  const handleLogoutRequest = () => {
    setUserMenuOpen(false);
    setConfirmLogoutOpen(true);
  };

  const handleConfirmLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
    } finally {
      setIsLoggingOut(false);
      setConfirmLogoutOpen(false);
    }
  };

  const isTreeActive = location.pathname === '/dashboard' || /^\/members\/.+/.test(location.pathname);
  const isTableActive = location.pathname === '/members';
  const isMessagesActive = location.pathname.startsWith('/messages');

  const navButtonClass = (active: boolean) =>
    `flex items-center gap-1.5 text-sm font-semibold px-2.5 sm:px-3.5 py-2 rounded-lg transition-colors cursor-pointer flex-shrink-0 ${active
      ? 'bg-earbore-100 text-earbore-700'
      : 'text-earbore-gray hover:text-earbore-700 hover:bg-earbore-50'
    }`;

  // NOU — cele trei destinații de navigare, reutilizate atât pentru
  // butoanele normale cât și pentru meniul dropdown colapsat
  const navItems = [
    { key: 'tree', icon: <AccountTreeIcon fontSize="small" />, label: t('header.tree'), active: isTreeActive, onClick: () => navigate('/dashboard') },
    { key: 'membersTable', icon: <TableRowsIcon fontSize="small" />, label: t('header.membersTable'), active: isTableActive, onClick: () => navigate('/members') },
    { key: 'messages', icon: <ChatBubbleOutlineIcon />, label: t('header.messages'), active: isMessagesActive, onClick: () => navigate('/messages') },
  ];

  const handleNavMenuItemClick = (onClick: () => void) => {
    setNavMenuAnchor(null);
    onClick();
  };

  return (
    <>
      <header className="w-full border-b border-earbore-border bg-white/90 backdrop-blur-sm sticky top-0 z-30">
        <div className="px-3 sm:px-6 py-2.5 sm:py-3 flex items-center justify-between gap-2">
          <button onClick={() => navigate('/dashboard')} className="flex items-center gap-2 cursor-pointer flex-shrink-0">
            <img src="/assets/favicon.svg" alt="" className="h-7 w-7" />
            {!isCompactNav && (
              <span className="text-lg sm:text-xl font-extrabold text-earbore-700">eArbore</span>
            )}
          </button>

          <div className="flex items-center gap-1 sm:gap-2 min-w-0">
            {isCompactNav ? (
              // NOU — sub 400px: un singur buton care deschide dropdown-ul
              // cu cele trei destinații, în loc de trei butoane separate
              <>
                <IconButton
                  onClick={(e) => setNavMenuAnchor(e.currentTarget)}
                  size="small"
                  sx={{
                    color: navItems.some((item) => item.active) ? 'var(--color-earbore-700)' : 'var(--color-earbore-gray)',
                    bgcolor: navItems.some((item) => item.active) ? 'var(--color-earbore-100)' : 'transparent',
                  }}
                >
                  <MoreHorizIcon fontSize="small" />
                </IconButton>
                <Menu
                  anchorEl={navMenuAnchor}
                  open={!!navMenuAnchor}
                  onClose={() => setNavMenuAnchor(null)}
                  anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
                  transformOrigin={{ vertical: 'top', horizontal: 'left' }}
                >
                  {navItems.map((item) => (
                    <MenuItem
                      key={item.key}
                      selected={item.active}
                      onClick={() => handleNavMenuItemClick(item.onClick)}
                    >
                      <ListItemIcon sx={{ color: item.active ? 'var(--color-earbore-700)' : 'inherit' }}>
                        {item.icon}
                      </ListItemIcon>
                      <ListItemText
                        primary={item.label}
                        slotProps={{ primary: { sx: { fontWeight: item.active ? 700 : 500 } } }}
                      />
                    </MenuItem>
                  ))}
                </Menu>
              </>
            ) : (
              // comportamentul normal — trei butoane vizibile
              navItems.map((item) => (
                <button key={item.key} onClick={item.onClick} className={navButtonClass(item.active)}>
                  {item.icon}
                  <span className="hidden sm:inline">{item.label}</span>
                </button>
              ))
            )}

            <div className="relative flex-shrink-0" ref={membersMenuRef}>
              <button
                onClick={() => setMembersMenuOpen((v) => !v)}
                className="flex items-center gap-1.5 text-sm font-medium text-earbore-gray hover:text-earbore-700 px-2.5 sm:px-3 py-2 rounded-lg hover:bg-earbore-50 transition-colors cursor-pointer"
              >
                <GroupsIcon fontSize="small" className="sm:hidden" />
                <span className="hidden sm:inline">{t('header.members', { count: memberCount })}</span>
                <span className="sm:hidden text-xs font-semibold">{memberCount}</span>
                <span className={`hidden sm:inline transition-transform ${membersMenuOpen ? 'rotate-180' : ''}`}>▾</span>
              </button>

              {membersMenuOpen && !isMobile && (
                <div className="absolute right-0 mt-2 w-72 sm:w-80 max-w-[85vw] bg-white rounded-xl shadow-lg border border-earbore-border py-2 max-h-96 overflow-y-auto">
                  <MembersAccordionMenu treeData={treeData} onNavigate={handleNavigateToMember} />
                </div>
              )}
            </div>

            <LanguageSwitcher variant="icon" />

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
                    {t('header.myProfile')}
                  </button>

                  <button
                    onClick={() => { setUserMenuOpen(false); setShareModalOpen(true); }}
                    className="w-full text-left px-4 py-2 text-sm text-earbore-ink hover:bg-earbore-50 transition-colors cursor-pointer"
                  >
                    {t('header.sharing')}
                  </button>

                  <button
                    onClick={() => { setUserMenuOpen(false); navigate('/trees'); }}
                    className="w-full text-left px-4 py-2 text-sm text-earbore-ink hover:bg-earbore-50 transition-colors cursor-pointer"
                  >
                    {t('header.trees')}
                  </button>

                  <button
                    onClick={handleLogoutRequest}
                    className="w-full text-left px-4 py-2 text-sm text-earbore-danger hover:bg-red-50 transition-colors cursor-pointer"
                  >
                    {t('header.logout')}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {membersMenuOpen && isMobile && createPortal(
          <div className="fixed inset-0 z-50 bg-white flex flex-col">
            <div className="flex items-center justify-between px-4 py-3 border-b border-earbore-border flex-shrink-0">
              <h2 className="text-base font-bold text-earbore-ink">{t('header.members', { count: memberCount })}</h2>
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

        <ShareManagementModal open={shareModalOpen} onClose={() => setShareModalOpen(false)} />

        <ConfirmDialog
          open={confirmLogoutOpen}
          title={t('header.logoutConfirmTitle')}
          description={t('header.logoutConfirmDesc')}
          confirmLabel={t('header.logoutConfirmButton')}
          isLoading={isLoggingOut}
          destructive
          icon="logout"
          onConfirm={handleConfirmLogout}
          onCancel={() => setConfirmLogoutOpen(false)}
        />
      </header>

      {activeOwner && (
        <div className="w-full bg-earbore-100 border-b border-earbore-200 px-4 py-2 flex items-center justify-center gap-3 text-sm">
          <span className="text-earbore-700 font-medium">
            {t('trees.viewingBanner', { name: viewingOwnerName })}
            {' · '}
            {t(activeOwner.accessLevel === 'EDIT' ? 'sharing.editAccess' : 'sharing.readOnly')}
          </span>
          <button
            onClick={() => setActiveOwner(null)}
            className="text-earbore-600 font-semibold underline cursor-pointer"
          >
            {t('trees.backToOwn')}
          </button>
        </div>
      )}
    </>
  );
};

export default Header;