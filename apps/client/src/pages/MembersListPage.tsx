import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import {
  Box, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  TableSortLabel, TextField, IconButton, Avatar, Chip, Button, InputAdornment,
  TablePagination, Tooltip, CircularProgress, Select, MenuItem, FormControl,
  Typography, useMediaQuery, useTheme, InputLabel, Checkbox, Menu, ListItemIcon,
  ListItemText, Divider, ToggleButtonGroup, ToggleButton,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import AddIcon from '@mui/icons-material/Add';
import VisibilityIcon from '@mui/icons-material/Visibility';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import ViewColumnIcon from '@mui/icons-material/ViewColumn';
import FilterListIcon from '@mui/icons-material/FilterList';
import { format } from 'date-fns';
import { ro } from 'date-fns/locale';
import { familyMembersService } from '../api/familyMembersService';
import type { FamilyMember, BloodType } from '../types/family';
import { BLOOD_TYPE_LABELS } from '../types/family';
import { calculateAge, isDeceased } from '../utils/age';
import Header from '../components/layout/Header';
import ConfirmDialog from '../components/common/ConfirmDialog';
import AddMemberModal from '../components/tree/AddMemberModal';
import { useMembersQuery, useTreeQuery } from '../hooks/queries/useFamilyQueries';
import { useUpdateMember, useUploadPhoto, useRemoveMember, invalidateFamilyData } from '../hooks/queries/useFamilyMutations';

const GENDER_LABELS: Record<string, string> = { MALE: 'Masculin', FEMALE: 'Feminin', OTHER: 'Altul' };

type SortField = 'name' | 'gender' | 'birthDate' | 'age' | 'occupation' | 'bloodType';
type ColumnKey = 'gender' | 'birthDate' | 'age' | 'occupation' | 'bloodType';
type StatusFilter = 'all' | 'alive' | 'deceased';
type GenderFilter = 'ALL' | 'MALE' | 'FEMALE' | 'OTHER';

const OPTIONAL_COLUMNS: { key: ColumnKey; label: string }[] = [
  { key: 'gender', label: 'Gen' },
  { key: 'birthDate', label: 'Data nașterii' },
  { key: 'age', label: 'Vârstă' },
  { key: 'occupation', label: 'Ocupație' },
  { key: 'bloodType', label: 'Grupă sanguină' },
];

const COLUMNS_STORAGE_KEY = 'earbore-members-visible-columns-v1';

function getGenderAccent(gender?: string | null): string {
  if (gender === 'FEMALE') return 'var(--color-earbore-danger)';
  if (gender === 'MALE') return 'var(--color-earbore-info)';
  return 'var(--color-earbore-400)';
}

const headerCellSx = {
  fontWeight: 700,
  fontSize: 12.5,
  textTransform: 'uppercase' as const,
  letterSpacing: '0.04em',
  color: 'var(--color-earbore-gray)',
  backgroundColor: 'var(--color-earbore-50)',
  borderBottom: '2px solid var(--color-earbore-200)',
  borderRight: '1px solid var(--color-earbore-border)',
  whiteSpace: 'nowrap' as const,
};

const sortLabelSx = {
  '&.Mui-active': { color: 'var(--color-earbore-700)' },
  '& .MuiTableSortLabel-icon': { color: 'var(--color-earbore-500) !important' },
};

const rowActionBtnSx = {
  opacity: 0,
  transition: 'opacity .15s',
  '@media (hover: none)': { opacity: 1 },
};

function getRowSx(isSelected: boolean) {
  return {
    backgroundColor: isSelected ? 'var(--color-earbore-50)' : 'transparent',
    '&:hover': { backgroundColor: 'var(--color-earbore-50)' },
    '&:hover .row-actions': { opacity: 1 },
  };
}

const toggleGroupSx = {
  '& .MuiToggleButton-root': {
    textTransform: 'none' as const,
    fontSize: 13,
    px: 1.5,
    py: 0.5,
    borderColor: 'var(--color-earbore-border)',
    color: 'var(--color-earbore-gray)',
  },
  '& .Mui-selected': {
    backgroundColor: 'var(--color-earbore-100) !important',
    color: 'var(--color-earbore-700) !important',
    fontWeight: 600,
  },
};

interface MobileListProps {
  members: FamilyMember[];
  editingId: string | null;
  editForm: Partial<FamilyMember>;
  isSavingRow: boolean;
  onStartEdit: (m: FamilyMember) => void;
  onCancelEdit: () => void;
  onSaveEdit: (id: string) => void;
  onFieldChange: (field: keyof FamilyMember) => (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSelectFieldChange: (field: 'gender' | 'bloodType', value: string) => void;
  onPhotoChange: (id: string, file: File) => void;
  onView: (id: string) => void;
  onDeleteRequest: (m: FamilyMember) => void;
}

const MobileMemberList: React.FC<MobileListProps> = ({
  members, editingId, editForm, isSavingRow,
  onStartEdit, onCancelEdit, onSaveEdit, onFieldChange, onSelectFieldChange, onPhotoChange, onView, onDeleteRequest,
}) => {
  const [menuFor, setMenuFor] = useState<{ anchor: HTMLElement; member: FamilyMember } | null>(null);

  if (members.length === 0) {
    return (
      <Box sx={{ py: 6, textAlign: 'center', color: 'text.secondary' }}>
        <Typography variant="body2">Niciun membru găsit.</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, p: 1.25 }}>
      {members.map((m) => {
        const editing = editingId === m.id;
        const age = calculateAge(m.birthDate, m.deathDate);
        const deceased = isDeceased(m.deathDate);

        return (
          <Paper key={m.id} variant="outlined" sx={{ borderRadius: 2.5, overflow: 'hidden', display: 'flex' }}>
            <Box sx={{ width: 4, flexShrink: 0, bgcolor: deceased ? 'var(--color-earbore-border)' : getGenderAccent(m.gender) }} />

            <Box sx={{ flex: 1, p: 1.5, minWidth: 0 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
                <Box sx={{ position: 'relative', width: 42, height: 42, flexShrink: 0 }}>
                  <Avatar src={m.imageUrl ?? undefined} sx={{ width: 42, height: 42 }}>
                    {m.firstName[0]}{m.lastName[0]}
                  </Avatar>
                  {editing && (
                    <IconButton
                      component="label"
                      size="small"
                      sx={{
                        position: 'absolute', bottom: -4, right: -4, width: 20, height: 20,
                        bgcolor: 'primary.main', color: 'white', '&:hover': { bgcolor: 'primary.dark' },
                      }}
                    >
                      <PhotoCameraIcon sx={{ fontSize: 12 }} />
                      <input
                        hidden
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) onPhotoChange(m.id, file);
                        }}
                      />
                    </IconButton>
                  )}
                </Box>

                <Box sx={{ flex: 1, minWidth: 0 }}>
                  {editing ? (
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <TextField
                        size="small" autoComplete="given-name" value={editForm.firstName ?? ''}
                        onChange={onFieldChange('firstName')} placeholder="Prenume" fullWidth
                      />
                      <TextField
                        size="small" autoComplete="family-name" value={editForm.lastName ?? ''}
                        onChange={onFieldChange('lastName')} placeholder="Nume" fullWidth
                      />
                    </Box>
                  ) : (
                    <Typography
                      variant="subtitle2"
                      sx={{ fontWeight: 700, cursor: 'pointer' }}
                      onClick={() => onView(m.id)}
                      noWrap
                    >
                      {m.firstName} {m.lastName}
                    </Typography>
                  )}

                  {!editing && (
                    <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 0.75, mt: 0.5 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: deceased ? 'var(--color-earbore-gray)' : 'var(--color-earbore-success)' }} />
                        <Typography variant="caption" sx={{ color: deceased ? 'text.secondary' : 'var(--color-earbore-success)', fontWeight: 600 }}>
                          {deceased ? 'Decedat' : 'În viață'}
                        </Typography>
                      </Box>
                      {age !== null && <Typography variant="caption" color="text.secondary">• {age} ani</Typography>}
                      {m.gender && <Typography variant="caption" color="text.secondary">• {GENDER_LABELS[m.gender]}</Typography>}
                      {m.bloodType && (
                        <Typography variant="caption" color="text.secondary">
                          • {BLOOD_TYPE_LABELS[m.bloodType as BloodType]}
                        </Typography>
                      )}
                    </Box>
                  )}

                  {!editing && m.occupation && (
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.25 }} noWrap>
                      {m.occupation}
                    </Typography>
                  )}
                </Box>

                {!editing && (
                  <IconButton size="small" onClick={(e) => setMenuFor({ anchor: e.currentTarget, member: m })}>
                    <MoreVertIcon fontSize="small" />
                  </IconButton>
                )}
              </Box>

              {editing && (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.25, mt: 1.5 }}>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <FormControl size="small" fullWidth>
                      <InputLabel>Gen</InputLabel>
                      <Select
                        label="Gen"
                        value={editForm.gender ?? ''}
                        onChange={(e) => onSelectFieldChange('gender', e.target.value)}
                      >
                        <MenuItem value="">Nespecificat</MenuItem>
                        <MenuItem value="MALE">Masculin</MenuItem>
                        <MenuItem value="FEMALE">Feminin</MenuItem>
                        <MenuItem value="OTHER">Altul</MenuItem>
                      </Select>
                    </FormControl>
                    <TextField
                      size="small" type="date" autoComplete="bday"
                      value={editForm.birthDate?.slice(0, 10) ?? ''}
                      onChange={onFieldChange('birthDate')} fullWidth
                    />
                  </Box>
                  <TextField
                    size="small" autoComplete="organization-title" label="Ocupație"
                    value={editForm.occupation ?? ''} onChange={onFieldChange('occupation')} fullWidth
                  />
                  <FormControl size="small" fullWidth>
                    <InputLabel>Grupă sanguină</InputLabel>
                    <Select
                      label="Grupă sanguină"
                      value={editForm.bloodType ?? ''}
                      onChange={(e) => onSelectFieldChange('bloodType', e.target.value)}
                    >
                      <MenuItem value="">—</MenuItem>
                      {Object.entries(BLOOD_TYPE_LABELS).map(([key, label]) => (
                        <MenuItem key={key} value={key}>{label}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button fullWidth variant="outlined" color="inherit" disabled={isSavingRow} onClick={onCancelEdit}>
                      Anulează
                    </Button>
                    <Button fullWidth variant="contained" disabled={isSavingRow} onClick={() => onSaveEdit(m.id)}>
                      {isSavingRow ? 'Se salvează...' : 'Salvează'}
                    </Button>
                  </Box>
                </Box>
              )}
            </Box>
          </Paper>
        );
      })}

      <Menu anchorEl={menuFor?.anchor ?? null} open={!!menuFor} onClose={() => setMenuFor(null)}>
        <MenuItem onClick={() => { if (menuFor) onView(menuFor.member.id); setMenuFor(null); }}>
          <ListItemIcon><VisibilityIcon fontSize="small" /></ListItemIcon>
          <ListItemText>Vezi profil</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => { if (menuFor) onStartEdit(menuFor.member); setMenuFor(null); }}>
          <ListItemIcon><EditIcon fontSize="small" /></ListItemIcon>
          <ListItemText>Editare rapidă</ListItemText>
        </MenuItem>
        <Divider />
        <MenuItem onClick={() => { if (menuFor) onDeleteRequest(menuFor.member); setMenuFor(null); }} sx={{ color: 'error.main' }}>
          <ListItemIcon><DeleteIcon fontSize="small" color="error" /></ListItemIcon>
          <ListItemText>Șterge</ListItemText>
        </MenuItem>
      </Menu>
    </Box>
  );
};

