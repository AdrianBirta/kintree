import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation, Trans } from 'react-i18next';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, MenuItem,
  Select, InputLabel, FormControl, Avatar, IconButton, Divider, Typography, Alert,
  CircularProgress, Box, Autocomplete, Chip, useMediaQuery, useTheme,
  FormControlLabel, Checkbox,
} from '@mui/material';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import CloseIcon from '@mui/icons-material/Close';
import StarIcon from '@mui/icons-material/Star';
import { useQueryClient } from '@tanstack/react-query';
import { familyMembersService } from '../../api/familyMembersService';
import type { FamilyMember } from '../../types/family';
import { dedupeMembers, memberLabel, renderMemberOption } from '../common/memberOptionUtils';
import { invalidateFamilyData } from '../../hooks/queries/useFamilyMutations';

interface QuickRelation {
  memberId: string;
  kind: 'parent' | 'child';
}

interface Props {
  members: FamilyMember[];
  onClose: () => void;
  onCreated: () => void;
  initialRelation?: QuickRelation | null;
  currentSelfId?: string | null;
}

const AddMemberModal: React.FC<Props> = ({ members, onClose, onCreated, initialRelation, currentSelfId }) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const queryClient = useQueryClient();

  const uniqueMembers = useMemo(() => dedupeMembers(members), [members]);

  const relationTarget = useMemo(
    () => (initialRelation ? uniqueMembers.find((m) => m.id === initialRelation.memberId) ?? null : null),
    [initialRelation, uniqueMembers],
  );

  const currentSelfMember = useMemo(
    () => (currentSelfId ? uniqueMembers.find((m) => m.id === currentSelfId) ?? null : null),
    [currentSelfId, uniqueMembers],
  );

  const [form, setForm] = useState({
    firstName: '', lastName: '', gender: '', birthDate: '',
    partnerStatus: 'MARRIED',
  });

  const [father, setFather] = useState<FamilyMember | null>(null);
  const [mother, setMother] = useState<FamilyMember | null>(null);
  const [partner, setPartner] = useState<FamilyMember | null>(null);
  const [children, setChildren] = useState<FamilyMember[]>([]);

  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  const [markAsMe, setMarkAsMe] = useState(false);

  useEffect(() => {
    if (!relationTarget || !initialRelation) return;
    if (initialRelation.kind === 'child') {
      if (relationTarget.gender === 'FEMALE') setMother(relationTarget);
      else setFather(relationTarget);
    } else {
      setChildren([relationTarget]);
    }
  }, [relationTarget, initialRelation]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSelectChange = (name: string) => (e: any) => {
    setForm({ ...form, [name]: e.target.value });
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

      if (father) await familyMembersService.linkParentChild(father.id, newMember.id);
      if (mother) await familyMembersService.linkParentChild(mother.id, newMember.id);
      if (partner) await familyMembersService.linkPartners(newMember.id, partner.id, form.partnerStatus);
      for (const child of children) await familyMembersService.linkParentChild(newMember.id, child.id);

      if (photoFile) {
        await familyMembersService.uploadPhoto(newMember.id, photoFile);
      }

      if (markAsMe) {
        await familyMembersService.markAsMe(newMember.id);
      }

      const touchedIds = [
        newMember.id,
        father?.id,
        mother?.id,
        partner?.id,
        ...children.map((c) => c.id),
      ].filter((v): v is string => !!v);
      invalidateFamilyData(queryClient, touchedIds);

      onCreated();
    } catch (err: any) {
      setError(err.response?.data?.message || t('addMember.genericError'));
    } finally {
      setIsSaving(false);
    }
  };

  const fatherOptions = uniqueMembers.filter((m) => m.gender !== 'FEMALE');
  const motherOptions = uniqueMembers.filter((m) => m.gender !== 'MALE');

  return (
    <Dialog
      open
      onClose={isSaving ? undefined : onClose}
      maxWidth="md"
      fullWidth
      fullScreen={isMobile}
      slotProps={{ paper: { sx: { borderRadius: isMobile ? 0 : 2, width: { md: 760 } } } }}
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontWeight: 700, borderBottom: '1px solid', borderColor: 'divider' }}>
        {t('addMember.title')}
        <IconButton onClick={onClose} disabled={isSaving} size="small"><CloseIcon /></IconButton>
      </DialogTitle>

      <form onSubmit={handleSubmit} autoComplete="off">
        <DialogContent sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '220px 1fr' }, gap: 3, py: 3 }}>

          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1.5, pt: 1 }}>
            <Box sx={{ position: 'relative' }}>
              <Avatar
                src={photoPreview ?? undefined}
                variant="rounded"
                sx={{ width: { xs: 120, sm: 160 }, height: { xs: 120, sm: 160 }, borderRadius: 2, bgcolor: 'primary.light', fontSize: 40 }}
              >
                {form.firstName ? form.firstName[0] : '?'}
              </Avatar>
              <IconButton
                component="label"
                size="small"
                disabled={isSaving}
                sx={{
                  position: 'absolute', bottom: -6, right: -6, bgcolor: 'primary.main', color: 'white',
                  '&:hover': { bgcolor: 'primary.dark' },
                }}
              >
                <PhotoCameraIcon fontSize="small" />
                <input hidden type="file" accept="image/*" onChange={handlePhotoSelect} />
              </IconButton>
            </Box>
            <Typography variant="caption" color="text.secondary" sx={{ textAlign: 'center' }}>
              {t('addMember.photoOptional')}
            </Typography>

            {relationTarget && (
              <Chip
                size="small"
                color="primary"
                variant="outlined"
                label={
                  initialRelation?.kind === 'child'
                    ? t('addMember.childFor', { name: memberLabel(relationTarget) })
                    : t('addMember.parentFor', { name: memberLabel(relationTarget) })
                }
                sx={{ mt: 1 }}
              />
            )}
          </Box>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            <Typography variant="overline" color="text.secondary">{t('addMember.identity')}</Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
              <TextField
                size="small" label={t('addMember.firstName')} name="firstName" autoComplete="given-name"
                value={form.firstName} onChange={handleChange} required fullWidth disabled={isSaving}
              />
              <TextField
                size="small" label={t('addMember.lastName')} name="lastName" autoComplete="family-name"
                value={form.lastName} onChange={handleChange} required fullWidth disabled={isSaving}
              />
            </Box>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
              <FormControl size="small" fullWidth disabled={isSaving}>
                <InputLabel>{t('addMember.gender')}</InputLabel>
                <Select label={t('addMember.gender')} value={form.gender} onChange={handleSelectChange('gender')}>
                  <MenuItem value="">{t('common.unspecified')}</MenuItem>
                  <MenuItem value="MALE">{t('common.genders.male')}</MenuItem>
                  <MenuItem value="FEMALE">{t('common.genders.female')}</MenuItem>
                  <MenuItem value="OTHER">{t('common.genders.other')}</MenuItem>
                </Select>
              </FormControl>
              <TextField
                size="small" label={t('addMember.birthDate')} type="date" name="birthDate" autoComplete="bday"
                value={form.birthDate} onChange={handleChange}
                fullWidth disabled={isSaving} slotProps={{ inputLabel: { shrink: true } }}
              />
            </Box>

            <Divider sx={{ mt: 1 }} />
            <Box>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={markAsMe}
                    onChange={(e) => setMarkAsMe(e.target.checked)}
                    disabled={isSaving}
                    icon={<StarIcon sx={{ opacity: 0.35 }} />}
                    checkedIcon={<StarIcon color="primary" />}
                  />
                }
                label={t('addMember.isMe')}
              />
              {markAsMe && currentSelfMember && (
                <Alert severity="warning" sx={{ mt: 1 }}>
                  <Trans
                    i18nKey="addMember.alreadyMarkedWarning"
                    values={{ name: memberLabel(currentSelfMember) }}
                    components={{ strong: <strong /> }}
                  />
                </Alert>
              )}
            </Box>

            {uniqueMembers.length > 0 && (
              <>
                <Divider sx={{ mt: 1 }} />
                <Typography variant="overline" color="text.secondary">{t('addMember.relations')}</Typography>

                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
                  <Autocomplete
                    size="small"
                    fullWidth
                    options={fatherOptions}
                    getOptionLabel={memberLabel}
                    getOptionKey={(option) => option.id}
                    renderOption={renderMemberOption}
                    value={father}
                    onChange={(_, val) => setFather(val)}
                    disabled={isSaving}
                    isOptionEqualToValue={(a, b) => a.id === b.id}
                    renderInput={(params) => <TextField {...params} size="small" label={t('addMember.father')} placeholder={t('addMember.searchPlaceholder')} autoComplete="off" />}
                  />
                  <Autocomplete
                    size="small"
                    fullWidth
                    options={motherOptions}
                    getOptionLabel={memberLabel}
                    getOptionKey={(option) => option.id}
                    renderOption={renderMemberOption}
                    value={mother}
                    onChange={(_, val) => setMother(val)}
                    disabled={isSaving}
                    isOptionEqualToValue={(a, b) => a.id === b.id}
                    renderInput={(params) => <TextField {...params} size="small" label={t('addMember.mother')} placeholder={t('addMember.searchPlaceholder')} autoComplete="off" />}
                  />
                </Box>

                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
                  <Autocomplete
                    size="small"
                    fullWidth
                    options={uniqueMembers}
                    getOptionLabel={memberLabel}
                    getOptionKey={(option) => option.id}
                    renderOption={renderMemberOption}
                    value={partner}
                    onChange={(_, val) => setPartner(val)}
                    disabled={isSaving}
                    isOptionEqualToValue={(a, b) => a.id === b.id}
                    renderInput={(params) => <TextField {...params} size="small" label={t('addMember.partner')} placeholder={t('addMember.searchPlaceholder')} autoComplete="off" />}
                  />
                  <FormControl size="small" fullWidth disabled={isSaving}>
                    <InputLabel>{t('addMember.status')}</InputLabel>
                    <Select label={t('addMember.status')} value={form.partnerStatus} onChange={handleSelectChange('partnerStatus')}>
                      <MenuItem value="MARRIED">{t('common.partnerStatus.married')}</MenuItem>
                      <MenuItem value="PARTNER">{t('common.partnerStatus.partner')}</MenuItem>
                      <MenuItem value="DIVORCED">{t('common.partnerStatus.divorced')}</MenuItem>
                      <MenuItem value="WIDOWED">{t('common.partnerStatus.widowed')}</MenuItem>
                    </Select>
                  </FormControl>
                </Box>

                <Autocomplete
                  size="small"
                  fullWidth
                  multiple
                  options={uniqueMembers}
                  getOptionLabel={memberLabel}
                  getOptionKey={(option) => option.id}
                  renderOption={renderMemberOption}
                  value={children}
                  onChange={(_, val) => setChildren(val)}
                  disabled={isSaving}
                  isOptionEqualToValue={(a, b) => a.id === b.id}
                  renderInput={(params) => (
                    <TextField {...params} size="small" label={t('addMember.children')} placeholder={t('addMember.childrenPlaceholder')} autoComplete="off" />
                  )}
                />
                <Typography variant="caption" color="text.secondary" sx={{ mt: -1.5 }}>
                  {t('addMember.childrenHint')}
                </Typography>
              </>
            )}

            {error && <Alert severity="error">{error}</Alert>}
          </Box>
        </DialogContent>

        <DialogActions sx={{ p: 2.5, borderTop: '1px solid', borderColor: 'divider' }}>
          <Button onClick={onClose} disabled={isSaving} variant="outlined" color="inherit" sx={{ borderRadius: 1.5 }}>{t('common.cancel')}</Button>
          <Button
            type="submit" disabled={isSaving} variant="contained" sx={{ borderRadius: 1.5 }}
            startIcon={isSaving ? <CircularProgress size={16} color="inherit" /> : undefined}
          >
            {isSaving ? t('common.saving') : t('common.save')}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default AddMemberModal;