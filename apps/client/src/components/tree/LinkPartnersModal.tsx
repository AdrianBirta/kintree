import React, { useMemo, useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, MenuItem,
  Select, InputLabel, FormControl, Typography, Alert, CircularProgress, IconButton,
  Autocomplete, TextField, useMediaQuery, useTheme,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import FavoriteIcon from '@mui/icons-material/Favorite';
import type { FamilyMember } from '../../types/family';
import { dedupeMembers, memberLabel, renderMemberOption } from '../common/memberOptionUtils';
import { useLinkPartners } from '../../hooks/queries/useFamilyMutations';

interface Props {
  members: FamilyMember[];
  onClose: () => void;
  onLinked: () => void;
}

const LinkPartnersModal: React.FC<Props> = ({ members, onClose, onLinked }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const [partnerAId, setPartnerAId] = useState('');
  const [partnerBId, setPartnerBId] = useState('');
  const [status, setStatus] = useState('MARRIED');
  const [error, setError] = useState('');

  const linkPartnersMutation = useLinkPartners();
  const isSaving = linkPartnersMutation.isPending;

  const uniqueMembers = useMemo(() => dedupeMembers(members), [members]);

  const partnerA = uniqueMembers.find((m) => m.id === partnerAId) ?? null;
  const partnerB = uniqueMembers.find((m) => m.id === partnerBId) ?? null;

  const partnerAOptions = uniqueMembers.filter((m) => m.id !== partnerBId);
  const partnerBOptions = uniqueMembers.filter((m) => m.id !== partnerAId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!partnerAId || !partnerBId) {
      setError('Alege ambii membri.');
      return;
    }
    if (partnerAId === partnerBId) {
      setError('Alege doi membri diferiți.');
      return;
    }
    setError('');
    try {
      await linkPartnersMutation.mutateAsync({ partnerAId, partnerBId, status });
      onLinked();
    } catch (err: any) {
      setError(err.response?.data?.message || 'A apărut o eroare.');
    }
  };

  return (
    <Dialog
      open
      onClose={isSaving ? undefined : onClose}
      maxWidth="sm"
      fullWidth
      fullScreen={isMobile}
      slotProps={{ paper: { sx: { borderRadius: isMobile ? 0 : 2 } } }}
    >
      <DialogTitle
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontWeight: 700,
          borderBottom: '1px solid',
          borderColor: 'divider',
        }}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <FavoriteIcon color="primary" fontSize="small" /> Leagă parteneri
        </span>
        <IconButton onClick={onClose} disabled={isSaving} size="small"><CloseIcon /></IconButton>
      </DialogTitle>

      <form onSubmit={handleSubmit} autoComplete="off">
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, py: 3 }}>
          <Typography variant="body2" color="text.secondary">
            Marchează doi membri ca soț și soție / parteneri.
          </Typography>

          <Autocomplete
            options={partnerAOptions}
            getOptionLabel={memberLabel}
            renderOption={renderMemberOption}
            value={partnerA}
            onChange={(_, val) => setPartnerAId(val?.id ?? '')}
            disabled={isSaving}
            isOptionEqualToValue={(a, b) => a.id === b.id}
            renderInput={(params) => (
              <TextField {...params} required label="Primul membru" placeholder="Caută după nume..." autoComplete="off" />
            )}
          />

          <Autocomplete
            options={partnerBOptions}
            getOptionLabel={memberLabel}
            renderOption={renderMemberOption}
            value={partnerB}
            onChange={(_, val) => setPartnerBId(val?.id ?? '')}
            disabled={isSaving}
            isOptionEqualToValue={(a, b) => a.id === b.id}
            renderInput={(params) => (
              <TextField {...params} required label="Al doilea membru" placeholder="Caută după nume..." autoComplete="off" />
            )}
          />

          <FormControl fullWidth disabled={isSaving}>
            <InputLabel>Status</InputLabel>
            <Select label="Status" value={status} onChange={(e) => setStatus(e.target.value)}>
              <MenuItem value="MARRIED">Căsătoriți</MenuItem>
              <MenuItem value="PARTNER">Parteneri</MenuItem>
              <MenuItem value="DIVORCED">Divorțați</MenuItem>
              <MenuItem value="WIDOWED">Văduv/ă</MenuItem>
            </Select>
          </FormControl>

          {error && <Alert severity="error">{error}</Alert>}
        </DialogContent>

        <DialogActions sx={{ p: 2.5, borderTop: '1px solid', borderColor: 'divider' }}>
          <Button onClick={onClose} disabled={isSaving} variant="outlined" color="inherit" sx={{ borderRadius: 1.5 }}>
            Anulează
          </Button>
          <Button
            type="submit"
            disabled={isSaving}
            variant="contained"
            sx={{ borderRadius: 1.5 }}
            startIcon={isSaving ? <CircularProgress size={16} color="inherit" /> : undefined}
          >
            {isSaving ? 'Se leagă...' : 'Leagă'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default LinkPartnersModal;