const MembersListPage: React.FC = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const queryClient = useQueryClient();

  // NOU — membrii şi arborele vin din cache-ul React Query, partajat cu
  // celelalte pagini — nu mai cer din nou acelaşi lucru la fiecare navigare.
  const { data: members = [], isLoading } = useMembersQuery();
  const { data: treeData } = useTreeQuery();

  const updateMemberMutation = useUpdateMember();
  const uploadPhotoMutation = useUploadPhoto();
  const removeMemberMutation = useRemoveMember();

  const isSavingRow = updateMemberMutation.isPending;
  const isDeleting = removeMemberMutation.isPending;

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [genderFilter, setGenderFilter] = useState<GenderFilter>('ALL');
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<FamilyMember>>({});

  const [deleteTarget, setDeleteTarget] = useState<FamilyMember | null>(null);

  const [showAddModal, setShowAddModal] = useState(false);

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);

  const [visibleColumns, setVisibleColumns] = useState<Set<ColumnKey>>(() => {
    try {
      const raw = localStorage.getItem(COLUMNS_STORAGE_KEY);
      if (raw) return new Set(JSON.parse(raw));
    } catch {
      /* ignorăm — pornim cu toate coloanele vizibile */
    }
    return new Set(OPTIONAL_COLUMNS.map((c) => c.key));
  });
  const [columnsMenuAnchor, setColumnsMenuAnchor] = useState<HTMLElement | null>(null);

  const [rowMenu, setRowMenu] = useState<{ anchor: HTMLElement; member: FamilyMember } | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem(COLUMNS_STORAGE_KEY, JSON.stringify([...visibleColumns]));
    } catch {
      /* ignorăm */
    }
  }, [visibleColumns]);

  useEffect(() => {
    setPage(0);
    setSelected(new Set());
  }, [search, statusFilter, genderFilter]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = members;

    if (q) {
      list = list.filter((m) =>
        `${m.firstName} ${m.lastName} ${m.occupation ?? ''} ${m.education ?? ''}`.toLowerCase().includes(q),
      );
    }
    if (statusFilter !== 'all') {
      list = list.filter((m) => (statusFilter === 'deceased' ? isDeceased(m.deathDate) : !isDeceased(m.deathDate)));
    }
    if (genderFilter !== 'ALL') {
      list = list.filter((m) => (m.gender ?? 'OTHER') === genderFilter);
    }

    const getValue = (m: FamilyMember): string | number => {
      switch (sortField) {
        case 'name': return `${m.firstName} ${m.lastName}`.toLowerCase();
        case 'gender': return m.gender ?? '';
        case 'birthDate': return m.birthDate ? new Date(m.birthDate).getTime() : 0;
        case 'age': return calculateAge(m.birthDate, m.deathDate) ?? -1;
        case 'occupation': return (m.occupation ?? '').toLowerCase();
        case 'bloodType': return m.bloodType ?? '';
        default: return '';
      }
    };

    return [...list].sort((a, b) => {
      const va = getValue(a);
      const vb = getValue(b);
      if (va < vb) return sortDir === 'asc' ? -1 : 1;
      if (va > vb) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
  }, [members, search, statusFilter, genderFilter, sortField, sortDir]);

  const paginated = useMemo(
    () => filtered.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage),
    [filtered, page, rowsPerPage],
  );

  const allSelectedOnPage = paginated.length > 0 && paginated.every((m) => selected.has(m.id));
  const someSelectedOnPage = paginated.some((m) => selected.has(m.id));

  const toggleRow = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleSelectAllOnPage = () => {
    setSelected((prev) => {
      const next = new Set(prev);
      paginated.forEach((m) => (allSelectedOnPage ? next.delete(m.id) : next.add(m.id)));
      return next;
    });
  };

  const clearSelection = () => setSelected(new Set());

  const toggleColumn = (key: ColumnKey) => {
    setVisibleColumns((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDir('asc');
    }
  };

  const startEdit = (m: FamilyMember) => {
    setEditingId(m.id);
    setEditForm({
      firstName: m.firstName,
      lastName: m.lastName,
      gender: m.gender,
      birthDate: m.birthDate,
      occupation: m.occupation,
      bloodType: m.bloodType,
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm({});
  };

  const saveEdit = async (id: string) => {
    try {
      await updateMemberMutation.mutateAsync({ id, data: editForm });
      setEditingId(null);
      setEditForm({});
    } catch {
      // eroarea rămâne implicită — rândul rămâne deschis ca să poţi reîncerca
    }
  };

  const handleEditTextChange = (field: keyof FamilyMember) => (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const value = e.target.value;
    setEditForm((prev) => ({ ...prev, [field]: value === '' ? undefined : value }));
  };

  const handleEditSelectChange = (field: 'gender' | 'bloodType', value: string) => {
    setEditForm((prev) => ({ ...prev, [field]: (value || undefined) as any }));
  };

  const handlePhotoChange = async (id: string, file: File) => {
    await uploadPhotoMutation.mutateAsync({ id, file });
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await removeMemberMutation.mutateAsync(deleteTarget.id);
      setDeleteTarget(null);
    } catch {
      // dialogul rămâne deschis, ca să poţi reîncerca
    }
  };

  // NOU — la ştergerea în masă facem toate cererile direct (fără să trecem
  // prin mutaţia individuală), ca să nu invalidăm cache-ul de N ori la
  // rând — o singură invalidare, după ce toate ştergerile s-au terminat.
  const handleBulkDelete = async () => {
    setIsBulkDeleting(true);
    try {
      const ids = [...selected];
      await Promise.all(ids.map((id) => familyMembersService.remove(id)));
      invalidateFamilyData(queryClient, ids);
      clearSelection();
      setBulkDeleteOpen(false);
    } finally {
      setIsBulkDeleting(false);
    }
  };

  const openRowMenu = (e: React.MouseEvent<HTMLElement>, member: FamilyMember) => {
    e.stopPropagation();
    setRowMenu({ anchor: e.currentTarget, member });
  };
  const closeRowMenu = () => setRowMenu(null);

  const hasActiveFilters = statusFilter !== 'all' || genderFilter !== 'ALL';

  return (
    <div className="min-h-dvh bg-earbore-grayLight">
      <Header />

      <Box sx={{ maxWidth: 1400, mx: 'auto', px: { xs: 1.5, sm: 4 }, py: { xs: 2, sm: 4 } }}>
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            alignItems: { xs: 'stretch', sm: 'center' },
            justifyContent: 'space-between',
            mb: 3,
            gap: 2,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, px: { xs: 0.5, sm: 0 } }}>
            <Typography variant="h5" sx={{ fontWeight: 800 }}>Toți membrii</Typography>
            <Chip
              label={filtered.length}
              size="small"
              sx={{ bgcolor: 'var(--color-earbore-100)', color: 'var(--color-earbore-700)', fontWeight: 700 }}
            />
          </Box>

          <Box sx={{ display: 'flex', gap: 1.5, flexDirection: { xs: 'column', sm: 'row' } }}>
            <TextField
              size="small"
              placeholder="Caută după nume, ocupație..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              autoComplete="off"
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon fontSize="small" />
                    </InputAdornment>
                  ),
                },
              }}
              sx={{ width: { xs: '100%', sm: 260 }, bgcolor: 'white', borderRadius: 2 }}
            />
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setShowAddModal(true)}
              fullWidth={isMobile}
              sx={{ flexShrink: 0 }}
            >
              Adaugă membru
            </Button>
          </Box>
        </Box>

        <Paper sx={{ borderRadius: 1, overflow: 'hidden', border: '1px solid', borderColor: 'var(--color-earbore-border)' }}>
          <Box
            sx={{
              display: 'flex', alignItems: 'center', gap: 1.5, px: { xs: 1.5, sm: 2 }, py: 1.25,
              borderBottom: '1px solid var(--color-earbore-border)', flexWrap: 'wrap', bgcolor: 'white',
            }}
          >
            <FilterListIcon fontSize="small" sx={{ color: 'var(--color-earbore-gray)' }} />

            <ToggleButtonGroup
              size="small"
              value={statusFilter}
              exclusive
              onChange={(_, v) => v && setStatusFilter(v)}
              sx={toggleGroupSx}
            >
              <ToggleButton value="all">Toți</ToggleButton>
              <ToggleButton value="alive">În viață</ToggleButton>
              <ToggleButton value="deceased">Decedați</ToggleButton>
            </ToggleButtonGroup>

            <FormControl size="small" sx={{ minWidth: 140 }}>
              <Select value={genderFilter} onChange={(e) => setGenderFilter(e.target.value as GenderFilter)}>
                <MenuItem value="ALL">Toate genurile</MenuItem>
                <MenuItem value="MALE">Masculin</MenuItem>
                <MenuItem value="FEMALE">Feminin</MenuItem>
                <MenuItem value="OTHER">Altul</MenuItem>
              </Select>
            </FormControl>

            {hasActiveFilters && (
              <Button size="small" onClick={() => { setStatusFilter('all'); setGenderFilter('ALL'); }}>
                Resetează filtrele
              </Button>
            )}

            {/* NOU — info + acțiuni de selecție, aliniate la dreapta în același rând,
      în loc de bara lată de deasupra care împingea tabelul în jos */}
            {selected.size > 0 && (
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  ml: 'auto',
                  pl: 1.5,
                  borderLeft: { xs: 'none', sm: '1px solid var(--color-earbore-border)' },
                }}
              >
                <Typography variant="body2" sx={{ fontWeight: 600, color: 'var(--color-earbore-700)', whiteSpace: 'nowrap' }}>
                  {selected.size} {selected.size === 1 ? 'selectat' : 'selectați'}
                </Typography>
                <Button size="small" variant="text" color="inherit" onClick={clearSelection}>
                  Anulează
                </Button>
                <Button
                  size="small"
                  variant="contained"
                  color="error"
                  disableElevation
                  startIcon={<DeleteIcon fontSize="small" />}
                  onClick={() => setBulkDeleteOpen(true)}
                >
                  Șterge
                </Button>
              </Box>
            )}
          </Box>

          {isLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
              <CircularProgress />
            </Box>
          ) : isMobile ? (
            <>
              <MobileMemberList
                members={paginated}
                editingId={editingId}
                editForm={editForm}
                isSavingRow={isSavingRow}
                onStartEdit={startEdit}
                onCancelEdit={cancelEdit}
                onSaveEdit={saveEdit}
                onFieldChange={handleEditTextChange}
                onSelectFieldChange={handleEditSelectChange}
                onPhotoChange={handlePhotoChange}
                onView={(id) => navigate(`/members/${id}`)}
                onDeleteRequest={(m) => setDeleteTarget(m)}
              />

              <TablePagination
                component="div"
                count={filtered.length}
                page={page}
                onPageChange={(_, newPage) => setPage(newPage)}
                rowsPerPage={rowsPerPage}
                onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
                rowsPerPageOptions={[10, 25, 50]}
                labelRowsPerPage="Pe pagină"
                sx={{
                  borderTop: '1px solid var(--color-earbore-border)',
                  '.MuiTablePagination-toolbar': { flexWrap: 'wrap', justifyContent: 'center', rowGap: 1, px: 1 },
                  '.MuiTablePagination-spacer': { display: 'none' },
                }}
              />
            </>
          ) : (
            <>
              <TableContainer sx={{ maxHeight: 620, overflowX: 'auto' }}>
                <Table
                  stickyHeader
                  size="small"
                  sx={{ minWidth: 920, '& .MuiTableCell-root': { borderColor: 'var(--color-earbore-border)' } }}
                >
                  <TableHead>
                    <TableRow>
                      <TableCell padding="checkbox" sx={headerCellSx}>
                        <Checkbox
                          size="small"
                          indeterminate={someSelectedOnPage && !allSelectedOnPage}
                          checked={allSelectedOnPage}
                          onChange={toggleSelectAllOnPage}
                        />
                      </TableCell>

                      <TableCell sx={headerCellSx}>
                        <TableSortLabel
                          active={sortField === 'name'}
                          direction={sortField === 'name' ? sortDir : 'asc'}
                          onClick={() => handleSort('name')}
                          sx={sortLabelSx}
                        >
                          Membru
                        </TableSortLabel>
                      </TableCell>

                      {visibleColumns.has('gender') && (
                        <TableCell sx={headerCellSx} sortDirection={sortField === 'gender' ? sortDir : false}>
                          <TableSortLabel active={sortField === 'gender'} direction={sortField === 'gender' ? sortDir : 'asc'} onClick={() => handleSort('gender')} sx={sortLabelSx}>
                            Gen
                          </TableSortLabel>
                        </TableCell>
                      )}

                      {visibleColumns.has('birthDate') && (
                        <TableCell sx={headerCellSx} sortDirection={sortField === 'birthDate' ? sortDir : false}>
                          <TableSortLabel active={sortField === 'birthDate'} direction={sortField === 'birthDate' ? sortDir : 'asc'} onClick={() => handleSort('birthDate')} sx={sortLabelSx}>
                            Data nașterii
                          </TableSortLabel>
                        </TableCell>
                      )}

                      {visibleColumns.has('age') && (
                        <TableCell sx={headerCellSx} sortDirection={sortField === 'age' ? sortDir : false}>
                          <TableSortLabel active={sortField === 'age'} direction={sortField === 'age' ? sortDir : 'asc'} onClick={() => handleSort('age')} sx={sortLabelSx}>
                            Vârstă
                          </TableSortLabel>
                        </TableCell>
                      )}

                      {visibleColumns.has('occupation') && (
                        <TableCell sx={headerCellSx} sortDirection={sortField === 'occupation' ? sortDir : false}>
                          <TableSortLabel active={sortField === 'occupation'} direction={sortField === 'occupation' ? sortDir : 'asc'} onClick={() => handleSort('occupation')} sx={sortLabelSx}>
                            Ocupație
                          </TableSortLabel>
                        </TableCell>
                      )}

                      {visibleColumns.has('bloodType') && (
                        <TableCell sx={headerCellSx} sortDirection={sortField === 'bloodType' ? sortDir : false}>
                          <TableSortLabel active={sortField === 'bloodType'} direction={sortField === 'bloodType' ? sortDir : 'asc'} onClick={() => handleSort('bloodType')} sx={sortLabelSx}>
                            Grupă sanguină
                          </TableSortLabel>
                        </TableCell>
                      )}

                      <TableCell sx={headerCellSx}>Stare</TableCell>

                      <TableCell sx={{ ...headerCellSx, borderRight: 'none' }} align="right">
                        <Tooltip title="Coloane vizibile">
                          <IconButton size="small" onClick={(e) => setColumnsMenuAnchor(e.currentTarget)}>
                            <ViewColumnIcon fontSize="small" sx={{ color: 'var(--color-earbore-gray)' }} />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  </TableHead>

                  <TableBody>
                    {paginated.map((m) => {
                      const editing = editingId === m.id;
                      const age = calculateAge(m.birthDate, m.deathDate);
                      const deceased = isDeceased(m.deathDate);
                      const rowSelected = selected.has(m.id);

                      return (
                        <TableRow key={m.id} sx={getRowSx(rowSelected)}>
                          <TableCell padding="checkbox">
                            <Checkbox size="small" checked={rowSelected} onChange={() => toggleRow(m.id)} />
                          </TableCell>

                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, minWidth: 0 }}>
                              <Box sx={{ position: 'relative', width: 34, height: 34, flexShrink: 0 }}>
                                <Avatar
                                  src={m.imageUrl ?? undefined}
                                  sx={{
                                    width: 34, height: 34, fontSize: 13, fontWeight: 700,
                                    border: '2px solid',
                                    borderColor: deceased ? 'var(--color-earbore-border)' : getGenderAccent(m.gender),
                                  }}
                                >
                                  {m.firstName[0]}{m.lastName[0]}
                                </Avatar>
                                {editing && (
                                  <IconButton
                                    component="label"
                                    size="small"
                                    sx={{
                                      position: 'absolute', bottom: -6, right: -6, width: 20, height: 20,
                                      bgcolor: 'primary.main', color: 'white', '&:hover': { bgcolor: 'primary.dark' },
                                    }}
                                  >
                                    <PhotoCameraIcon sx={{ fontSize: 12 }} />
                                    <input
                                      hidden
                                      type="file"
                                      accept="image/*"
                                      onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) handlePhotoChange(m.id, file);
                                      }}
                                    />
                                  </IconButton>
                                )}
                              </Box>

                              {editing ? (
                                <Box sx={{ display: 'flex', gap: 1 }}>
                                  <TextField size="small" autoComplete="given-name" value={editForm.firstName ?? ''} onChange={handleEditTextChange('firstName')} placeholder="Prenume" sx={{ width: 100 }} />
                                  <TextField size="small" autoComplete="family-name" value={editForm.lastName ?? ''} onChange={handleEditTextChange('lastName')} placeholder="Nume" sx={{ width: 100 }} />
                                </Box>
                              ) : (
                                <Box sx={{ minWidth: 0 }}>
                                  <Typography
                                    variant="body2"
                                    sx={{ fontWeight: 600, cursor: 'pointer', '&:hover': { color: 'primary.main' } }}
                                    onClick={() => navigate(`/members/${m.id}`)}
                                    noWrap
                                  >
                                    {m.firstName} {m.lastName}
                                  </Typography>
                                  {m.maidenName && (
                                    <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic', display: 'block' }} noWrap>
                                      n. {m.maidenName}
                                    </Typography>
                                  )}
                                </Box>
                              )}
                            </Box>
                          </TableCell>

                          {visibleColumns.has('gender') && (
                            <TableCell>
                              {editing ? (
                                <FormControl size="small" sx={{ minWidth: 110 }}>
                                  <Select value={editForm.gender ?? ''} onChange={(e) => handleEditSelectChange('gender', e.target.value)} displayEmpty>
                                    <MenuItem value="">Nespecificat</MenuItem>
                                    <MenuItem value="MALE">Masculin</MenuItem>
                                    <MenuItem value="FEMALE">Feminin</MenuItem>
                                    <MenuItem value="OTHER">Altul</MenuItem>
                                  </Select>
                                </FormControl>
                              ) : (
                                (m.gender && GENDER_LABELS[m.gender]) ?? '—'
                              )}
                            </TableCell>
                          )}

                          {visibleColumns.has('birthDate') && (
                            <TableCell>
                              {editing ? (
                                <TextField
                                  size="small" type="date" autoComplete="bday" value={editForm.birthDate?.slice(0, 10) ?? ''}
                                  onChange={handleEditTextChange('birthDate')} sx={{ width: 150 }}
                                />
                              ) : (
                                m.birthDate ? format(new Date(m.birthDate), 'd MMM yyyy', { locale: ro }) : '—'
                              )}
                            </TableCell>
                          )}

                          {visibleColumns.has('age') && (
                            <TableCell>{age !== null ? `${age} ani` : '—'}</TableCell>
                          )}

                          {visibleColumns.has('occupation') && (
                            <TableCell>
                              {editing ? (
                                <TextField size="small" autoComplete="organization-title" value={editForm.occupation ?? ''} onChange={handleEditTextChange('occupation')} sx={{ width: 140 }} />
                              ) : (
                                m.occupation || '—'
                              )}
                            </TableCell>
                          )}

                          {visibleColumns.has('bloodType') && (
                            <TableCell>
                              {editing ? (
                                <FormControl size="small" sx={{ minWidth: 90 }}>
                                  <Select value={editForm.bloodType ?? ''} onChange={(e) => handleEditSelectChange('bloodType', e.target.value)} displayEmpty>
                                    <MenuItem value="">—</MenuItem>
                                    {Object.entries(BLOOD_TYPE_LABELS).map(([key, label]) => (
                                      <MenuItem key={key} value={key}>{label}</MenuItem>
                                    ))}
                                  </Select>
                                </FormControl>
                              ) : (
                                m.bloodType ? BLOOD_TYPE_LABELS[m.bloodType as BloodType] : '—'
                              )}
                            </TableCell>
                          )}

                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                              <Box sx={{ width: 8, height: 8, borderRadius: '50%', flexShrink: 0, bgcolor: deceased ? 'var(--color-earbore-gray)' : 'var(--color-earbore-success)' }} />
                              <Typography variant="caption" sx={{ fontWeight: 600, color: deceased ? 'text.secondary' : 'var(--color-earbore-success)' }}>
                                {deceased ? 'Decedat' : 'În viață'}
                              </Typography>
                            </Box>
                          </TableCell>

                          <TableCell align="right">
                            {editing ? (
                              <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 0.5 }}>
                                <Tooltip title="Salvează">
                                  <span>
                                    <IconButton size="small" color="primary" disabled={isSavingRow} onClick={() => saveEdit(m.id)}>
                                      <CheckIcon fontSize="small" />
                                    </IconButton>
                                  </span>
                                </Tooltip>
                                <Tooltip title="Anulează">
                                  <span>
                                    <IconButton size="small" disabled={isSavingRow} onClick={cancelEdit}>
                                      <CloseIcon fontSize="small" />
                                    </IconButton>
                                  </span>
                                </Tooltip>
                              </Box>
                            ) : (
                              <IconButton size="small" className="row-actions" sx={rowActionBtnSx} onClick={(e) => openRowMenu(e, m)}>
                                <MoreVertIcon fontSize="small" />
                              </IconButton>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}

                    {paginated.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={9} align="center" sx={{ py: 6, color: 'text.secondary' }}>
                          Niciun membru găsit.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>

              <TablePagination
                component="div"
                count={filtered.length}
                page={page}
                onPageChange={(_, newPage) => setPage(newPage)}
                rowsPerPage={rowsPerPage}
                onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
                rowsPerPageOptions={[10, 25, 50, 100]}
                labelRowsPerPage="Rânduri pe pagină"
                labelDisplayedRows={({ from, to, count }) => `${from}–${to} din ${count}`}
                sx={{
                  borderTop: '1px solid var(--color-earbore-border)',
                  '.MuiTablePagination-toolbar': { minHeight: 44, px: 2 },
                  '.MuiTablePagination-selectLabel, .MuiTablePagination-displayedRows': { fontSize: 13, color: 'var(--color-earbore-gray)' },
                }}
              />
            </>
          )}
        </Paper>
      </Box>

      <Menu anchorEl={columnsMenuAnchor} open={!!columnsMenuAnchor} onClose={() => setColumnsMenuAnchor(null)}>
        <Typography variant="caption" sx={{ px: 2, py: 1, display: 'block', color: 'text.secondary', fontWeight: 700 }}>
          COLOANE VIZIBILE
        </Typography>
        {OPTIONAL_COLUMNS.map((col) => (
          <MenuItem key={col.key} dense onClick={() => toggleColumn(col.key)}>
            <Checkbox size="small" checked={visibleColumns.has(col.key)} sx={{ p: 0, mr: 1.5 }} />
            <ListItemText primary={col.label} />
          </MenuItem>
        ))}
      </Menu>

      <Menu anchorEl={rowMenu?.anchor ?? null} open={!!rowMenu} onClose={closeRowMenu}>
        <MenuItem onClick={() => { if (rowMenu) navigate(`/members/${rowMenu.member.id}`); closeRowMenu(); }}>
          <ListItemIcon><VisibilityIcon fontSize="small" /></ListItemIcon>
          <ListItemText>Vezi profil</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => { if (rowMenu) startEdit(rowMenu.member); closeRowMenu(); }}>
          <ListItemIcon><EditIcon fontSize="small" /></ListItemIcon>
          <ListItemText>Editare rapidă</ListItemText>
        </MenuItem>
        <Divider />
        <MenuItem onClick={() => { if (rowMenu) setDeleteTarget(rowMenu.member); closeRowMenu(); }} sx={{ color: 'error.main' }}>
          <ListItemIcon><DeleteIcon fontSize="small" color="error" /></ListItemIcon>
          <ListItemText>Șterge</ListItemText>
        </MenuItem>
      </Menu>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Ștergi acest membru?"
        description={deleteTarget ? `${deleteTarget.firstName} ${deleteTarget.lastName} va fi eliminat definitiv, împreună cu toate relațiile asociate.` : undefined}
        isLoading={isDeleting}
        destructive
        icon="warning"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />

      <ConfirmDialog
        open={bulkDeleteOpen}
        title={`Ștergi ${selected.size} ${selected.size === 1 ? 'membru' : 'membri'}?`}
        description="Toți membrii selectați vor fi eliminați definitiv, împreună cu toate relațiile asociate."
        isLoading={isBulkDeleting}
        destructive
        icon="warning"
        onConfirm={handleBulkDelete}
        onCancel={() => setBulkDeleteOpen(false)}
      />

      {showAddModal && (
        <AddMemberModal
          members={members}
          currentSelfId={treeData?.selfMemberId}
          onClose={() => setShowAddModal(false)}
          onCreated={() => setShowAddModal(false)}
        />
      )}
    </div>
  );
};

export default MembersListPage;