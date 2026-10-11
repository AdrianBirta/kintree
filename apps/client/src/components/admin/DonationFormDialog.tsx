import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Alert, Box, Button, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, FormControl,
  IconButton, InputLabel, MenuItem, Select, TextField, useMediaQuery, useTheme,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { useCreateDonation } from '../../hooks/queries/useAdminQueries';
import { apiErrorMessage } from '../../utils/format';

interface Props {
  open: boolean;
  userId?: string; // dacă lipsește, donația e pentru un donator fără cont (se cere numele)
  onClose: () => void;
}

const today = () => new Date().toISOString().slice(0, 10);

const DonationFormDialog: React.FC<Props> = ({ open, userId, onClose }) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const mutation = useCreateDonation();

  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState('RON');
  const [donatedAt, setDonatedAt] = useState(today());
  const [note, setNote] = useState('');
  const [donorName, setDonorName] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    setAmount('');
    setCurrency('RON');
    setDonatedAt(today());
    setNote('');
    setDonorName('');
    setError('');
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await mutation.mutateAsync({
        userId,
        donorName: userId ? undefined : donorName.trim() || undefined,
        amount: Number(amount),
        currency,
        note: note.trim() || undefined,
        donatedAt: donatedAt ? new Date(donatedAt).toISOString() : undefined,
      });
      onClose();
    } catch (err: any) {
      setError(apiErrorMessage(err, t('admin.form.genericError')));
    }
  };

  const saving = mutation.isPending;

  return (
    <Dialog open={open} onClose={saving ? undefined : onClose} maxWidth="xs" fullWidth fullScreen={isMobile}>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontWeight: 700 }}>
        {t('admin.donation.addTitle')}
        <IconButton onClick={onClose} disabled={saving} size="small"><CloseIcon /></IconButton>
      </DialogTitle>

      <form onSubmit={handleSubmit} autoComplete="off">
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
          {!userId && (
            <TextField
              label={t('admin.donation.donorName')} value={donorName}
              onChange={(e) => setDonorName(e.target.value)} disabled={saving} fullWidth
            />
          )}

          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 110px', gap: 1.5 }}>
            <TextField
              label={t('admin.donation.amount')} type="number" value={amount}
              onChange={(e) => setAmount(e.target.value)} required disabled={saving}
              slotProps={{ htmlInput: { min: 0.01, step: 0.01 } }}
            />
            <FormControl disabled={saving}>
              <InputLabel>{t('admin.donation.currency')}</InputLabel>
              <Select label={t('admin.donation.currency')} value={currency} onChange={(e) => setCurrency(e.target.value)}>
                <MenuItem value="RON">RON</MenuItem>
                <MenuItem value="EUR">EUR</MenuItem>
                <MenuItem value="USD">USD</MenuItem>
              </Select>
            </FormControl>
          </Box>

          <TextField
            label={t('admin.donation.date')} type="date" value={donatedAt}
            onChange={(e) => setDonatedAt(e.target.value)} disabled={saving}
            slotProps={{ inputLabel: { shrink: true } }}
          />
          <TextField
            label={t('admin.donation.note')} value={note} onChange={(e) => setNote(e.target.value)}
            disabled={saving} multiline minRows={2} fullWidth
          />

          {error && <Alert severity="error">{error}</Alert>}
        </DialogContent>

        <DialogActions sx={{ p: 2.5, borderTop: '1px solid', borderColor: 'divider' }}>
          <Button onClick={onClose} disabled={saving} variant="outlined" color="inherit">{t('common.cancel')}</Button>
          <Button
            type="submit" variant="contained" disabled={saving || !amount}
            startIcon={saving ? <CircularProgress size={16} color="inherit" /> : undefined}
          >
            {saving ? t('common.saving') : t('common.save')}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default DonationFormDialog;