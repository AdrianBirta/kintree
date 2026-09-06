import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  TableSortLabel, TextField, IconButton, Avatar, Chip, Button, InputAdornment,
  TablePagination, Tooltip, CircularProgress, Select, MenuItem, FormControl,
  Typography,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import AddIcon from '@mui/icons-material/Add';
import VisibilityIcon from '@mui/icons-material/Visibility';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import { format } from 'date-fns';
import { ro } from 'date-fns/locale';
import { familyMembersService } from '../api/familyMembersService';
import type { FamilyMember, FamilyTreeData, BloodType } from '../types/family';
import { BLOOD_TYPE_LABELS } from '../types/family';
import { calculateAge, isDeceased } from '../utils/age';
import Header from '../components/layout/Header';
import ConfirmDialog from '../components/common/ConfirmDialog';
import AddMemberModal from '../components/tree/AddMemberModal';

const GENDER_LABELS: Record<string, string> = { MALE: 'Masculin', FEMALE: 'Feminin', OTHER: 'Altul' };

type SortField = 'name' | 'gender' | 'birthDate' | 'age' | 'occupation' | 'bloodType';

const MembersListPage: React.FC = () => {
  const navigate = useNavigate();

  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [treeData, setTreeData] = useState<FamilyTreeData | undefined>();
  const [isLoading, setIsLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<FamilyMember>>({});
  const [isSavingRow, setIsSavingRow] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<FamilyMember | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [showAddModal, setShowAddModal] = useState(false);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [all, tree] = await Promise.all([
        familyMembersService.getAll(),
        familyMembersService.getTree(),
      ]);
      setMembers(all);
      setTreeData(tree);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = members;
    if (q) {
      list = list.filter((m) =>
        `${m.firstName} ${m.lastName} ${m.occupation ?? ''} ${m.education ?? ''}`.toLowerCase().includes(q),
      );
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
  }, [members, search, sortField, sortDir]);

  const paginated = useMemo(
    () => filtered.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage),
    [filtered, page, rowsPerPage],
  );

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
    setIsSavingRow(true);
    try {
      const updated = await familyMembersService.update(id, editForm);
      setMembers((prev) => prev.map((m) => (m.id === id ? { ...m, ...updated } : m)));
      setEditingId(null);
      setEditForm({});
    } finally {
      setIsSavingRow(false);
    }
  };

  const handleEditTextChange = (field: keyof FamilyMember) => (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const value = e.target.value;
    setEditForm((prev) => ({ ...prev, [field]: value === '' ? undefined : value }));
  };

  const handlePhotoChange = async (id: string, file: File) => {
    const updated = await familyMembersService.uploadPhoto(id, file);
    setMembers((prev) => prev.map((m) => (m.id === id ? { ...m, imageUrl: updated.imageUrl } : m)));
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await familyMembersService.remove(deleteTarget.id);
      setMembers((prev) => prev.filter((m) => m.id !== deleteTarget.id));
      setDeleteTarget(null);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="min-h-screen bg-earbore-grayLight">
      <Header treeData={treeData} />

      <Box sx={{ maxWidth: 1400, mx: 'auto', px: { xs: 2, sm: 4 }, py: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3, flexWrap: 'wrap', gap: 2 }}>
          <Typography variant="h5" sx={{ fontWeight: 800 }}>
            Toți membrii ({filtered.length})
          </Typography>

          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
            <TextField
              size="small"
              placeholder="Caută după nume, ocupație..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(0); }}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon fontSize="small" />
                    </InputAdornment>
                  ),
                },
              }}
              sx={{ minWidth: 260, bgcolor: 'white', borderRadius: 2 }}
            />
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => setShowAddModal(true)}>
              Adaugă membru
            </Button>
          </Box>
        </Box>

        <Paper sx={{ borderRadius: 3, overflow: 'hidden' }}>
          {isLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
              <CircularProgress />
            </Box>
          ) : (
            <>
              <TableContainer sx={{ maxHeight: 620 }}>
                <Table stickyHeader size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ width: 56 }}>Poză</TableCell>
                      <TableCell sortDirection={sortField === 'name' ? sortDir : false}>
                        <TableSortLabel active={sortField === 'name'} direction={sortField === 'name' ? sortDir : 'asc'} onClick={() => handleSort('name')}>
                          Nume
                        </TableSortLabel>
                      </TableCell>
                      <TableCell sortDirection={sortField === 'gender' ? sortDir : false}>
                        <TableSortLabel active={sortField === 'gender'} direction={sortField === 'gender' ? sortDir : 'asc'} onClick={() => handleSort('gender')}>
                          Gen
                        </TableSortLabel>
                      </TableCell>
                      <TableCell sortDirection={sortField === 'birthDate' ? sortDir : false}>
                        <TableSortLabel active={sortField === 'birthDate'} direction={sortField === 'birthDate' ? sortDir : 'asc'} onClick={() => handleSort('birthDate')}>
                          Data nașterii
                        </TableSortLabel>
                      </TableCell>
                      <TableCell sortDirection={sortField === 'age' ? sortDir : false}>
                        <TableSortLabel active={sortField === 'age'} direction={sortField === 'age' ? sortDir : 'asc'} onClick={() => handleSort('age')}>
                          Vârstă
                        </TableSortLabel>
                      </TableCell>
                      <TableCell sortDirection={sortField === 'occupation' ? sortDir : false}>
                        <TableSortLabel active={sortField === 'occupation'} direction={sortField === 'occupation' ? sortDir : 'asc'} onClick={() => handleSort('occupation')}>
                          Ocupație
                        </TableSortLabel>
                      </TableCell>
                      <TableCell sortDirection={sortField === 'bloodType' ? sortDir : false}>
                        <TableSortLabel active={sortField === 'bloodType'} direction={sortField === 'bloodType' ? sortDir : 'asc'} onClick={() => handleSort('bloodType')}>
                          Grupă sanguină
                        </TableSortLabel>
                      </TableCell>
                      <TableCell>Stare</TableCell>
                      <TableCell align="right" sx={{ width: 160 }}>Acțiuni</TableCell>
                    </TableRow>
                  </TableHead>

                  <TableBody>
                    {paginated.map((m) => {
                      const editing = editingId === m.id;
                      const age = calculateAge(m.birthDate, m.deathDate);
                      const deceased = isDeceased(m.deathDate);

                      return (
                        <TableRow key={m.id} hover>
                          <TableCell>
                            <Box sx={{ position: 'relative', width: 36, height: 36 }}>
                              <Avatar src={m.imageUrl ?? undefined} sx={{ width: 36, height: 36 }}>
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
                          </TableCell>

                          <TableCell>
                            {editing ? (
                              <Box sx={{ display: 'flex', gap: 1 }}>
                                <TextField size="small" value={editForm.firstName ?? ''} onChange={handleEditTextChange('firstName')} placeholder="Prenume" sx={{ width: 100 }} />
                                <TextField size="small" value={editForm.lastName ?? ''} onChange={handleEditTextChange('lastName')} placeholder="Nume" sx={{ width: 100 }} />
                              </Box>
                            ) : (
                              <Box sx={{ cursor: 'pointer', fontWeight: 600 }} onClick={() => navigate(`/members/${m.id}`)}>
                                {m.firstName} {m.lastName}
                              </Box>
                            )}
                          </TableCell>

                          <TableCell>
                            {editing ? (
                              <FormControl size="small" sx={{ minWidth: 110 }}>
                                <Select
                                  value={editForm.gender ?? ''}
                                  onChange={(e) => setEditForm((prev) => ({ ...prev, gender: (e.target.value || undefined) as any }))}
                                  displayEmpty
                                >
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

                          <TableCell>
                            {editing ? (
                              <TextField
                                size="small" type="date" value={editForm.birthDate?.slice(0, 10) ?? ''}
                                onChange={handleEditTextChange('birthDate')} sx={{ width: 150 }}
                              />
                            ) : (
                              m.birthDate ? format(new Date(m.birthDate), 'd MMM yyyy', { locale: ro }) : '—'
                            )}
                          </TableCell>

                          <TableCell>{age !== null ? `${age} ani` : '—'}</TableCell>

                          <TableCell>
                            {editing ? (
                              <TextField size="small" value={editForm.occupation ?? ''} onChange={handleEditTextChange('occupation')} sx={{ width: 140 }} />
                            ) : (
                              m.occupation || '—'
                            )}
                          </TableCell>

                          <TableCell>
                            {editing ? (
                              <FormControl size="small" sx={{ minWidth: 90 }}>
                                <Select
                                  value={editForm.bloodType ?? ''}
                                  onChange={(e) => setEditForm((prev) => ({ ...prev, bloodType: (e.target.value || undefined) as any }))}
                                  displayEmpty
                                >
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

                          <TableCell>
                            {deceased ? (
                              <Chip label="✝ decedat" size="small" variant="outlined" />
                            ) : (
                              <Chip label="în viață" size="small" color="success" variant="outlined" />
                            )}
                          </TableCell>

                          <TableCell align="right">
                            {editing ? (
                              <>
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
                              </>
                            ) : (
                              <>
                                <Tooltip title="Vezi profil">
                                  <IconButton size="small" onClick={() => navigate(`/members/${m.id}`)}>
                                    <VisibilityIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                                <Tooltip title="Editare rapidă">
                                  <IconButton size="small" onClick={() => startEdit(m)}>
                                    <EditIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                                <Tooltip title="Șterge">
                                  <IconButton size="small" color="error" onClick={() => setDeleteTarget(m)}>
                                    <DeleteIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                              </>
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
              />
            </>
          )}
        </Paper>
      </Box>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Ștergi acest membru?"
        description={deleteTarget ? `${deleteTarget.firstName} ${deleteTarget.lastName} va fi eliminat definitiv, împreună cu toate relațiile asociate.` : undefined}
        isLoading={isDeleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />

      {showAddModal && (
        <AddMemberModal
          members={members}
          onClose={() => setShowAddModal(false)}
          onCreated={() => { setShowAddModal(false); loadData(); }}
        />
      )}
    </div>
  );
};

export default MembersListPage;