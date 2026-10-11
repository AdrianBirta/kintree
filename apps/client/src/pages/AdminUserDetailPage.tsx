import React, { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Alert, Avatar, Box, Button, Chip, IconButton, InputAdornment, List, ListItem, ListItemAvatar, ListItemText,
  Paper, Tab, Tabs, TextField, Tooltip, Typography,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import EditIcon from '@mui/icons-material/Edit';
import BlockIcon from '@mui/icons-material/Block';
import ChatBubble from '@mui/icons-material/ChatBubble';
import DeleteIcon from '@mui/icons-material/Delete';
import LogoutIcon from '@mui/icons-material/Logout';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import FavoriteIcon from '@mui/icons-material/Favorite';
import Header from '../components/layout/Header';
import BrandedLoader from '../components/common/BrandedLoader';
import ConfirmDialog from '../components/common/ConfirmDialog';
import UserFormDialog from '../components/admin/UserFormDialog';
import DonationFormDialog from '../components/admin/DonationFormDialog';
import {
  useAdminUser, useDeleteAdminMember, useDeleteAdminUser, useDeleteDonation, useRevokeAdminSessions,
  useUpdateAdminUser,
} from '../hooks/queries/useAdminQueries';
import { formatDate, formatDateTime, formatMoney, fullName, initialsOf } from '../utils/format';

type TabKey = 'overview' | 'members' | 'sharing' | 'donations';

type ConfirmState =
  | { kind: 'user' }
  | { kind: 'sessions' }
  | { kind: 'member'; id: string; name: string }
  | { kind: 'donation'; id: string }
  | null;

const MiniStat: React.FC<{ label: string; value: number | string }> = ({ label, value }) => (
  <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 2.5, textAlign: 'center' }}>
    <Typography sx={{ fontWeight: 800, fontSize: 22, color: 'var(--color-earbore-700)', lineHeight: 1.1 }}>{value}</Typography>
    <Typography variant="caption" color="text.secondary">{label}</Typography>
  </Paper>
);

const InfoRow: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
  <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, py: 1, borderBottom: '1px solid var(--color-earbore-border)' }}>
    <Typography variant="body2" color="text.secondary">{label}</Typography>
    <Typography variant="body2" sx={{ fontWeight: 600, textAlign: 'right', wordBreak: 'break-word' }}>{value}</Typography>
  </Box>
);

const AdminUserDetailPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const lang = i18n.language?.slice(0, 2) || 'en';
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data, isLoading, isError } = useAdminUser(id);
  const updateMutation = useUpdateAdminUser();
  const deleteUserMutation = useDeleteAdminUser();
  const revokeMutation = useRevokeAdminSessions();
  const deleteMemberMutation = useDeleteAdminMember();
  const deleteDonationMutation = useDeleteDonation();

  const [tab, setTab] = useState<TabKey>('overview');
  const [memberSearch, setMemberSearch] = useState('');
  const [editOpen, setEditOpen] = useState(false);
  const [donationOpen, setDonationOpen] = useState(false);
  const [confirm, setConfirm] = useState<ConfirmState>(null);

  const filteredMembers = useMemo(() => {
    const q = memberSearch.trim().toLowerCase();
    const list = data?.members ?? [];
    return q ? list.filter((m) => `${m.firstName} ${m.lastName}`.toLowerCase().includes(q)) : list;
  }, [data?.members, memberSearch]);

  if (isLoading) return <BrandedLoader />;

  if (isError || !data) {
    return (
      <div className="min-h-dvh bg-earbore-grayLight">
        <Header />
        <Box sx={{ maxWidth: 600, mx: 'auto', p: 3 }}>
          <Alert severity="error">{t('admin.detail.loadError')}</Alert>
          <Button sx={{ mt: 2 }} onClick={() => navigate('/admin')}>{t('admin.detail.back')}</Button>
        </Box>
      </div>
    );
  }

  const { user, stats, members, shareLinks, accessGiven, accessReceived, donations } = data;
  const isAdminUser = user.role === 'ADMIN';

  const donationTotals = donations.reduce<Record<string, number>>((acc, d) => {
    acc[d.currency] = (acc[d.currency] ?? 0) + d.amount;
    return acc;
  }, {});

  const accessLabel = (level: 'READ_ONLY' | 'EDIT') =>
    t(level === 'EDIT' ? 'sharing.editAccess' : 'sharing.readOnly');

  const confirmCopy = (() => {
    switch (confirm?.kind) {
      case 'user':
        return { title: t('admin.users.deleteTitle'), desc: t('admin.users.deleteDesc', { name: fullName(user) }), label: t('common.delete'), destructive: true };
      case 'sessions':
        return { title: t('admin.detail.revokeTitle'), desc: t('admin.detail.revokeDesc'), label: t('admin.detail.revokeConfirm'), destructive: false };
      case 'member':
        return { title: t('admin.detail.deleteMemberTitle'), desc: t('admin.detail.deleteMemberDesc', { name: confirm.name }), label: t('common.delete'), destructive: true };
      case 'donation':
        return { title: t('admin.donation.deleteTitle'), desc: t('admin.donation.deleteDesc'), label: t('common.delete'), destructive: true };
      default:
        return { title: '', desc: '', label: undefined, destructive: true };
    }
  })();

  const confirmLoading =
    deleteUserMutation.isPending || revokeMutation.isPending ||
    deleteMemberMutation.isPending || deleteDonationMutation.isPending;

  const handleConfirm = async () => {
    if (!confirm) return;
    try {
      if (confirm.kind === 'user') {
        await deleteUserMutation.mutateAsync(user.id);
        navigate('/admin', { replace: true });
        return;
      }
      if (confirm.kind === 'sessions') await revokeMutation.mutateAsync(user.id);
      if (confirm.kind === 'member') await deleteMemberMutation.mutateAsync({ userId: user.id, memberId: confirm.id });
      if (confirm.kind === 'donation') await deleteDonationMutation.mutateAsync(confirm.id);
      setConfirm(null);
    } catch {
      // dialogul rămâne deschis ca să poți reîncerca
    }
  };

  return (
    <div className="min-h-dvh bg-earbore-grayLight">
      <Header />

      <Box sx={{ maxWidth: 1200, mx: 'auto', px: { xs: 1.5, sm: 4 }, py: { xs: 2, sm: 4 }, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
        <Button
          startIcon={<ArrowBackIcon />} onClick={() => navigate('/admin')}
          sx={{ alignSelf: 'flex-start', color: 'var(--color-earbore-gray)' }}
        >
          {t('admin.detail.back')}
        </Button>

        {/* ── antet user ── */}
        <Paper variant="outlined" sx={{ p: { xs: 2, sm: 3 }, borderRadius: 3 }}>
          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 2, alignItems: { md: 'center' } }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1, minWidth: 0 }}>
              <Avatar src={user.avatarUrl ?? undefined} sx={{ width: 64, height: 64, fontSize: 22, fontWeight: 700, bgcolor: 'var(--color-earbore-600)' }}>
                {initialsOf(user)}
              </Avatar>
              <Box sx={{ minWidth: 0 }}>
                <Typography variant="h6" sx={{ fontWeight: 800, lineHeight: 1.2 }} noWrap>{fullName(user)}</Typography>
                <Typography variant="body2" color="text.secondary" noWrap>{user.email}</Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.75 }}>
                  <Chip
                    size="small" color={user.disabled ? 'error' : 'success'} variant={user.disabled ? 'filled' : 'outlined'}
                    label={user.disabled ? t('admin.badge.disabled') : t('admin.badge.active')}
                  />
                  {isAdminUser && <Chip size="small" color="primary" label={t('admin.badge.admin')} />}
                  {user.donationsCount > 0 && (
                    <Chip
                      size="small" variant="outlined" icon={<FavoriteIcon sx={{ fontSize: 14 }} />} label={t('admin.badge.donor')}
                      sx={{ color: 'var(--color-earbore-danger)', borderColor: 'var(--color-earbore-danger)' }}
                    />
                  )}
                </Box>
              </Box>
            </Box>

            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              <Button variant="contained" size="small" startIcon={<EditIcon />} onClick={() => setEditOpen(true)}>
                {t('admin.users.actionEdit')}
              </Button>
              {!isAdminUser && (
                <Button
                  variant="outlined" size="small" color={user.disabled ? 'success' : 'warning'}
                  startIcon={user.disabled ? <ChatBubble /> : <BlockIcon />}
                  disabled={updateMutation.isPending}
                  onClick={() => updateMutation.mutate({ id: user.id, data: { disabled: !user.disabled } })}
                >
                  {user.disabled ? t('admin.users.actionEnable') : t('admin.users.actionDisable')}
                </Button>
              )}
              <Button variant="outlined" size="small" color="inherit" startIcon={<LogoutIcon />} onClick={() => setConfirm({ kind: 'sessions' })}>
                {t('admin.detail.revokeSessions')}
              </Button>
              {!isAdminUser && (
                <Button variant="outlined" size="small" color="error" startIcon={<DeleteIcon />} onClick={() => setConfirm({ kind: 'user' })}>
                  {t('common.delete')}
                </Button>
              )}
            </Box>
          </Box>
        </Paper>

        {/* ── statistici ── */}
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(3, 1fr)', md: 'repeat(6, 1fr)' }, gap: { xs: 1, sm: 1.5 } }}>
          <MiniStat label={t('admin.detail.statMembers')} value={stats.members} />
          <MiniStat label={t('admin.detail.statRelations')} value={stats.relations} />
          <MiniStat label={t('admin.detail.statPartnerships')} value={stats.partnerships} />
          <MiniStat label={t('admin.detail.statPhotos')} value={stats.withPhoto} />
          <MiniStat label={t('admin.detail.statMessages')} value={stats.messagesSent} />
          <MiniStat label={t('admin.detail.statSessions')} value={stats.activeSessions} />
        </Box>

        {/* ── tab-uri ── */}
        <Paper variant="outlined" sx={{ borderRadius: 3, overflow: 'hidden' }}>
          <Tabs
            value={tab} onChange={(_, v) => setTab(v)} variant="scrollable" scrollButtons="auto"
            sx={{ borderBottom: '1px solid', borderColor: 'divider', px: 1 }}
          >
            <Tab value="overview" label={t('admin.detail.tabOverview')} />
            <Tab value="members" label={`${t('admin.detail.tabMembers')} (${stats.members})`} />
            <Tab value="sharing" label={t('admin.detail.tabSharing')} />
            <Tab value="donations" label={`${t('admin.detail.tabDonations')} (${donations.length})`} />
          </Tabs>

          <Box sx={{ p: { xs: 2, sm: 3 } }}>
            {/* ── Prezentare ── */}
            {tab === 'overview' && (
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: { xs: 2.5, md: 5 } }}>
                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>{t('admin.detail.accountInfo')}</Typography>
                  <InfoRow label={t('admin.form.email')} value={user.email} />
                  <InfoRow label={t('admin.detail.createdAt')} value={formatDateTime(user.createdAt, lang)} />
                  <InfoRow label={t('admin.detail.lastLogin')} value={user.lastLoginAt ? formatDateTime(user.lastLoginAt, lang) : t('admin.users.never')} />
                  <InfoRow label={t('admin.detail.providers')} value={user.providers.length ? user.providers.join(', ') : t('admin.detail.providersNone')} />
                  <InfoRow label={t('admin.detail.hasPassword')} value={user.hasPassword ? t('admin.detail.yes') : t('admin.detail.no')} />
                  <InfoRow label={t('admin.detail.linkedMember')} value={user.selfMemberId ? t('admin.detail.yes') : t('admin.detail.no')} />
                </Box>
                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>{t('admin.detail.treeInfo')}</Typography>
                  <InfoRow label={t('admin.detail.statMembers')} value={stats.members} />
                  <InfoRow label={t('admin.detail.alive')} value={stats.alive} />
                  <InfoRow label={t('admin.detail.deceased')} value={stats.deceased} />
                  <InfoRow label={t('admin.detail.statPhotos')} value={stats.withPhoto} />
                  <InfoRow label={t('admin.detail.statRelations')} value={stats.relations} />
                  <InfoRow label={t('admin.detail.statPartnerships')} value={stats.partnerships} />
                </Box>
              </Box>
            )}

            {/* ── Membri ── */}
            {tab === 'members' && (
              <Box>
                <TextField
                  size="small" fullWidth placeholder={t('admin.detail.membersSearch')}
                  value={memberSearch} onChange={(e) => setMemberSearch(e.target.value)} autoComplete="off"
                  slotProps={{ input: { startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> } }}
                  sx={{ mb: 1.5, maxWidth: 420 }}
                />
                {filteredMembers.length === 0 ? (
                  <Typography variant="body2" color="text.secondary">{t('admin.detail.noMembers')}</Typography>
                ) : (
                  <List disablePadding>
                    {filteredMembers.map((m) => (
                      <ListItem
                        key={m.id} divider disableGutters
                        secondaryAction={
                          <Tooltip title={t('common.delete')}>
                            <IconButton edge="end" size="small" onClick={() => setConfirm({ kind: 'member', id: m.id, name: fullName(m) })}>
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        }
                      >
                        <ListItemAvatar>
                          <Avatar src={m.imageUrl ?? undefined} sx={{ width: 36, height: 36, fontSize: 13, fontWeight: 700 }}>
                            {initialsOf(m)}
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={fullName(m)}
                          secondary={
                            [
                              m.birthDate ? formatDate(m.birthDate, lang) : null,
                              m.deathDate ? `† ${formatDate(m.deathDate, lang)}` : null,
                              m.gender ? t(`common.genders.${m.gender.toLowerCase()}`) : null,
                            ].filter(Boolean).join(' · ') || '—'
                          }
                          slotProps={{ primary: { sx: { fontWeight: 600 }, noWrap: true } }}
                          sx={{ pr: 5 }}
                        />
                      </ListItem>
                    ))}
                  </List>
                )}
              </Box>
            )}

            {/* ── Partajare ── */}
            {tab === 'sharing' && (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>{t('admin.detail.shareLinks')}</Typography>
                  {shareLinks.length === 0 ? (
                    <Typography variant="body2" color="text.secondary">{t('admin.detail.noLinks')}</Typography>
                  ) : (
                    <List disablePadding>
                      {shareLinks.map((l) => (
                        <ListItem key={l.id} divider disableGutters sx={{ flexWrap: 'wrap', gap: 1 }}>
                          <ListItemText
                            primary={l.label || accessLabel(l.accessLevel)}
                            secondary={`${accessLabel(l.accessLevel)} · ${t('admin.detail.guests', { count: l.guestsCount })} · ${formatDate(l.createdAt, lang)}${l.expiresAt ? ` · ${t('sharing.expiresOn', { date: formatDate(l.expiresAt, lang) })}` : ''}`}
                          />
                          <Chip size="small" color={l.revoked ? 'default' : 'success'} label={l.revoked ? t('sharing.statusRevoked') : t('sharing.statusActive')} />
                        </ListItem>
                      ))}
                    </List>
                  )}
                </Box>

                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>{t('admin.detail.accessGiven')}</Typography>
                    {accessGiven.length === 0 ? (
                      <Typography variant="body2" color="text.secondary">{t('admin.detail.noAccess')}</Typography>
                    ) : (
                      <List disablePadding>
                        {accessGiven.map((a) => (
                          <ListItem key={a.id} divider disableGutters>
                            <ListItemText
                              primary={a.grantee ? fullName(a.grantee) : '—'}
                              secondary={`${a.grantee?.email ?? ''} · ${accessLabel(a.accessLevel)}${a.revoked ? ` · ${t('sharing.statusRevoked')}` : ''}`}
                            />
                          </ListItem>
                        ))}
                      </List>
                    )}
                  </Box>
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>{t('admin.detail.accessReceived')}</Typography>
                    {accessReceived.length === 0 ? (
                      <Typography variant="body2" color="text.secondary">{t('admin.detail.noAccess')}</Typography>
                    ) : (
                      <List disablePadding>
                        {accessReceived.map((a) => (
                          <ListItem key={a.id} divider disableGutters>
                            <ListItemText
                              primary={a.owner ? fullName(a.owner) : '—'}
                              secondary={`${a.owner?.email ?? ''} · ${accessLabel(a.accessLevel)}${a.revoked ? ` · ${t('sharing.statusRevoked')}` : ''}`}
                            />
                          </ListItem>
                        ))}
                      </List>
                    )}
                  </Box>
                </Box>
              </Box>
            )}

            {/* ── Donații ── */}
            {tab === 'donations' && (
              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2, mb: 1.5, flexWrap: 'wrap' }}>
                  <Typography variant="body2" sx={{ fontWeight: 700, color: 'var(--color-earbore-700)' }}>
                    {Object.keys(donationTotals).length === 0
                      ? t('admin.detail.noDonations')
                      : Object.entries(donationTotals).map(([cur, amt]) => formatMoney(amt, cur, lang)).join(' + ')}
                  </Typography>
                  <Button size="small" variant="contained" startIcon={<AddIcon />} onClick={() => setDonationOpen(true)}>
                    {t('admin.donation.addTitle')}
                  </Button>
                </Box>

                <List disablePadding>
                  {donations.map((d) => (
                    <ListItem
                      key={d.id} divider disableGutters
                      secondaryAction={
                        <Tooltip title={t('common.delete')}>
                          <IconButton edge="end" size="small" onClick={() => setConfirm({ kind: 'donation', id: d.id })}>
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      }
                    >
                      <ListItemText
                        primary={formatMoney(d.amount, d.currency, lang)}
                        secondary={`${formatDate(d.donatedAt, lang)}${d.note ? ` · ${d.note}` : ''}`}
                        slotProps={{ primary: { sx: { fontWeight: 700 } } }}
                        sx={{ pr: 5 }}
                      />
                    </ListItem>
                  ))}
                </List>
              </Box>
            )}
          </Box>
        </Paper>
      </Box>

      <UserFormDialog open={editOpen} mode="edit" user={user} onClose={() => setEditOpen(false)} />
      <DonationFormDialog open={donationOpen} userId={user.id} onClose={() => setDonationOpen(false)} />

      <ConfirmDialog
        open={!!confirm}
        title={confirmCopy.title}
        description={confirmCopy.desc}
        confirmLabel={confirmCopy.label}
        isLoading={confirmLoading}
        destructive={confirmCopy.destructive}
        icon={confirmCopy.destructive ? 'warning' : 'none'}
        onConfirm={handleConfirm}
        onCancel={() => setConfirm(null)}
      />
    </div>
  );
};

export default AdminUserDetailPage;