import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Alert, Button, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, FormControlLabel,
  IconButton, Switch, TextField, Typography, useMediaQuery, useTheme,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { useCreateAdminUser, useUpdateAdminUser } from '../../hooks/queries/useAdminQueries';
import { apiErrorMessage } from '../../utils/format';

export interface EditableUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  disabled: boolean;
  role: 'USER' | 'ADMIN';
}

interface Props {
  open: boolean;
  mode: 'create' | 'edit';
  user?: EditableUser | null;
  onClose: () => void;
}

const EMPTY = { firstName: '', lastName: '', email: '', password: '', disabled: false };

const UserFormDialog: React.FC<Props> = ({ open, mode, user, onClose }) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const createMutation = useCreateAdminUser();
  const updateMutation = useUpdateAdminUser();
  const isSaving = createMutation.isPending || updateMutation.isPending;

  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    setError('');
    setForm(
      mode === 'edit' && user
        ? { firstName: user.firstName, lastName: user.lastName, email: user.email, password: '', disabled: user.disabled }
        : EMPTY,
    );
  }, [open, mode, user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      if (mode === 'create') {
        await createMutation.mutateAsync({
          email: form.email.trim(),
          password: form.password,
          firstName: form.firstName.trim(),
          lastName: form.lastName.trim(),
        });
      } else if (user) {
        await updateMutation.mutateAsync({
          id: user.id,
          data: {
            email: form.email.trim(),
            firstName: form.firstName.trim(),
            lastName: form.lastName.trim(),
            ...(form.password ? { password: form.password } : {}),
            // adminul nu poate fi dezactivat
            ...(user.role === 'ADMIN' ? {} : { disabled: form.disabled }),
          },
        });
      }
      onClose();
    } catch (err: any) {
      setError(apiErrorMessage(err, t('admin.form.genericError')));
    }
  };

  return (
    <Dialog
      open={open}
      onClose={isSaving ? undefined : onClose}
      maxWidth="sm"
      fullWidth
      fullScreen={isMobile}
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontWeight: 700 }}>
        {mode === 'create' ? t('admin.form.createTitle') : t('admin.form.editTitle')}
        <IconButton onClick={onClose} disabled={isSaving} size="small"><CloseIcon /></IconButton>
      </DialogTitle>

      <form onSubmit={handleSubmit} autoComplete="off">
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
          <TextField
            label={t('admin.form.firstName')} name="firstName" value={form.firstName}
            onChange={handleChange} required disabled={isSaving} fullWidth
          />
          <TextField
            label={t('admin.form.lastName')} name="lastName" value={form.lastName}
            onChange={handleChange} required disabled={isSaving} fullWidth
          />
          <TextField
            label={t('admin.form.email')} name="email" type="email" value={form.email}
            onChange={handleChange} required disabled={isSaving} fullWidth
          />
          <TextField
            label={t('admin.form.password')} name="password" type="password" value={form.password}
            onChange={handleChange} required={mode === 'create'} disabled={isSaving} fullWidth
            autoComplete="new-password"
            slotProps={{ htmlInput: { minLength: 8, maxLength: 72 } }}
            helperText={mode === 'edit' ? t('admin.form.passwordHintEdit') : t('admin.form.passwordHintCreate')}
          />

          {mode === 'edit' && user?.role !== 'ADMIN' && (
            <FormControlLabel
              control={
                <Switch
                  checked={form.disabled}
                  onChange={(e) => setForm((prev) => ({ ...prev, disabled: e.target.checked }))}
                  disabled={isSaving}
                  color="error"
                />
              }
              label={
                <>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>{t('admin.form.disabledLabel')}</Typography>
                  <Typography variant="caption" color="text.secondary">{t('admin.form.disabledHint')}</Typography>
                </>
              }
            />
          )}

          {error && <Alert severity="error">{error}</Alert>}
        </DialogContent>

        <DialogActions sx={{ p: 2.5, borderTop: '1px solid', borderColor: 'divider' }}>
          <Button onClick={onClose} disabled={isSaving} variant="outlined" color="inherit">{t('common.cancel')}</Button>
          <Button
            type="submit" variant="contained" disabled={isSaving}
            startIcon={isSaving ? <CircularProgress size={16} color="inherit" /> : undefined}
          >
            {isSaving ? t('common.saving') : mode === 'create' ? t('admin.form.create') : t('common.save')}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default UserFormDialog;