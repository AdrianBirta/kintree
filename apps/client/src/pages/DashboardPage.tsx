import React, { useCallback, useState } from 'react';
import {
  Box, Button, ToggleButtonGroup, ToggleButton, Stack, Typography,
  IconButton, Tooltip, useMediaQuery, useTheme,
} from '@mui/material';
import ViewInArIcon from '@mui/icons-material/ViewInAr';
import ViewAgendaIcon from '@mui/icons-material/ViewAgenda';
import FavoriteIcon from '@mui/icons-material/Favorite';
import AddIcon from '@mui/icons-material/Add';
import SwapVertIcon from '@mui/icons-material/SwapVert';
import type { TreeDirection } from '../lib/treeLayout';
import Header from '../components/layout/Header';
import AddMemberModal from '../components/tree/AddMemberModal';
import LinkPartnersModal from '../components/tree/LinkPartnersModal';
import FamilyTreeCanvas from '../components/tree/FamilyTreeCanvas';
import FamilyTree3D from '../components/tree/FamilyTree3D';
import { useTreeQuery } from '../hooks/queries/useFamilyQueries';
import { useReorderMembers } from '../hooks/queries/useFamilyMutations';
import { useTranslation } from 'react-i18next';
import { usePermissions } from '../hooks/usePermissions'; // NOU
import BrandedLoader from '../components/common/BrandedLoader';

