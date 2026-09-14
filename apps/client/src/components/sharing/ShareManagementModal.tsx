import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQueryClient, useMutation, useQuery } from '@tanstack/react-query';
import {
  Dialog, DialogTitle, DialogContent, IconButton, Tabs, Tab, Box, Button, TextField,
  FormControl, InputLabel, Select, MenuItem, Typography, Chip, CircularProgress,
  List, ListItem, ListItemText, Divider, Alert, Tooltip, ToggleButtonGroup, ToggleButton,
  Collapse, useMediaQuery, useTheme,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import DeleteIcon from '@mui/icons-material/Delete';
import BlockIcon from '@mui/icons-material/Block';
import LinkIcon from '@mui/icons-material/Link';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import PersonAddAltIcon from '@mui/icons-material/PersonAddAlt';
import { sharingService } from '../../api/sharingService';
import type { ShareAccessLevel, ShareLink, TreeAccessGrant } from '../../types/sharing';

interface Props {
  open: boolean;
  onClose: () => void;
}

const sharingKeys = {
  links: ['sharing', 'links'] as const,
  given: ['sharing', 'accounts', 'given'] as const,
};

type MemberLimitPreset = '1' | '2' | '3' | 'custom' | 'unlimited';

function formatDateTime(value?: string | null) {
  if (!value) return null;
  return new Date(value).toLocaleString();
}

function isExpired(value?: string | null) {
  return !!value && new Date(value).getTime() < Date.now();
}

const ShareManagementModal: React.FC<Props> = ({ open, onClose }) => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [tab, setTab] = useState<'links' | 'accounts'>('links');

  const [linkAccessLevel, setLinkAccessLevel] = useState<ShareAccessLevel>('READ_ONLY');
  const [linkExpiresAt, setLinkExpiresAt] = useState('');
  const [linkMaxUses, setLinkMaxUses] = useState('');
  const [linkLabel, setLinkLabel] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [expandedGuestsFor, setExpandedGuestsFor] = useState<string | null>(null);

  const [memberLimitPreset, setMemberLimitPreset] = useState<MemberLimitPreset>('unlimited');
  const [memberLimitCustomValue, setMemberLimitCustomValue] = useState('');

  const [grantEmail, setGrantEmail] = useState('');
  const [grantAccessLevel, setGrantAccessLevel] = useState<ShareAccessLevel>('READ_ONLY');
  const [grantExpiresAt, setGrantExpiresAt] = useState('');
  const [grantError, setGrantError] = useState('');

  const { data: links = [], isLoading: isLoadingLinks } = useQuery({
    queryKey: sharingKeys.links,
    queryFn: sharingService.listLinks,
    enabled: open,
  });

  const { data: given = [], isLoading: isLoadingGiven } = useQuery({
    queryKey: sharingKeys.given,
    queryFn: sharingService.listGiven,
    enabled: open,
  });

  const createLinkMutation = useMutation({
    mutationFn: sharingService.createLink,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: sharingKeys.links });
      setLinkExpiresAt('');
      setLinkMaxUses('');
      setLinkLabel('');
      setMemberLimitPreset('unlimited');
      setMemberLimitCustomValue('');
    },
  });

  const revokeLinkMutation = useMutation({
    mutationFn: sharingService.revokeLink,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: sharingKeys.links }),
  });

  const deleteLinkMutation = useMutation({
    mutationFn: sharingService.deleteLink,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: sharingKeys.links }),
  });

  const grantAccessMutation = useMutation({
    mutationFn: sharingService.grantAccountAccess,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: sharingKeys.given });
      setGrantEmail('');
      setGrantExpiresAt('');
      setGrantError('');
    },
    onError: (err: any) => {
      setGrantError(err.response?.data?.message || t('sharing.genericError'));
    },
  });

  const revokeAccessMutation = useMutation({
    mutationFn: sharingService.revokeAccountAccess,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: sharingKeys.given }),
  });

  const resolveMaxMembersPerGuest = (): number | undefined => {
    if (memberLimitPreset === 'unlimited') return undefined;
    if (memberLimitPreset === 'custom') {
      const parsed = Number(memberLimitCustomValue);
      return Number.isFinite(parsed) && parsed >= 1 ? parsed : undefined;
    }
    return Number(memberLimitPreset);
  };

  const handleCreateLink = () => {
    createLinkMutation.mutate({
      accessLevel: linkAccessLevel,
      expiresAt: linkExpiresAt || undefined,
      maxUses: linkMaxUses ? Number(linkMaxUses) : undefined,
      maxMembersPerGuest: linkAccessLevel === 'EDIT' ? resolveMaxMembersPerGuest() : undefined,
      label: linkLabel || undefined,
    });
  };

  const handleGrantAccess = () => {
    if (!grantEmail.trim()) return;
    setGrantError('');
    grantAccessMutation.mutate({
      email: grantEmail.trim(),
      accessLevel: grantAccessLevel,
      expiresAt: grantExpiresAt || undefined,
    });
  };

  const buildShareUrl = (token: string) => `${window.location.origin}/share/${token}`;

  const handleCopy = async (link: ShareLink) => {
    try {
      await navigator.clipboard.writeText(buildShareUrl(link.token));
      setCopiedId(link.id);
      setTimeout(() => setCopiedId((prev) => (prev === link.id ? null : prev)), 1500);
    } catch {
      // clipboard indisponibil — ignorăm silențios
    }
  };

  const renderLinkStatus = (link: ShareLink) => {
    if (link.revoked) return <Chip size="small" label={t('sharing.statusRevoked')} color="default" />;
    if (isExpired(link.expiresAt)) return <Chip size="small" label={t('sharing.statusExpired')} color="default" />;
    if (link.maxUses != null && link.usesCount >= link.maxUses) {
      return <Chip size="small" label={t('sharing.statusFull')} color="default" />;
    }
    return <Chip size="small" label={t('sharing.statusActive')} color="success" />;
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      fullScreen={isMobile}
      slotProps={{
        paper: {
          sx: isMobile ? { borderRadius: 0, m: 0 } : undefined,
        },
      }}
    >
      <DialogTitle
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontWeight: 700,
          px: { xs: 2, sm: 3 },
          py: { xs: 1.75, sm: 2 },
        }}
      >
        {t('sharing.title')}
        <IconButton onClick={onClose} size="small"><CloseIcon /></IconButton>
      </DialogTitle>

      <Tabs
        value={tab}
        onChange={(_, v) => setTab(v)}
        variant={isMobile ? 'fullWidth' : 'standard'}
        sx={{ px: { xs: 1, sm: 2 }, borderBottom: '1px solid', borderColor: 'divider' }}
      >
        <Tab value="links" label={t('sharing.tabLinks')} icon={<LinkIcon fontSize="small" />} iconPosition="start" />
        <Tab value="accounts" label={t('sharing.tabAccounts')} />
      </Tabs>

      <DialogContent sx={{ pt: 3, px: { xs: 2, sm: 3 }, pb: { xs: 3, sm: 3 } }}>
        {tab === 'links' && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>{t('sharing.newLinkTitle')}</Typography>

              <TextField
                size="small"
                label={t('sharing.labelOptional')}
                value={linkLabel}
                onChange={(e) => setLinkLabel(e.target.value)}
                placeholder={t('sharing.labelPlaceholder')}
                fullWidth
              />

              <FormControl size="small" fullWidth>
                <InputLabel>{t('sharing.accessLevel')}</InputLabel>
                <Select
                  label={t('sharing.accessLevel')}
                  value={linkAccessLevel}
                  onChange={(e) => setLinkAccessLevel(e.target.value as ShareAccessLevel)}
                >
                  <MenuItem value="READ_ONLY">{t('sharing.readOnly')}</MenuItem>
                  <MenuItem value="EDIT">{t('sharing.editAccess')}</MenuItem>
                </Select>
              </FormControl>

              <TextField
                size="small"
                type="datetime-local"
                label={t('sharing.expiresAtOptional')}
                value={linkExpiresAt}
                onChange={(e) => setLinkExpiresAt(e.target.value)}
                slotProps={{ inputLabel: { shrink: true } }}
                fullWidth
              />

              <TextField
                size="small"
                type="number"
                label={t('sharing.maxUsesOptional')}
                value={linkMaxUses}
                onChange={(e) => setLinkMaxUses(e.target.value)}
                helperText={t('sharing.maxUsesHelper')}
                slotProps={{ htmlInput: { min: 1 } }}
                fullWidth
              />

              {linkAccessLevel === 'EDIT' && (
                <Box>
                  <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary', display: 'block', mb: 0.75 }}>
                    {t('sharing.maxMembersPerGuestLabel')}
                  </Typography>
                  <ToggleButtonGroup
                    size="small"
                    value={memberLimitPreset}
                    exclusive
                    onChange={(_, val) => val && setMemberLimitPreset(val)}
                    sx={{
                      flexWrap: 'wrap',
                      gap: 0.5,
                      '& .MuiToggleButton-root': {
                        textTransform: 'none',
                        px: 1.5,
                        py: 0.5,
                        fontSize: { xs: 12.5, sm: 13 },
                        border: '1px solid var(--color-earbore-border) !important',
                        borderRadius: '8px !important',
                      },
                    }}
                  >
                    <ToggleButton value="1">1</ToggleButton>
                    <ToggleButton value="2">2</ToggleButton>
                    <ToggleButton value="3">3</ToggleButton>
                    <ToggleButton value="custom">{t('sharing.customValue')}</ToggleButton>
                    <ToggleButton value="unlimited">{t('sharing.unlimited')}</ToggleButton>
                  </ToggleButtonGroup>

                  <Collapse in={memberLimitPreset === 'custom'}>
                    <TextField
                      size="small"
                      type="number"
                      label={t('sharing.customValueLabel')}
                      value={memberLimitCustomValue}
                      onChange={(e) => setMemberLimitCustomValue(e.target.value)}
                      slotProps={{ htmlInput: { min: 1 } }}
                      sx={{ mt: 1.25 }}
                      fullWidth
                    />
                  </Collapse>

                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.75 }}>
                    {t('sharing.maxMembersPerGuestHelper')}
                  </Typography>
                </Box>
              )}

              <Button
                variant="contained"
                onClick={handleCreateLink}
                fullWidth={isMobile}
                disabled={
                  createLinkMutation.isPending ||
                  (linkAccessLevel === 'EDIT' && memberLimitPreset === 'custom' && !memberLimitCustomValue)
                }
              >
                {createLinkMutation.isPending ? t('common.saving') : t('sharing.createLink')}
              </Button>
            </Box>

            <Divider />

            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>{t('sharing.existingLinks')}</Typography>

              {isLoadingLinks ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}><CircularProgress size={24} /></Box>
              ) : links.length === 0 ? (
                <Typography variant="body2" color="text.secondary">{t('sharing.noLinks')}</Typography>
              ) : (
                <List disablePadding>
                  {links.map((link) => (
                    <ListItem
                      key={link.id}
                      divider
                      sx={{ px: 0, flexDirection: 'column', alignItems: 'stretch', gap: 0.75, py: 1.5 }}
                    >
                      <Box
                        sx={{
                          display: 'flex',
                          flexDirection: { xs: 'column', sm: 'row' },
                          alignItems: { xs: 'flex-start', sm: 'center' },
                          justifyContent: 'space-between',
                          gap: 0.75,
                        }}
                      >
                        <ListItemText
                          sx={{ m: 0 }}
                          primary={link.label || (link.accessLevel === 'EDIT' ? t('sharing.editAccess') : t('sharing.readOnly'))}
                          secondary={
                            <>
                              {t(link.accessLevel === 'EDIT' ? 'sharing.editAccess' : 'sharing.readOnly')}
                              {link.expiresAt && ` · ${t('sharing.expiresOn', { date: formatDateTime(link.expiresAt) })}`}
                              {link.maxUses != null &&
                                ` · ${t('sharing.usageCount', { used: link.usesCount, max: link.maxUses })}`}
                              {link.accessLevel === 'EDIT' &&
                                ` · ${link.maxMembersPerGuest != null
                                  ? t('sharing.maxMembersPerGuestSummary', { max: link.maxMembersPerGuest })
                                  : t('sharing.unlimitedMembersSummary')}`}
                            </>
                          }
                        />
                        {renderLinkStatus(link)}
                      </Box>

                      <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center', flexWrap: 'wrap' }}>
                        <Tooltip title={copiedId === link.id ? t('sharing.copied') : t('sharing.copyLink')}>
                          <IconButton size="small" onClick={() => handleCopy(link)}>
                            <ContentCopyIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        {!link.revoked && (
                          <Tooltip title={t('sharing.revoke')}>
                            <IconButton size="small" onClick={() => revokeLinkMutation.mutate(link.id)}>
                              <BlockIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                        <Tooltip title={t('common.delete')}>
                          <IconButton size="small" onClick={() => deleteLinkMutation.mutate(link.id)}>
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>

                        {link.guests.length > 0 && (
                          <Tooltip title={t('sharing.viewGuests')}>
                            <IconButton
                              size="small"
                              onClick={() => setExpandedGuestsFor((prev) => (prev === link.id ? null : link.id))}
                            >
                              {expandedGuestsFor === link.id ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
                            </IconButton>
                          </Tooltip>
                        )}
                      </Box>

                      <Collapse in={expandedGuestsFor === link.id}>
                        <Box sx={{ pl: 1, borderLeft: '2px solid', borderColor: 'divider', ml: 0.5, mt: 0.5 }}>
                          {link.guests.map((guest) => (
                            <Box key={guest.id} sx={{ display: 'flex', alignItems: 'center', gap: 0.75, py: 0.5 }}>
                              <PersonAddAltIcon sx={{ fontSize: 15, color: 'text.secondary' }} />
                              <Typography variant="caption" color="text.secondary">
                                {guest.displayName || t('sharing.anonymousGuest')} —{' '}
                                {link.accessLevel === 'EDIT'
                                  ? t('sharing.guestMembersAdded', {
                                    count: guest.membersAddedCount,
                                    max: link.maxMembersPerGuest ?? '∞',
                                  })
                                  : t('sharing.guestViewedOnly')}
                              </Typography>
                            </Box>
                          ))}
                        </Box>
                      </Collapse>
                    </ListItem>
                  ))}
                </List>
              )}
            </Box>
          </Box>
        )}

        {tab === 'accounts' && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>{t('sharing.grantAccessTitle')}</Typography>
              <TextField
                size="small"
                label={t('sharing.granteeEmail')}
                value={grantEmail}
                onChange={(e) => setGrantEmail(e.target.value)}
                placeholder="nume@email.com"
                fullWidth
              />
              <FormControl size="small" fullWidth>
                <InputLabel>{t('sharing.accessLevel')}</InputLabel>
                <Select
                  label={t('sharing.accessLevel')}
                  value={grantAccessLevel}
                  onChange={(e) => setGrantAccessLevel(e.target.value as ShareAccessLevel)}
                >
                  <MenuItem value="READ_ONLY">{t('sharing.readOnly')}</MenuItem>
                  <MenuItem value="EDIT">{t('sharing.editAccess')}</MenuItem>
                </Select>
              </FormControl>
              <TextField
                size="small"
                type="datetime-local"
                label={t('sharing.expiresAtOptional')}
                value={grantExpiresAt}
                onChange={(e) => setGrantExpiresAt(e.target.value)}
                slotProps={{ inputLabel: { shrink: true } }}
                fullWidth
              />
              {grantError && <Alert severity="error">{grantError}</Alert>}
              <Button
                variant="contained"
                onClick={handleGrantAccess}
                fullWidth={isMobile}
                disabled={grantAccessMutation.isPending}
              >
                {grantAccessMutation.isPending ? t('common.saving') : t('sharing.grantAccess')}
              </Button>
            </Box>

            <Divider />

            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>{t('sharing.givenAccessTitle')}</Typography>
              {isLoadingGiven ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}><CircularProgress size={24} /></Box>
              ) : given.length === 0 ? (
                <Typography variant="body2" color="text.secondary">{t('sharing.noGivenAccess')}</Typography>
              ) : (
                <List disablePadding>
                  {given.map((grant: TreeAccessGrant) => (
                    <ListItem
                      key={grant.id}
                      divider
                      sx={{
                        px: 0,
                        flexDirection: { xs: 'column', sm: 'row' },
                        alignItems: { xs: 'flex-start', sm: 'center' },
                        gap: 0.75,
                      }}
                    >
                      <ListItemText
                        sx={{ m: 0 }}
                        primary={`${grant.grantee?.firstName} ${grant.grantee?.lastName}`}
                        secondary={
                          <>
                            {grant.grantee?.email} · {t(grant.accessLevel === 'EDIT' ? 'sharing.editAccess' : 'sharing.readOnly')}
                            {grant.expiresAt && ` · ${t('sharing.expiresOn', { date: formatDateTime(grant.expiresAt) })}`}
                          </>
                        }
                      />
                      {grant.revoked ? (
                        <Chip size="small" label={t('sharing.statusRevoked')} />
                      ) : (
                        <Tooltip title={t('sharing.revoke')}>
                          <IconButton size="small" onClick={() => revokeAccessMutation.mutate(grant.id)}>
                            <BlockIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                    </ListItem>
                  ))}
                </List>
              )}
            </Box>
          </Box>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ShareManagementModal;