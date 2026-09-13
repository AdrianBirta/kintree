import React from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Box, Card, Typography, Chip, Button, CircularProgress, Avatar } from '@mui/material';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import VisibilityIcon from '@mui/icons-material/Visibility';
import EditIcon from '@mui/icons-material/Edit';
import Header from '../components/layout/Header';
import { sharingService } from '../api/sharingService';
import { useActiveTreeStore } from '../store/activeTreeStore';

const TreesPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { activeOwner, setActiveOwner } = useActiveTreeStore();

  const { data, isLoading } = useQuery({
    queryKey: ['sharing', 'trees'],
    queryFn: sharingService.listTrees,
  });

  const openOwnTree = () => {
    setActiveOwner(null);
    navigate('/dashboard');
  };

  const openReceivedTree = (tree: {
    ownerId: string; firstName: string; lastName: string; accessLevel: 'READ_ONLY' | 'EDIT';
  }) => {
    setActiveOwner({
      ownerId: tree.ownerId,
      firstName: tree.firstName,
      lastName: tree.lastName,
      accessLevel: tree.accessLevel,
    });
    navigate('/dashboard');
  };

  if (isLoading) {
    return (
      <div className="min-h-dvh bg-earbore-grayLight">
        <Header />
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}><CircularProgress /></Box>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-earbore-grayLight">
      <Header />
      <Box sx={{ maxWidth: 900, mx: 'auto', px: { xs: 2, sm: 4 }, py: { xs: 3, sm: 5 } }}>
        <Typography variant="h5" sx={{ fontWeight: 800, mb: 0.5 }}>{t('trees.title')}</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>{t('trees.subtitle')}</Typography>

        {/* arborele propriu */}
        {data?.own && (
          <Card
            variant="outlined"
            onClick={openOwnTree}
            sx={{
              p: 2.5, mb: 2, borderRadius: 3, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 2,
              borderColor: !activeOwner ? 'primary.main' : 'divider',
              borderWidth: !activeOwner ? 2 : 1,
              transition: 'box-shadow 0.15s',
              '&:hover': { boxShadow: 2 },
            }}
          >
            <Avatar sx={{ bgcolor: 'primary.main', width: 44, height: 44 }}><AccountTreeIcon /></Avatar>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography sx={{ fontWeight: 700 }}>{t('trees.ownTreeLabel')}</Typography>
              <Typography variant="body2" color="text.secondary">
                {data.own.firstName} {data.own.lastName} · {data.own.email}
              </Typography>
            </Box>
            {!activeOwner && <Chip size="small" color="primary" label={t('trees.currentlyViewing')} />}
          </Card>
        )}

        <Typography variant="subtitle2" sx={{ fontWeight: 700, mt: 4, mb: 1.5, color: 'text.secondary' }}>
          {t('trees.receivedTitle')}
        </Typography>

        {(!data?.received || data.received.length === 0) ? (
          <Typography variant="body2" color="text.secondary">{t('trees.noReceived')}</Typography>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            {data.received.map((tree) => {
              const isActive = activeOwner?.ownerId === tree.ownerId;
              return (
                <Card
                  key={tree.accessId}
                  variant="outlined"
                  onClick={() => openReceivedTree(tree)}
                  sx={{
                    p: 2.5, borderRadius: 3, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 2,
                    borderColor: isActive ? 'primary.main' : 'divider',
                    borderWidth: isActive ? 2 : 1,
                    transition: 'box-shadow 0.15s',
                    '&:hover': { boxShadow: 2 },
                  }}
                >
                  <Avatar sx={{ bgcolor: 'earbore.400', width: 44, height: 44 }}>
                    {tree.firstName[0]}{tree.lastName[0]}
                  </Avatar>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography sx={{ fontWeight: 700 }}>{tree.firstName} {tree.lastName}</Typography>
                    <Typography variant="body2" color="text.secondary">{tree.email}</Typography>
                  </Box>
                  <Chip
                    size="small"
                    icon={tree.accessLevel === 'EDIT' ? <EditIcon sx={{ fontSize: 14 }} /> : <VisibilityIcon sx={{ fontSize: 14 }} />}
                    label={t(tree.accessLevel === 'EDIT' ? 'sharing.editAccess' : 'sharing.readOnly')}
                    color={tree.accessLevel === 'EDIT' ? 'primary' : 'default'}
                  />
                  {isActive && <Chip size="small" color="primary" variant="outlined" label={t('trees.currentlyViewing')} />}
                </Card>
              );
            })}
          </Box>
        )}
      </Box>
    </div>
  );
};

export default TreesPage;