import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Avatar, Box, Button, Chip, CircularProgress, Divider, FormControl, IconButton, InputAdornment, ListItemIcon,
  ListItemText, Menu, MenuItem, Paper, Select, Table, TableBody, TableCell, TableContainer, TableHead,
  TablePagination, TableRow, TableSortLabel, TextField, ToggleButton, ToggleButtonGroup, Typography,
  useMediaQuery, useTheme,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import VisibilityIcon from '@mui/icons-material/Visibility';
import EditIcon from '@mui/icons-material/Edit';
import BlockIcon from '@mui/icons-material/Block';
import ChatBubble from '@mui/icons-material/ChatBubble';
import DeleteIcon from '@mui/icons-material/Delete';
import FavoriteIcon from '@mui/icons-material/Favorite';
import {
  useAdminUsers, useDeleteAdminUser, useUpdateAdminUser,
} from '../../hooks/queries/useAdminQueries';
import type { AdminDonorFilter, AdminSortField, AdminStatusFilter, AdminUserListItem } from '../../types/admin';
import { formatDate, fullName, initialsOf } from '../../utils/format';
import ConfirmDialog from '../common/ConfirmDialog';
import UserFormDialog from './UserFormDialog';

const headerCellSx = {
  fontWeight: 700,
  fontSize: 12.5,
  textTransform: 'uppercase' as const,
  letterSpacing: '0.04em',
  color: 'var(--color-earbore-gray)',
  backgroundColor: 'var(--color-earbore-50)',
  borderBottom: '2px solid var(--color-earbore-200)',
  whiteSpace: 'nowrap' as const,
};

const toggleGroupSx = {
  '& .MuiToggleButton-root': {
    textTransform: 'none' as const, fontSize: 13, px: 1.5, py: 0.5,
    borderColor: 'var(--color-earbore-border)', color: 'var(--color-earbore-gray)',
  },
  '& .Mui-selected': {
    backgroundColor: 'var(--color-earbore-100) !important',
    color: 'var(--color-earbore-700) !important',
    fontWeight: 600,
  },
};

const StatusChips: React.FC<{ user: AdminUserListItem }> = ({ user }) => {
  const { t } = useTranslation();
  return (
    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
      <Chip
        size="small"
        label={user.disabled ? t('admin.badge.disabled') : t('admin.badge.active')}
        color={user.disabled ? 'error' : 'success'}
        variant={user.disabled ? 'filled' : 'outlined'}
      />
      {user.role === 'ADMIN' && <Chip size="small" color="primary" label={t('admin.badge.admin')} />}
      {user.donationsCount > 0 && (
        <Chip
          size="small" variant="outlined" icon={<FavoriteIcon sx={{ fontSize: 14 }} />}
          label={t('admin.badge.donor')} sx={{ color: 'var(--color-earbore-danger)', borderColor: 'var(--color-earbore-danger)' }}
        />
      )}
    </Box>
  );
};

