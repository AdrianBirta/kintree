import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  Dialog, DialogContent, Button, CircularProgress, Box, Typography, IconButton,
} from '@mui/material';
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded';
import LogoutRoundedIcon from '@mui/icons-material/LogoutRounded';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';

interface Props {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isLoading?: boolean;
  destructive?: boolean;
  icon?: 'warning' | 'logout' | 'none';
  onConfirm: () => void;
  onCancel: () => void;
}

const ConfirmDialog: React.FC<Props> = ({
  open, title, description, confirmLabel, cancelLabel,
  isLoading = false, destructive = true, icon, onConfirm, onCancel,
}) => {
  const { t } = useTranslation();
  const resolvedIcon = icon ?? (destructive ? 'warning' : 'none');
  const resolvedConfirmLabel = confirmLabel ?? t('common.confirm');
  const resolvedCancelLabel = cancelLabel ?? t('common.cancel');

  return (
    <Dialog
      open={open}
      onClose={isLoading ? undefined : onCancel}
      maxWidth="xs"
      fullWidth
      slotProps={{
        paper: {
          sx: {
            borderRadius: 5,
            overflow: 'visible',
            boxShadow: '0 24px 60px -12px rgba(20,10,40,0.28)',
          },
        },
      }}
    >
      <DialogContent sx={{ p: { xs: 3.5, sm: 4.5 }, pt: { xs: 4, sm: 5 } }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 2 }}>

          {resolvedIcon !== 'none' && (
            <Box
              sx={{
                width: 56,
                height: 56,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: resolvedIcon === 'warning'
                  ? 'color-mix(in srgb, var(--color-earbore-danger) 12%, white)'
                  : 'color-mix(in srgb, var(--color-earbore-500) 12%, white)',
                mb: 0.5,
              }}
            >
              {resolvedIcon === 'warning' ? (
                <WarningAmberRoundedIcon sx={{ fontSize: 28, color: 'var(--color-earbore-danger)' }} />
              ) : (
                <LogoutRoundedIcon sx={{ fontSize: 26, color: 'var(--color-earbore-600)' }} />
              )}
            </Box>
          )}

          <Typography sx={{ fontSize: 19, fontWeight: 800, color: 'var(--color-earbore-ink)', lineHeight: 1.3 }}>
            {title}
          </Typography>

          {description && (
            <Typography sx={{ fontSize: 14.5, color: 'var(--color-earbore-gray)', lineHeight: 1.6, maxWidth: 320 }}>
              {description}
            </Typography>
          )}

          <Box sx={{ display: 'flex', gap: 1.25, width: '100%', mt: 1.5 }}>
            <Button
              onClick={onCancel}
              disabled={isLoading}
              fullWidth
              variant="text"
              sx={{
                borderRadius: 3,
                py: 1.2,
                fontWeight: 600,
                color: 'var(--color-earbore-ink)',
                bgcolor: 'var(--color-earbore-grayLight)',
                '&:hover': { bgcolor: 'var(--color-earbore-100)' },
              }}
            >
              {resolvedCancelLabel}
            </Button>
            <Button
              onClick={onConfirm}
              disabled={isLoading}
              fullWidth
              variant="contained"
              disableElevation
              startIcon={isLoading ? <CircularProgress size={15} color="inherit" /> : undefined}
              sx={{
                borderRadius: 3,
                py: 1.2,
                fontWeight: 700,
                bgcolor: destructive ? 'var(--color-earbore-danger)' : 'var(--color-earbore-600)',
                '&:hover': {
                  bgcolor: destructive
                    ? 'color-mix(in srgb, var(--color-earbore-danger) 85%, black)'
                    : 'var(--color-earbore-700)',
                },
              }}
            >
              {isLoading ? t('common.processing') : resolvedConfirmLabel}
            </Button>
          </Box>
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default ConfirmDialog;