const DashboardPage: React.FC = () => {
  const { t } = useTranslation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // NOU — hook-ul TREBUIE apelat aici, la nivelul de sus al componentei,
  // alături de celelalte hook-uri (useTreeQuery, useState etc.), NICIODATĂ
  // în interiorul unui callback/handler sau în afara componentei.
  const { canEdit } = usePermissions();

  const { data: treeData, isLoading } = useTreeQuery();
  const reorderMutation = useReorderMembers();

  const [showAddModal, setShowAddModal] = useState(false);
  const [showPartnerModal, setShowPartnerModal] = useState(false);
  const [viewMode, setViewMode] = useState<'2d' | '3d'>('2d');
  const [direction, setDirection] = useState<TreeDirection>('top-down');

  const [quickAddRelation, setQuickAddRelation] = useState<{ memberId: string; kind: 'parent' | 'child' } | null>(null);

  const handleQuickAdd = useCallback((memberId: string, kind: 'parent' | 'child') => {
    setQuickAddRelation({ memberId, kind });
    setShowAddModal(true);
  }, []);

  const handleCloseAddModal = useCallback(() => {
    setShowAddModal(false);
    setQuickAddRelation(null);
  }, []);

  const handleReorder = useCallback(
    (updates: { memberId: string; manualOrder: number; manualRank?: number }[]) => {
      reorderMutation.mutate(updates);
    },
    [reorderMutation],
  );

  const toggleDirection = () => setDirection((d) => (d === 'top-down' ? 'bottom-up' : 'top-down'));

  return (
    <Box sx={{ height: '100dvh', display: 'flex', flexDirection: 'column', bgcolor: 'background.default' }}>
      <Header />

      <Box sx={{ flex: 1, position: 'relative', minHeight: 0 }}>
        {isLoading ? (
          <BrandedLoader fullScreen={false} />
        ) : treeData && treeData.members.length === 0 ? (
          <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', px: 3 }}>
            <img src="/assets/favicon.svg" alt="" style={{ width: 88, height: 88, opacity: 0.35, marginBottom: 16 }} />
            <Typography component="h6" variant="h6" sx={{ fontWeight: 700 }} gutterBottom>{t('dashboard.emptyTitle')}</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3, maxWidth: 380 }}>
              {t('dashboard.emptyDesc')}
            </Typography>
            {canEdit && (
              <Button variant="contained" startIcon={<AddIcon />} onClick={() => setShowAddModal(true)}>
                {t('dashboard.addFirstMember')}
              </Button>
            )}
          </Box>
        ) : (
          <>
            {viewMode === '2d' ? (
              <FamilyTreeCanvas
                treeData={treeData}
                onReorder={canEdit ? handleReorder : () => { }}
                direction={direction}
                onQuickAdd={canEdit ? handleQuickAdd : () => { }}
              />
            ) : (
              <FamilyTree3D treeData={treeData} direction={direction} />
            )}

            <Box
              sx={{
                position: 'absolute',
                top: { xs: 8, sm: 16 },
                right: { xs: 8, sm: 16 },
                display: 'inline-flex',
                maxWidth: 'calc(100% - 16px)',
                p: { xs: 0.75, sm: 0 },
                borderRadius: 4,
                backgroundColor: { xs: 'rgba(255,255,255,0.55)', sm: 'transparent' },
                backdropFilter: { xs: 'blur(10px)', sm: 'none' },
                WebkitBackdropFilter: { xs: 'blur(10px)', sm: 'none' },
                boxShadow: { xs: '0 2px 10px rgba(20,10,40,0.08)', sm: 'none' },
              }}
            >
              <Stack
                direction="row"
                spacing={{ xs: 0.75, sm: 1.5 }}
                useFlexGap
                sx={{
                  justifyContent: 'flex-end',
                  flexWrap: 'wrap',
                }}
              >
                {viewMode === '2d' && (
                  <Tooltip title={direction === 'top-down' ? t('dashboard.toggleDirectionTopDown') : t('dashboard.toggleDirectionBottomUp')}>
                    <IconButton onClick={toggleDirection} sx={{ bgcolor: 'background.paper', boxShadow: 1 }}>
                      <SwapVertIcon fontSize={isMobile ? 'small' : 'medium'} />
                    </IconButton>
                  </Tooltip>
                )}

                <ToggleButtonGroup
                  value={viewMode}
                  exclusive
                  size="small"
                  onChange={(_, val) => val && setViewMode(val)}
                  sx={{ bgcolor: 'background.paper', boxShadow: 1, borderRadius: 3 }}
                >
                  <ToggleButton value="2d" sx={{ borderRadius: 3, px: { xs: 1, sm: 1.5 } }}>
                    <ViewAgendaIcon fontSize="small" sx={{ mr: { xs: 0, sm: 0.5 } }} />
                    {!isMobile && '2D'}
                  </ToggleButton>
                  <ToggleButton value="3d" sx={{ borderRadius: 3, px: { xs: 1, sm: 1.5 } }}>
                    <ViewInArIcon fontSize="small" sx={{ mr: { xs: 0, sm: 0.5 } }} />
                    {!isMobile && '3D'}
                  </ToggleButton>
                </ToggleButtonGroup>

                {canEdit && (
                  isMobile ? (
                    <Tooltip title={t('dashboard.linkPartners')}>
                      <IconButton onClick={() => setShowPartnerModal(true)} sx={{ bgcolor: 'background.paper', boxShadow: 1 }}>
                        <FavoriteIcon fontSize="small" color="primary" />
                      </IconButton>
                    </Tooltip>
                  ) : (
                    <Button variant="outlined" startIcon={<FavoriteIcon />} onClick={() => setShowPartnerModal(true)} sx={{ bgcolor: 'background.paper', boxShadow: 1 }}>
                      {t('dashboard.linkPartners')}
                    </Button>
                  )
                )}

                {canEdit && (
                  isMobile ? (
                    <Tooltip title={t('dashboard.addMember')}>
                      <IconButton
                        onClick={() => setShowAddModal(true)}
                        sx={{ bgcolor: 'primary.main', color: 'white', boxShadow: 1, '&:hover': { bgcolor: 'primary.dark' } }}
                      >
                        <AddIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  ) : (
                    <Button variant="contained" startIcon={<AddIcon />} onClick={() => setShowAddModal(true)} sx={{ boxShadow: 1 }}>
                      {t('dashboard.addMember')}
                    </Button>
                  )
                )}
              </Stack>
            </Box>
          </>
        )}
      </Box>

      {showAddModal && canEdit && (
        <AddMemberModal
          members={treeData?.members ?? []}
          initialRelation={quickAddRelation}
          currentSelfId={treeData?.selfMemberId}
          onClose={handleCloseAddModal}
          onCreated={handleCloseAddModal}
        />
      )}

      {showPartnerModal && canEdit && (
        <LinkPartnersModal
          members={treeData?.members ?? []}
          onClose={() => setShowPartnerModal(false)}
          onLinked={() => setShowPartnerModal(false)}
        />
      )}
    </Box>
  );
};

export default DashboardPage;