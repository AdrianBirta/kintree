import React from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions,
  Button, CircularProgress,
} from '@mui/material';

interface Props {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isLoading?: boolean;
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

const ConfirmDialog: React.FC<Props> = ({
  open, title, description, confirmLabel = 'Confirmă', cancelLabel = 'Anulează',
  isLoading = false, destructive = true, onConfirm, onCancel,
}) => {
  return (
    <Dialog
      open={open}
      onClose={isLoading ? undefined : onCancel}
      maxWidth="xs"
      fullWidth
      slotProps={{ paper: { sx: { borderRadius: 4 } } }}
    >
      <DialogTitle sx={{ fontWeight: 700 }}>{title}</DialogTitle>
      {description && (
        <DialogContent>
          <DialogContentText>{description}</DialogContentText>
        </DialogContent>
      )}
      <DialogActions sx={{ p: 3, pt: description ? 0 : 3 }}>
        <Button onClick={onCancel} disabled={isLoading} variant="outlined" color="inherit" sx={{ borderRadius: 3 }}>
          {cancelLabel}
        </Button>
        <Button
          onClick={onConfirm}
          disabled={isLoading}
          variant="contained"
          color={destructive ? 'error' : 'primary'}
          sx={{ borderRadius: 3 }}
          startIcon={isLoading ? <CircularProgress size={16} color="inherit" /> : undefined}
        >
          {isLoading ? 'Se procesează...' : confirmLabel}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ConfirmDialog;