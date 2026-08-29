import React, { useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, MenuItem,
  Select, InputLabel, FormControl, Avatar, IconButton, Checkbox, FormControlLabel,
  FormGroup, Divider, Typography, Alert, CircularProgress, Box,
} from '@mui/material';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import CloseIcon from '@mui/icons-material/Close';
import { familyMembersService } from '../../api/familyMembersService';
import type { FamilyMember } from '../../types/family';

interface Props {
  members: FamilyMember[];
  onClose: () => void;
  onCreated: () => void;
}

const AddMemberModal: React.FC<Props> = ({ members, onClose, onCreated }) => {
  const [form, setForm] = useState({
    firstName: '', lastName: '', gender: '', birthDate: '',
    fatherId: '', motherId: '', partnerId: '', partnerStatus: 'MARRIED',
  });
  const [childrenIds, setChildrenIds] = useState<string[]>([]);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSelectChange = (name: string) => (e: any) => {
    setForm({ ...form, [name]: e.target.value });
  };

  const toggleChild = (id: string) => {
    setChildrenIds((prev) => (prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]));
  };

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError('');
    try {
      const newMember = await familyMembersService.create({
        firstName: form.firstName,
        lastName: form.lastName,
        gender: (form.gender || undefined) as any,
        birthDate: form.birthDate || undefined,
      });

      if (form.fatherId) await familyMembersService.linkParentChild(form.fatherId, newMember.id);
      if (form.motherId) await familyMembersService.linkParentChild(form.motherId, newMember.id);
      if (form.partnerId) await familyMembersService.linkPartners(newMember.id, form.partnerId, form.partnerStatus);
      for (const childId of childrenIds) await familyMembersService.linkParentChild(newMember.id, childId);

      if (photoFile) {
        await familyMembersService.uploadPhoto(newMember.id, photoFile);
      }

      onCreated();
    } catch (err: any) {
      setError(err.response?.data?.message || 'A apărut o eroare.');
    } finally {
      setIsSaving(false);
    }
  };

  const fatherOptions = members.filter((m) => m.gender !== 'FEMALE');
  const motherOptions = members.filter((m) => m.gender !== 'MALE');

  return (
    <Dialog open onClose={isSaving ? undefined : onClose} maxWidth="sm" fullWidth slotProps={{ paper: { sx: { borderRadius: 4 } } }}>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontWeight: 700 }}>
        Adaugă membru
        <IconButton onClick={onClose} disabled={isSaving} size="small"><CloseIcon /></IconButton>
      </DialogTitle>

      <form onSubmit={handleSubmit}>
        <DialogContent dividers sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>

          <Box sx={{ display: 'flex', justifyContent: 'center' }}>
            <Box sx={{ position: 'relative' }}>
              <Avatar src={photoPreview ?? undefined} sx={{ width: 84, height: 84, bgcolor: 'primary.light', fontSize: 28 }}>
                {form.firstName ? form.firstName[0] : '?'}
              </Avatar>
              <IconButton
                component="label"
                size="small"
                disabled={isSaving}
                sx={{
                  position: 'absolute', bottom: -4, right: -4, bgcolor: 'primary.main', color: 'white',
                  '&:hover': { bgcolor: 'primary.dark' },
                }}
              >
                <PhotoCameraIcon fontSize="small" />
                <input hidden type="file" accept="image/*" onChange={handlePhotoSelect} />
              </IconButton>
            </Box>
          </Box>

          {/* Prenume + Nume */}
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
            <TextField label="Prenume" name="firstName" value={form.firstName} onChange={handleChange} required fullWidth disabled={isSaving} />
            <TextField label="Nume" name="lastName" value={form.lastName} onChange={handleChange} required fullWidth disabled={isSaving} />
          </Box>

          {/* Gen + Data nașterii */}
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
            <FormControl fullWidth disabled={isSaving}>
              <InputLabel>Gen</InputLabel>
              <Select label="Gen" value={form.gender} onChange={handleSelectChange('gender')}>
                <MenuItem value="">Nespecificat</MenuItem>
                <MenuItem value="MALE">Masculin</MenuItem>
                <MenuItem value="FEMALE">Feminin</MenuItem>
                <MenuItem value="OTHER">Altul</MenuItem>
              </Select>
            </FormControl>
            <TextField
              label="Data nașterii" type="date" name="birthDate" value={form.birthDate} onChange={handleChange}
              fullWidth disabled={isSaving} slotProps={{ inputLabel: { shrink: true } }}
            />
          </Box>

          {members.length > 0 && (
            <>
              <Divider><Typography variant="caption" color="text.secondary">PĂRINȚI (opțional)</Typography></Divider>

              {/* Tată + Mamă */}
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                <FormControl fullWidth disabled={isSaving}>
                  <InputLabel>Tată</InputLabel>
                  <Select label="Tată" value={form.fatherId} onChange={handleSelectChange('fatherId')}>
                    <MenuItem value="">—</MenuItem>
                    {fatherOptions.map((m) => <MenuItem key={m.id} value={m.id}>{m.firstName} {m.lastName}</MenuItem>)}
                  </Select>
                </FormControl>
                <FormControl fullWidth disabled={isSaving}>
                  <InputLabel>Mamă</InputLabel>
                  <Select label="Mamă" value={form.motherId} onChange={handleSelectChange('motherId')}>
                    <MenuItem value="">—</MenuItem>
                    {motherOptions.map((m) => <MenuItem key={m.id} value={m.id}>{m.firstName} {m.lastName}</MenuItem>)}
                  </Select>
                </FormControl>
              </Box>

              <Divider><Typography variant="caption" color="text.secondary">PARTENER (opțional)</Typography></Divider>

              {/* Partener + Status (7/5 ≈ 1.4fr / 1fr) */}
              <Box sx={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 2 }}>
                <FormControl fullWidth disabled={isSaving}>
                  <InputLabel>Partener</InputLabel>
                  <Select label="Partener" value={form.partnerId} onChange={handleSelectChange('partnerId')}>
                    <MenuItem value="">—</MenuItem>
                    {members.map((m) => <MenuItem key={m.id} value={m.id}>{m.firstName} {m.lastName}</MenuItem>)}
                  </Select>
                </FormControl>
                <FormControl fullWidth disabled={isSaving}>
                  <InputLabel>Status</InputLabel>
                  <Select label="Status" value={form.partnerStatus} onChange={handleSelectChange('partnerStatus')}>
                    <MenuItem value="MARRIED">Căsătoriți</MenuItem>
                    <MenuItem value="PARTNER">Parteneri</MenuItem>
                    <MenuItem value="DIVORCED">Divorțați</MenuItem>
                    <MenuItem value="WIDOWED">Văduv/ă</MenuItem>
                  </Select>
                </FormControl>
              </Box>

              <Divider><Typography variant="caption" color="text.secondary">COPII (opțional)</Typography></Divider>
              <Typography variant="body2" color="text.secondary" sx={{ mt: -1.5 }}>
                Noul membru va deveni părintele copiilor selectați.
              </Typography>
              <Box sx={{ maxHeight: 160, overflowY: 'auto', bgcolor: 'grey.50', borderRadius: 2, p: 1.5, border: '1px solid', borderColor: 'divider' }}>
                <FormGroup>
                  {members.map((m) => (
                    <FormControlLabel
                      key={m.id}
                      control={<Checkbox checked={childrenIds.includes(m.id)} onChange={() => toggleChild(m.id)} disabled={isSaving} size="small" />}
                      label={`${m.firstName} ${m.lastName}`}
                    />
                  ))}
                </FormGroup>
              </Box>
            </>
          )}

          {error && <Alert severity="error">{error}</Alert>}
        </DialogContent>

        <DialogActions sx={{ p: 2.5 }}>
          <Button onClick={onClose} disabled={isSaving} variant="outlined" color="inherit">Anulează</Button>
          <Button
            type="submit" disabled={isSaving} variant="contained"
            startIcon={isSaving ? <CircularProgress size={16} color="inherit" /> : undefined}
          >
            {isSaving ? 'Se salvează...' : 'Salvează'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default AddMemberModal;