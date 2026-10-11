import React from 'react';
import { useTranslation } from 'react-i18next';
import { Box, Button, Chip, CircularProgress, Paper, Typography } from '@mui/material';
import PeopleIcon from '@mui/icons-material/People';
import PersonAddAlt1Icon from '@mui/icons-material/PersonAddAlt1';
import BlockIcon from '@mui/icons-material/Block';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import LinkIcon from '@mui/icons-material/Link';
import ChatBubble from '@mui/icons-material/ChatBubble';
import FavoriteIcon from '@mui/icons-material/Favorite';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import AddIcon from '@mui/icons-material/Add';
import { useAdminStats } from '../../hooks/queries/useAdminQueries';
import { formatMoney } from '../../utils/format';
import DonationFormDialog from './DonationFormDialog';

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  sub?: string;
  colorVar: string;
}

const StatCard: React.FC<StatCardProps> = ({ icon, label, value, sub, colorVar }) => (
  <Paper
    variant="outlined"
    sx={{
      p: { xs: 1.5, sm: 2 }, display: 'flex', alignItems: 'center', gap: 1.5, borderRadius: 3,
      background: `color-mix(in srgb, var(${colorVar}) 8%, white)`,
      borderColor: `color-mix(in srgb, var(${colorVar}) 22%, white)`,
    }}
  >
    <Box
      sx={{
        width: 42, height: 42, borderRadius: 2.5, flexShrink: 0, display: 'flex',
        alignItems: 'center', justifyContent: 'center', bgcolor: `var(${colorVar})`, color: 'white',
      }}
    >
      {icon}
    </Box>
    <Box sx={{ minWidth: 0 }}>
      <Typography sx={{ fontWeight: 800, fontSize: { xs: 20, sm: 24 }, lineHeight: 1.1 }}>{value}</Typography>
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', lineHeight: 1.25 }}>
        {label}
      </Typography>
      {sub && (
        <Typography variant="caption" sx={{ color: `var(${colorVar})`, fontWeight: 600 }}>{sub}</Typography>
      )}
    </Box>
  </Paper>
);

const AdminStatsOverview: React.FC = () => {
  const { t, i18n } = useTranslation();
  const lang = i18n.language?.slice(0, 2) || 'en';
  const { data, isLoading } = useAdminStats();
  const [donationOpen, setDonationOpen] = React.useState(false);

  if (isLoading || !data) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress /></Box>;
  }

  const { users, content, donations, signups } = data;
  const maxSignups = Math.max(1, ...signups.map((s) => s.count));

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', md: 'repeat(4, 1fr)' }, gap: { xs: 1.25, sm: 2 } }}>
        <StatCard icon={<PeopleIcon fontSize="small" />} label={t('admin.stats.totalUsers')} value={users.total} colorVar="--color-earbore-500" />
        <StatCard icon={<TrendingUpIcon fontSize="small" />} label={t('admin.stats.activeLast30')} value={users.activeLast30} colorVar="--color-earbore-success" />
        <StatCard
          icon={<PersonAddAlt1Icon fontSize="small" />} label={t('admin.stats.new30')} value={users.new30}
          sub={t('admin.stats.new7', { count: users.new7 })} colorVar="--color-earbore-info"
        />
        <StatCard icon={<BlockIcon fontSize="small" />} label={t('admin.stats.disabled')} value={users.disabled} colorVar="--color-earbore-danger" />
        <StatCard icon={<AccountTreeIcon fontSize="small" />} label={t('admin.stats.members')} value={content.members} colorVar="--color-earbore-600" />
        <StatCard icon={<LinkIcon fontSize="small" />} label={t('admin.stats.shareLinks')} value={content.shareLinks} sub={t('admin.stats.accounts', { count: content.treeAccess })} colorVar="--color-earbore-warning" />
        <StatCard icon={<ChatBubble fontSize="small" />} label={t('admin.stats.messages')} value={content.messages} sub={t('admin.stats.conversations', { count: content.conversations })} colorVar="--color-earbore-info" />
        <StatCard icon={<FavoriteIcon fontSize="small" />} label={t('admin.stats.donors')} value={donations.donors} colorVar="--color-earbore-danger" />
      </Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '3fr 2fr' }, gap: { xs: 1.5, sm: 2 } }}>
        <Paper variant="outlined" sx={{ p: { xs: 2, sm: 2.5 }, borderRadius: 3 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.25 }}>{t('admin.stats.signupsTitle')}</Typography>
          <Typography variant="caption" color="text.secondary">{t('admin.stats.signupsDesc')}</Typography>
          <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: '3px', height: 90, mt: 2 }}>
            {signups.map((s) => (
              <Box
                key={s.date}
                title={`${s.date}: ${s.count}`}
                sx={{
                  flex: 1, borderRadius: '4px 4px 1px 1px',
                  height: `${Math.max(4, (s.count / maxSignups) * 100)}%`,
                  bgcolor: s.count > 0 ? 'var(--color-earbore-500)' : 'var(--color-earbore-100)',
                }}
              />
            ))}
          </Box>
        </Paper>

        <Paper variant="outlined" sx={{ p: { xs: 2, sm: 2.5 }, borderRadius: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1, mb: 1 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>{t('admin.stats.donationsTitle')}</Typography>
            <Button size="small" startIcon={<AddIcon />} onClick={() => setDonationOpen(true)}>
              {t('admin.stats.addDonation')}
            </Button>
          </Box>

          {donations.totals.length === 0 ? (
            <Typography variant="body2" color="text.secondary">{t('admin.stats.noDonations')}</Typography>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
              {donations.totals.map((d) => (
                <Typography key={d.currency} sx={{ fontWeight: 800, fontSize: 20, color: 'var(--color-earbore-700)' }}>
                  {formatMoney(d.amount, d.currency, lang)}
                  <Typography component="span" variant="caption" color="text.secondary" sx={{ ml: 1, fontWeight: 500 }}>
                    {t('admin.stats.donationsCount', { count: d.count })}
                  </Typography>
                </Typography>
              ))}
            </Box>
          )}

          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 2, mb: 0.75 }}>
            {t('admin.stats.clicksTitle', { count: donations.clicks })}
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
            {donations.clicksByTier.length === 0 && (
              <Typography variant="caption" color="text.secondary">—</Typography>
            )}
            {donations.clicksByTier.map((c) => (
              <Chip
                key={c.tier} size="small" variant="outlined"
                label={`${t(`admin.source.${c.tier}`, { defaultValue: c.tier })}: ${c.count}`}
              />
            ))}
          </Box>
        </Paper>
      </Box>

      <DonationFormDialog open={donationOpen} onClose={() => setDonationOpen(false)} />
    </Box>
  );
};

export default AdminStatsOverview;