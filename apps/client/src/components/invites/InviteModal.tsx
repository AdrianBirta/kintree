import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQueryClient, useMutation, useQuery } from '@tanstack/react-query';
import {
  Dialog, DialogTitle, DialogContent, IconButton, Box, TextField, Button, List,
  ListItem, ListItemText, Chip, Divider, Typography, CircularProgress, Tooltip,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import DeleteIcon from '@mui/icons-material/Delete';
import { invitesService } from '../../api/invitesService';

interface Props {
  open: boolean;
  onClose: () => void;
}

const inviteKeys = { list: ['invites'] as const };

const InviteModal: React.FC<Props> = ({ open, onClose }) => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [email, setEmail] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const { data: invites = [], isLoading } = useQuery({
    queryKey: inviteKeys.list,
    queryFn: invitesService.list,
    enabled: open,
  });

  const createMutation = useMutation({
    mutationFn: invitesService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: inviteKeys.list });
      setEmail('');
    },
  });

  const removeMutation = useMutation({
    mutationFn: invitesService.remove,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: inviteKeys.list }),
  });

  const buildInviteUrl = (token: string) => `${window.location.origin}/auth?mode=register&invite=${token}`;

  const handleCopy = async (invite: { id: string; token: string }) => {
    try {
      await navigator.clipboard.writeText(buildInviteUrl(invite.token));
      setCopiedId(invite.id);
      setTimeout(() => setCopiedId((prev) => (prev === invite.id ? null : prev)), 1500);
    } catch { /* ignorăm */ }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontWeight: 700 }}>
        {t('invites.title')}
        <IconButton onClick={onClose} size="small"><CloseIcon /></IconButton>
      </DialogTitle>
      <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 3 }}>
        <Typography variant="body2" color="text.secondary">{t('invites.description')}</Typography>

        <Box sx={{ display: 'flex', gap: 1 }}>
          <TextField
            size="small" fullWidth placeholder={t('invites.emailOptionalPlaceholder')}
            value={email} onChange={(e) => setEmail(e.target.value)}
          />
          <Button variant="contained" onClick={() => createMutation.mutate({ email: email || undefined })} disabled={createMutation.isPending}>
            {t('invites.generate')}
          </Button>
        </Box>

        <Divider />

        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}><CircularProgress size={24} /></Box>
        ) : invites.length === 0 ? (
          <Typography variant="body2" color="text.secondary">{t('invites.none')}</Typography>
        ) : (
          <List disablePadding>
            {invites.map((invite) => (
              <ListItem key={invite.id} divider sx={{ px: 0 }}>
                <ListItemText
                  primary={invite.usedByUser ? `${invite.usedByUser.firstName} ${invite.usedByUser.lastName}` : (invite.email || t('invites.anonymousInvite'))}
                  secondary={invite.usedAt ? t('invites.statusUsed') : t('invites.statusPending')}
                />
                {invite.usedAt ? (
                  <Chip size="small" label={t('invites.statusUsed')} />
                ) : (
                  <Box sx={{ display: 'flex', gap: 0.5 }}>
                    <Tooltip title={copiedId === invite.id ? t('sharing.copied') : t('sharing.copyLink')}>
                      <IconButton size="small" onClick={() => handleCopy(invite)}><ContentCopyIcon fontSize="small" /></IconButton>
                    </Tooltip>
                    <Tooltip title={t('common.delete')}>
                      <IconButton size="small" onClick={() => removeMutation.mutate(invite.id)}><DeleteIcon fontSize="small" /></IconButton>
                    </Tooltip>
                  </Box>
                )}
              </ListItem>
            ))}
          </List>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default InviteModal;