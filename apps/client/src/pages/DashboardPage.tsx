import React, { useEffect, useState, useCallback } from 'react';
import {
  Box, Button, ToggleButtonGroup, ToggleButton, Stack, CircularProgress, Typography,
  IconButton, Tooltip, useMediaQuery, useTheme,
} from '@mui/material';
import ViewInArIcon from '@mui/icons-material/ViewInAr';
import ViewAgendaIcon from '@mui/icons-material/ViewAgenda';
import FavoriteIcon from '@mui/icons-material/Favorite';
import AddIcon from '@mui/icons-material/Add';
import SwapVertIcon from '@mui/icons-material/SwapVert';
import { familyMembersService } from '../api/familyMembersService';
import type { FamilyTreeData } from '../types/family';
import type { TreeDirection } from '../lib/treeLayout';
import Header from '../components/layout/Header';
import AddMemberModal from '../components/tree/AddMemberModal';
import LinkPartnersModal from '../components/tree/LinkPartnersModal';
import FamilyTreeCanvas from '../components/tree/FamilyTreeCanvas';
import FamilyTree3D from '../components/tree/FamilyTree3D';

const DashboardPage: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const [treeData, setTreeData] = useState<FamilyTreeData | undefined>();
  const [isLoading, setIsLoading] = useState(true);
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

  const loadTree = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await familyMembersService.getTree();
      setTreeData(data);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { loadTree(); }, [loadTree]);

  const handleReorder = useCallback(
    async (updates: { memberId: string; manualOrder: number; manualRank?: number }[]) => {
      setTreeData((prev) => {
        if (!prev) return prev;
        const byId = new Map(updates.map((u) => [u.memberId, u]));
        return {
          ...prev,
          members: prev.members.map((m) => {
            const u = byId.get(m.id);
            if (!u) return m;
            return { ...m, manualOrder: u.manualOrder, ...(u.manualRank !== undefined ? { manualRank: u.manualRank } : {}) };
          }),
        };
      });

      try {
        await Promise.all(
          updates.map((u) =>
            familyMembersService.update(u.memberId, {
              manualOrder: u.manualOrder,
              ...(u.manualRank !== undefined ? { manualRank: u.manualRank } : {}),
            }),
          ),
        );
      } catch (err) {
        console.error('Reorder failed:', err)
        loadTree();
      }
    },
    [loadTree],
  );

  const toggleDirection = () => setDirection((d) => (d === 'top-down' ? 'bottom-up' : 'top-down'));

  return (
    <Box sx={{ height: '100dvh', display: 'flex', flexDirection: 'column', bgcolor: 'background.default' }}>
      <Header treeData={treeData} />

      <Box sx={{ flex: 1, position: 'relative', minHeight: 0 }}>
        {isLoading ? (
          <Box sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <CircularProgress />
          </Box>
        ) : treeData && treeData.members.length === 0 ? (
          <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', px: 3 }}>
            <Typography component="h6" variant="h6" sx={{ fontWeight: 700 }} gutterBottom>Arborele tău e gol deocamdată</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3, maxWidth: 380 }}>
              Adaugă primul membru al familiei pentru a începe să construiești arborele genealogic.
            </Typography>
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => setShowAddModal(true)}>
              Adaugă primul membru
            </Button>
          </Box>
        ) : (
          <>
            {viewMode === '2d' ? (
              <FamilyTreeCanvas
                treeData={treeData}
                onReorder={handleReorder}
                direction={direction}
                onQuickAdd={handleQuickAdd}
              />
            ) : (
              <FamilyTree3D treeData={treeData} direction={direction} />
            )}

            {/* NOU — pe mobil, butoanele devin doar-iconiță (cu tooltip),
                se înghesuie compact și fac wrap dacă spațiul e insuficient,
                ca să nu iasă niciodată din ecran. */}
            <Stack
              direction="row"
              spacing={{ xs: 0.75, sm: 1.5 }}
              useFlexGap
              sx={{
                position: 'absolute',
                top: { xs: 8, sm: 16 },
                right: { xs: 8, sm: 16 },
                left: { xs: 8, sm: 'auto' },
                justifyContent: 'flex-end',
                flexWrap: 'wrap',
                maxWidth: { xs: 'calc(100% - 16px)', sm: 'none' },
              }}
            >
              {viewMode === '2d' && (
                <Tooltip title={direction === 'top-down' ? 'Strămoșii sus, urmașii jos' : 'Strămoșii jos, urmașii sus'}>
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

              {isMobile ? (
                <Tooltip title="Leagă parteneri">
                  <IconButton onClick={() => setShowPartnerModal(true)} sx={{ bgcolor: 'background.paper', boxShadow: 1 }}>
                    <FavoriteIcon fontSize="small" color="primary" />
                  </IconButton>
                </Tooltip>
              ) : (
                <Button variant="outlined" startIcon={<FavoriteIcon />} onClick={() => setShowPartnerModal(true)} sx={{ bgcolor: 'background.paper', boxShadow: 1 }}>
                  Leagă parteneri
                </Button>
              )}

              {isMobile ? (
                <Tooltip title="Adaugă membru">
                  <IconButton
                    onClick={() => setShowAddModal(true)}
                    sx={{ bgcolor: 'primary.main', color: 'white', boxShadow: 1, '&:hover': { bgcolor: 'primary.dark' } }}
                  >
                    <AddIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              ) : (
                <Button variant="contained" startIcon={<AddIcon />} onClick={() => setShowAddModal(true)} sx={{ boxShadow: 1 }}>
                  Adaugă membru
                </Button>
              )}
            </Stack>
          </>
        )}
      </Box>

      {showAddModal && (
        <AddMemberModal
          members={treeData?.members ?? []}
          initialRelation={quickAddRelation}
          currentSelfId={treeData?.selfMemberId}
          onClose={handleCloseAddModal}
          onCreated={() => { handleCloseAddModal(); loadTree(); }}
        />
      )}

      {showPartnerModal && (
        <LinkPartnersModal
          members={treeData?.members ?? []}
          onClose={() => setShowPartnerModal(false)}
          onLinked={() => { setShowPartnerModal(false); loadTree(); }}
        />
      )}
    </Box>
  );
};

export default DashboardPage;