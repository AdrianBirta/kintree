import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Box, Button, IconButton, Tooltip, Typography, useMediaQuery, useTheme } from '@mui/material';
import PersonAddAlt1Icon from '@mui/icons-material/PersonAddAlt1';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import Header from '../components/layout/Header';
import AdminStatsOverview from '../components/admin/AdminStatsOverview';
import AdminUsersTable from '../components/admin/AdminUsersTable';
import UserFormDialog from '../components/admin/UserFormDialog';

const AdminDashboardPage: React.FC = () => {
  const { t } = useTranslation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [createOpen, setCreateOpen] = useState(false);

  return (
    <div className="min-h-dvh bg-earbore-grayLight">
      <Header />

      <Box
        sx={{
          maxWidth: 1400, mx: 'auto', px: { xs: 1.5, sm: 4 }, py: { xs: 2, sm: 4 },
          display: 'flex', flexDirection: 'column', gap: 3,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, minWidth: 0 }}>
            <AdminPanelSettingsIcon sx={{ color: 'var(--color-earbore-600)', fontSize: { xs: 28, sm: 34 } }} />
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="h5" sx={{ fontWeight: 800, fontSize: { xs: 20, sm: 24 } }}>{t('admin.title')}</Typography>
              <Typography variant="body2" color="text.secondary">{t('admin.subtitle')}</Typography>
            </Box>
          </Box>

          {isMobile ? (
            <Tooltip title={t('admin.newUser')}>
              <IconButton
                onClick={() => setCreateOpen(true)}
                sx={{ bgcolor: 'primary.main', color: 'white', '&:hover': { bgcolor: 'primary.dark' } }}
              >
                <PersonAddAlt1Icon fontSize="small" />
              </IconButton>
            </Tooltip>
          ) : (
            <Button variant="contained" startIcon={<PersonAddAlt1Icon />} onClick={() => setCreateOpen(true)}>
              {t('admin.newUser')}
            </Button>
          )}
        </Box>

        <AdminStatsOverview />
        <AdminUsersTable />
      </Box>

      <UserFormDialog open={createOpen} mode="create" onClose={() => setCreateOpen(false)} />
    </div>
  );
};

export default AdminDashboardPage;