import React, { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Box, Typography, CircularProgress, Alert, Button, Dialog, DialogTitle, DialogContent,
  DialogActions, TextField, MenuItem, Select, FormControl, InputLabel, Autocomplete,
  ToggleButtonGroup, ToggleButton, Tooltip,
} from '@mui/material';
import ViewInArIcon from '@mui/icons-material/ViewInAr';
import ViewAgendaIcon from '@mui/icons-material/ViewAgenda';
import { createPublicShareClient, joinShareLink } from '../api/publicShareClient';
import FamilyTreeCanvas from '../components/tree/FamilyTreeCanvas';
import FamilyTree3D from '../components/tree/FamilyTree3D';
import type { FamilyTreeData, FamilyMember } from '../types/family';
import { dedupeMembers, memberLabel, renderMemberOption } from '../components/common/memberOptionUtils';
import BrandedLoader from '../components/common/BrandedLoader';

interface GuestStatus {
  accessLevel: 'READ_ONLY' | 'EDIT';
  maxMembersPerGuest: number | null;
  membersAddedCount: number;
}

const GuestSharePage: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const { t } = useTranslation();

  const [status, setStatus] = useState<'loading' | 'error' | 'ready'>('loading');
  const [errorMessage, setErrorMessage] = useState('');
  const [accessLevel, setAccessLevel] = useState<'READ_ONLY' | 'EDIT'>('READ_ONLY');
  const [treeData, setTreeData] = useState<FamilyTreeData | undefined>();
  const [showAddModal, setShowAddModal] = useState(false);
  const [viewMode, setViewMode] = useState<'2d' | '3d'>('2d');

  // status invitat: câți membri mai poate adăuga față de limita link-ului
  const [guestStatus, setGuestStatus] = useState<GuestStatus | null>(null);

  const loadTree = async () => {
    if (!token) return;
    const client = createPublicShareClient(token);
    const { data } = await client.get<FamilyTreeData>('/tree');
    setTreeData(data);
  };

  const loadGuestStatus = async () => {
    if (!token) return;
    const client = createPublicShareClient(token);
    const { data } = await client.get<GuestStatus>('/me');
    setGuestStatus(data);
  };

  useEffect(() => {
    if (!token) return;
    (async () => {
      try {
        const link = await joinShareLink(token);
        setAccessLevel(link.accessLevel);
        await loadTree();
        await loadGuestStatus();
        setStatus('ready');
      } catch (err: any) {
        setErrorMessage(err.response?.data?.message || t('guestShare.genericError'));
        setStatus('error');
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  if (status === 'loading') {
    return (
      <BrandedLoader fullScreen={false} />
    );
  }

  if (status === 'error') {
    return (
      <Box sx={{ height: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', px: 3 }}>
        <Alert severity="error" sx={{ maxWidth: 420 }}>{errorMessage}</Alert>
      </Box>
    );
  }

  const remainingMembers = guestStatus?.maxMembersPerGuest != null
    ? Math.max(0, guestStatus.maxMembersPerGuest - guestStatus.membersAddedCount)
    : null;

  return (
    <Box sx={{ height: '100dvh', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1 }}>
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box component="img" src="/assets/favicon.svg" alt="" sx={{ width: 22, height: 22 }} />
            <Typography sx={{ fontWeight: 800 }}>eArbore</Typography>
          </Box>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
            {accessLevel === 'EDIT' ? t('guestShare.editBadge') : t('guestShare.readOnlyBadge')}
          </Typography>
          {accessLevel === 'EDIT' && (
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
              {remainingMembers != null
                ? t('guestShare.remainingMembers', { remaining: remainingMembers, max: guestStatus?.maxMembersPerGuest })
                : t('guestShare.unlimitedMembers')}
            </Typography>
          )}
        </Box>
        {accessLevel === 'EDIT' && (
          <Button
            variant="contained"
            onClick={() => setShowAddModal(true)}
            disabled={remainingMembers === 0}
          >
            {t('guestShare.addMember')}
          </Button>
        )}
      </Box>

      <Box sx={{ flex: 1, minHeight: 0, position: 'relative' }}>
        {viewMode === '2d' ? (
          <FamilyTreeCanvas
            treeData={treeData}
            direction="top-down"
            onReorder={() => { /* invitații nu pot reorganiza arborele */ }}
            onQuickAdd={() => setShowAddModal(true)}
          />
        ) : (
          <FamilyTree3D treeData={treeData} direction="top-down" />
        )}

        <Box sx={{ position: 'absolute', top: 12, right: 12, zIndex: 10 }}>
          <ToggleButtonGroup
            value={viewMode}
            exclusive
            size="small"
            onChange={(_, val) => val && setViewMode(val)}
            sx={{ bgcolor: 'background.paper', boxShadow: 1, borderRadius: 3 }}
          >
            <ToggleButton value="2d" sx={{ borderRadius: 3 }}>
              <Tooltip title="2D"><ViewAgendaIcon fontSize="small" /></Tooltip>
            </ToggleButton>
            <ToggleButton value="3d" sx={{ borderRadius: 3 }}>
              <Tooltip title="3D"><ViewInArIcon fontSize="small" /></Tooltip>
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>
      </Box>

      {showAddModal && token && (
        <GuestAddMemberDialog
          token={token}
          members={treeData?.members ?? []}
          onClose={() => setShowAddModal(false)}
          onCreated={async () => {
            setShowAddModal(false);
            await loadTree();
            await loadGuestStatus();
          }}
        />
      )}
    </Box>
  );
};

// ── formular simplu de adăugare membru, folosind clientul de invitat ──
const GuestAddMemberDialog: React.FC<{
  token: string;
  members: FamilyMember[];
  onClose: () => void;
  onCreated: () => void;
}> = ({ token, members, onClose, onCreated }) => {
  const { t } = useTranslation();
  const uniqueMembers = useMemo(() => dedupeMembers(members), [members]);

  const [form, setForm] = useState({ firstName: '', lastName: '', gender: '', birthDate: '' });
  const [father, setFather] = useState<FamilyMember | null>(null);
  const [mother, setMother] = useState<FamilyMember | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError('');
    try {
      const client = createPublicShareClient(token);
      const { data: newMember } = await client.post('/family-members', {
        firstName: form.firstName,
        lastName: form.lastName,
        gender: form.gender || undefined,
        birthDate: form.birthDate || undefined,
      });
      if (father) await client.post('/relations', { parentId: father.id, childId: newMember.id });
      if (mother) await client.post('/relations', { parentId: mother.id, childId: newMember.id });
      onCreated();
    } catch (err: any) {
      setError(err.response?.data?.message || t('guestShare.genericError'));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open onClose={isSaving ? undefined : onClose} maxWidth="xs" fullWidth>
      <DialogTitle>{t('guestShare.addMember')}</DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField size="small" label={t('memberDetail.firstName')} name="firstName" value={form.firstName} onChange={handleChange} required disabled={isSaving} />
          <TextField size="small" label={t('memberDetail.lastName')} name="lastName" value={form.lastName} onChange={handleChange} required disabled={isSaving} />
          <FormControl size="small" fullWidth disabled={isSaving}>
            <InputLabel>{t('addMember.gender')}</InputLabel>
            <Select label={t('addMember.gender')} value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })}>
              <MenuItem value="">{t('common.unspecified')}</MenuItem>
              <MenuItem value="MALE">{t('common.genders.male')}</MenuItem>
              <MenuItem value="FEMALE">{t('common.genders.female')}</MenuItem>
              <MenuItem value="OTHER">{t('common.genders.other')}</MenuItem>
            </Select>
          </FormControl>
          <TextField size="small" type="date" label={t('addMember.birthDate')} name="birthDate" value={form.birthDate} onChange={handleChange} disabled={isSaving} slotProps={{ inputLabel: { shrink: true } }} />

          {uniqueMembers.length > 0 && (
            <>
              <Autocomplete
                size="small"
                options={uniqueMembers.filter((m) => m.gender !== 'FEMALE')}
                getOptionLabel={memberLabel}
                renderOption={renderMemberOption}
                value={father}
                onChange={(_, val) => setFather(val)}
                disabled={isSaving}
                renderInput={(params) => <TextField {...params} label={t('addMember.father')} />}
              />
              <Autocomplete
                size="small"
                options={uniqueMembers.filter((m) => m.gender !== 'MALE')}
                getOptionLabel={memberLabel}
                renderOption={renderMemberOption}
                value={mother}
                onChange={(_, val) => setMother(val)}
                disabled={isSaving}
                renderInput={(params) => <TextField {...params} label={t('addMember.mother')} />}
              />
            </>
          )}

          {error && <Alert severity="error">{error}</Alert>}
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} disabled={isSaving}>{t('common.cancel')}</Button>
          <Button type="submit" variant="contained" disabled={isSaving}>
            {isSaving ? t('common.saving') : t('common.save')}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default GuestSharePage;