const AdminUsersTable: React.FC = () => {
  const { t, i18n } = useTranslation();
  const lang = i18n.language?.slice(0, 2) || 'en';
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<AdminStatusFilter>('all');
  const [donor, setDonor] = useState<AdminDonorFilter>('all');
  const [sortBy, setSortBy] = useState<AdminSortField>('createdAt');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);

  const [menu, setMenu] = useState<{ anchor: HTMLElement; user: AdminUserListItem } | null>(null);
  const [editUser, setEditUser] = useState<AdminUserListItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AdminUserListItem | null>(null);

  const updateMutation = useUpdateAdminUser();
  const deleteMutation = useDeleteAdminUser();

  // debounce la căutare: nu lovim API-ul la fiecare literă
  useEffect(() => {
    const id = window.setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(0);
    }, 350);
    return () => window.clearTimeout(id);
  }, [searchInput]);

  const { data, isLoading, isFetching } = useAdminUsers({
    search: search || undefined,
    status,
    donor,
    sortBy,
    sortDir,
    page: page + 1,
    pageSize,
  });

  const users = data?.items ?? [];
  const total = data?.total ?? 0;

  const handleSort = (field: AdminSortField) => {
    if (sortBy === field) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else {
      setSortBy(field);
      setSortDir(field === 'createdAt' || field === 'lastLoginAt' || field === 'members' ? 'desc' : 'asc');
    }
    setPage(0);
  };

  const toggleDisabled = (u: AdminUserListItem) =>
    updateMutation.mutate({ id: u.id, data: { disabled: !u.disabled } });

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteMutation.mutateAsync(deleteTarget.id);
      setDeleteTarget(null);
    } catch {
      // dialogul rămâne deschis ca să poți reîncerca
    }
  };

  const sortLabel = (field: AdminSortField, label: string) => (
    <TableSortLabel active={sortBy === field} direction={sortBy === field ? sortDir : 'asc'} onClick={() => handleSort(field)}>
      {label}
    </TableSortLabel>
  );

  const renderUserCell = (u: AdminUserListItem) => (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, minWidth: 0 }}>
      <Avatar src={u.avatarUrl ?? undefined} sx={{ width: 36, height: 36, fontSize: 13, fontWeight: 700 }}>
        {initialsOf(u)}
      </Avatar>
      <Box sx={{ minWidth: 0 }}>
        <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>{fullName(u)}</Typography>
        <Typography variant="caption" color="text.secondary" noWrap sx={{ display: 'block' }}>{u.email}</Typography>
      </Box>
    </Box>
  );

  return (
    <Paper variant="outlined" sx={{ borderRadius: 3, overflow: 'hidden' }}>
      {/* ── bară de filtre ── */}
      <Box
        sx={{
          p: { xs: 1.5, sm: 2 }, display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 1.5,
          borderBottom: '1px solid var(--color-earbore-border)', bgcolor: 'white',
        }}
      >
        <Typography variant="subtitle1" sx={{ fontWeight: 800, mr: 'auto' }}>
          {t('admin.users.title')}
          <Chip size="small" label={total} sx={{ ml: 1, bgcolor: 'var(--color-earbore-100)', color: 'var(--color-earbore-700)', fontWeight: 700 }} />
          {isFetching && !isLoading && <CircularProgress size={14} sx={{ ml: 1 }} />}
        </Typography>

        <TextField
          size="small"
          placeholder={t('admin.users.searchPlaceholder')}
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          autoComplete="off"
          slotProps={{
            input: {
              startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment>,
            },
          }}
          sx={{ width: { xs: '100%', sm: 280 } }}
        />

        <ToggleButtonGroup
          size="small" exclusive value={status} sx={toggleGroupSx}
          onChange={(_, v) => { if (v) { setStatus(v); setPage(0); } }}
        >
          <ToggleButton value="all">{t('admin.users.statusAll')}</ToggleButton>
          <ToggleButton value="active">{t('admin.users.statusActive')}</ToggleButton>
          <ToggleButton value="disabled">{t('admin.users.statusDisabled')}</ToggleButton>
        </ToggleButtonGroup>

        <FormControl size="small" sx={{ minWidth: 140 }}>
          <Select value={donor} onChange={(e) => { setDonor(e.target.value as AdminDonorFilter); setPage(0); }}>
            <MenuItem value="all">{t('admin.users.donorAll')}</MenuItem>
            <MenuItem value="donors">{t('admin.users.donorOnly')}</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>
      ) : users.length === 0 ? (
        <Box sx={{ py: 6, textAlign: 'center', color: 'text.secondary' }}>
          <Typography variant="body2">{t('admin.users.noResults')}</Typography>
        </Box>
      ) : isMobile ? (
        // ── mobil: carduri ──
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, p: 1.25 }}>
          {users.map((u) => (
            <Paper
              key={u.id} variant="outlined"
              sx={{ p: 1.5, borderRadius: 2.5, opacity: u.disabled ? 0.75 : 1, cursor: 'pointer' }}
              onClick={() => navigate(`/admin/users/${u.id}`)}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box sx={{ flex: 1, minWidth: 0 }}>{renderUserCell(u)}</Box>
                <IconButton
                  size="small"
                  onClick={(e) => { e.stopPropagation(); setMenu({ anchor: e.currentTarget, user: u }); }}
                >
                  <MoreVertIcon fontSize="small" />
                </IconButton>
              </Box>
              <Box sx={{ mt: 1 }}><StatusChips user={u} /></Box>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, mt: 1 }}>
                <Typography variant="caption" color="text.secondary">
                  {t('admin.users.membersCount', { count: u.membersCount })}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {t('admin.users.joinedOn', { date: formatDate(u.createdAt, lang) })}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {t('admin.users.lastLoginOn', { date: u.lastLoginAt ? formatDate(u.lastLoginAt, lang) : t('admin.users.never') })}
                </Typography>
              </Box>
            </Paper>
          ))}
        </Box>
      ) : (
        // ── desktop: tabel ──
        <TableContainer sx={{ overflowX: 'auto' }}>
          <Table size="small" sx={{ minWidth: 900 }}>
            <TableHead>
              <TableRow>
                <TableCell sx={headerCellSx}>{sortLabel('firstName', t('admin.users.colUser'))}</TableCell>
                <TableCell sx={headerCellSx}>{t('admin.users.colStatus')}</TableCell>
                <TableCell sx={headerCellSx} align="right">{sortLabel('members', t('admin.users.colMembers'))}</TableCell>
                <TableCell sx={headerCellSx}>{sortLabel('createdAt', t('admin.users.colJoined'))}</TableCell>
                <TableCell sx={headerCellSx}>{sortLabel('lastLoginAt', t('admin.users.colLastLogin'))}</TableCell>
                <TableCell sx={headerCellSx} />
              </TableRow>
            </TableHead>
            <TableBody>
              {users.map((u) => (
                <TableRow
                  key={u.id} hover
                  sx={{ cursor: 'pointer', opacity: u.disabled ? 0.7 : 1 }}
                  onClick={() => navigate(`/admin/users/${u.id}`)}
                >
                  <TableCell sx={{ maxWidth: 320 }}>{renderUserCell(u)}</TableCell>
                  <TableCell><StatusChips user={u} /></TableCell>
                  <TableCell align="right">{u.membersCount}</TableCell>
                  <TableCell>{formatDate(u.createdAt, lang)}</TableCell>
                  <TableCell>{u.lastLoginAt ? formatDate(u.lastLoginAt, lang) : t('admin.users.never')}</TableCell>
                  <TableCell align="right">
                    <IconButton
                      size="small"
                      onClick={(e) => { e.stopPropagation(); setMenu({ anchor: e.currentTarget, user: u }); }}
                    >
                      <MoreVertIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <TablePagination
        component="div"
        count={total}
        page={page}
        onPageChange={(_, p) => setPage(p)}
        rowsPerPage={pageSize}
        onRowsPerPageChange={(e) => { setPageSize(parseInt(e.target.value, 10)); setPage(0); }}
        rowsPerPageOptions={[10, 25, 50]}
        labelRowsPerPage={t('admin.users.rowsPerPage')}
        labelDisplayedRows={({ from, to, count }) => t('admin.users.displayedRows', { from, to, count })}
        sx={{
          borderTop: '1px solid var(--color-earbore-border)',
          '.MuiTablePagination-toolbar': { flexWrap: 'wrap', justifyContent: 'center', rowGap: 0.5, px: 1 },
          '.MuiTablePagination-spacer': { display: { xs: 'none', sm: 'block' } },
        }}
      />

      {/* ── meniu acțiuni ── */}
      <Menu anchorEl={menu?.anchor ?? null} open={!!menu} onClose={() => setMenu(null)}>
        <MenuItem onClick={() => { if (menu) navigate(`/admin/users/${menu.user.id}`); setMenu(null); }}>
          <ListItemIcon><VisibilityIcon fontSize="small" /></ListItemIcon>
          <ListItemText>{t('admin.users.actionView')}</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => { if (menu) setEditUser(menu.user); setMenu(null); }}>
          <ListItemIcon><EditIcon fontSize="small" /></ListItemIcon>
          <ListItemText>{t('admin.users.actionEdit')}</ListItemText>
        </MenuItem>
        {menu?.user.role !== 'ADMIN' && (
          <MenuItem onClick={() => { if (menu) toggleDisabled(menu.user); setMenu(null); }}>
            <ListItemIcon>
              {menu?.user.disabled ? <ChatBubble fontSize="small" /> : <BlockIcon fontSize="small" />}
            </ListItemIcon>
            <ListItemText>{menu?.user.disabled ? t('admin.users.actionEnable') : t('admin.users.actionDisable')}</ListItemText>
          </MenuItem>
        )}
        {menu?.user.role !== 'ADMIN' && <Divider />}
        {menu?.user.role !== 'ADMIN' && (
          <MenuItem onClick={() => { if (menu) setDeleteTarget(menu.user); setMenu(null); }} sx={{ color: 'error.main' }}>
            <ListItemIcon><DeleteIcon fontSize="small" color="error" /></ListItemIcon>
            <ListItemText>{t('common.delete')}</ListItemText>
          </MenuItem>
        )}
      </Menu>

      <UserFormDialog open={!!editUser} mode="edit" user={editUser} onClose={() => setEditUser(null)} />

      <ConfirmDialog
        open={!!deleteTarget}
        title={t('admin.users.deleteTitle')}
        description={deleteTarget ? t('admin.users.deleteDesc', { name: fullName(deleteTarget) }) : undefined}
        isLoading={deleteMutation.isPending}
        destructive
        icon="warning"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </Paper>
  );
};

export default AdminUsersTable;