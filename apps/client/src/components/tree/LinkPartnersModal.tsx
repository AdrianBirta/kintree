import React, { useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, MenuItem,
  Select, InputLabel, FormControl, Typography, Alert, CircularProgress, IconButton,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import FavoriteIcon from '@mui/icons-material/Favorite';
import { familyMembersService } from '../../api/familyMembersService';
import type { FamilyMember } from '../../types/family';

interface Props {
  members: FamilyMember[];
  onClose: () => void;
  onLinked: () => void;
}

const LinkPartnersModal: React.FC<Props> = ({ members, onClose, onLinked }) => {
  const [partnerAId, setPartnerAId] = useState('');
  const [partnerBId, setPartnerBId] = useState('');
  const [status, setStatus] = useState('MARRIED');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (partnerAId === partnerBId) {
      setError('Alege doi membri diferiți.');
      return;
    }
    setIsSaving(true);
    setError('');
    try {
      await familyMembersService.linkPartners(partnerAId, partnerBId, status);
      onLinked();
    } catch (err: any) {
      setError(err.response?.data?.message || 'A apărut o eroare.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog
      open
      onClose={isSaving ? undefined : onClose}
      maxWidth="xs"
      fullWidth
      sx={{ '& .MuiDialog-paper': { borderRadius: 4 } }}
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontWeight: 700 }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <FavoriteIcon color="primary" fontSize="small" /> Leagă parteneri
        </span>
        <IconButton onClick={onClose} disabled={isSaving} size="small"><CloseIcon /></IconButton>
      </DialogTitle>

      <form onSubmit={handleSubmit}>
        <DialogContent dividers sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          <Typography variant="body2" color="text.secondary">
            Marchează doi membri ca soț și soție / parteneri.
          </Typography>

          <FormControl fullWidth required disabled={isSaving}>
            <InputLabel>Primul membru</InputLabel>
            <Select label="Primul membru" value={partnerAId} onChange={(e) => setPartnerAId(e.target.value)}>
              <MenuItem value="">Alege...</MenuItem>
              {members.map((m) => <MenuItem key={m.id} value={m.id}>{m.firstName} {m.lastName}</MenuItem>)}
            </Select>
          </FormControl>

          <FormControl fullWidth required disabled={isSaving}>
            <InputLabel>Al doilea membru</InputLabel>
            <Select label="Al doilea membru" value={partnerBId} onChange={(e) => setPartnerBId(e.target.value)}>
              <MenuItem value="">Alege...</MenuItem>
              {members.map((m) => <MenuItem key={m.id} value={m.id}>{m.firstName} {m.lastName}</MenuItem>)}
            </Select>
          </FormControl>

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

        <DialogActions sx={{ p: 2.5 }}>
          <Button onClick={onClose} disabled={isSaving} variant="outlined" color="inherit">Anulează</Button>
          <Button
            type="submit" disabled={isSaving} variant="contained"
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