import React, { useEffect, useState, useCallback } from 'react';
import { familyMembersService } from '../api/familyMembersService';
import type { FamilyTreeData } from '../types/family';
import Header from '../components/layout/Header';
import AddMemberModal from '../components/tree/AddMemberModal';
import LinkPartnersModal from '../components/tree/LinkPartnersModal';
import FamilyTreeCanvas from '../components/tree/FamilyTreeCanvas';

const DashboardPage: React.FC = () => {
  const [treeData, setTreeData] = useState<FamilyTreeData | undefined>();
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showPartnerModal, setShowPartnerModal] = useState(false);

  const loadTree = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await familyMembersService.getTree();
      setTreeData(data);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTree();
  }, [loadTree]);

  // actualizare optimistă: layout-ul se recalculează instant din noile manualOrder/manualRank;
  // dacă salvarea pe server eșuează, resincronizăm cu ce e cu-adevărat acolo
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
            return {
              ...m,
              manualOrder: u.manualOrder,
              ...(u.manualRank !== undefined ? { manualRank: u.manualRank } : {}),
            };
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
      } catch {
        loadTree();
      }
    },
    [loadTree],
  );

  return (
    <div className="h-screen flex flex-col bg-earbore-grayLight">
      <Header members={treeData?.members ?? []} />

      <div className="flex-1 relative">
        {isLoading ? (
          <div className="h-full flex items-center justify-center">
            <div className="w-8 h-8 border-4 border-earbore-200 border-t-earbore-600 rounded-full animate-spin" />
          </div>
        ) : treeData && treeData.members.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center px-6">
            <h2 className="text-xl font-bold text-earbore-ink mb-2">Arborele tău e gol deocamdată</h2>
            <p className="text-earbore-gray text-sm mb-6 max-w-sm">
              Adaugă primul membru al familiei pentru a începe să construiești arborele genealogic.
            </p>
            <button onClick={() => setShowAddModal(true)} className="btn-primary">
              Adaugă primul membru
            </button>
          </div>
        ) : (
          <>
            <FamilyTreeCanvas treeData={treeData} onReorder={handleReorder} />
            <div className="absolute top-4 right-4 flex gap-2">
              <button onClick={() => setShowPartnerModal(true)} className="btn-outline text-sm py-2.5 px-4 bg-white shadow-md">
                ⚭ Leagă parteneri
              </button>
              <button onClick={() => setShowAddModal(true)} className="btn-primary shadow-md">
                + Adaugă membru
              </button>
            </div>
          </>
        )}
      </div>

      {showAddModal && (
        <AddMemberModal
          members={treeData?.members ?? []}
          onClose={() => setShowAddModal(false)}
          onCreated={() => {
            setShowAddModal(false);
            loadTree();
          }}
        />
      )}

      {showPartnerModal && (
        <LinkPartnersModal
          members={treeData?.members ?? []}
          onClose={() => setShowPartnerModal(false)}
          onLinked={() => {
            setShowPartnerModal(false);
            loadTree();
          }}
        />
      )}
    </div>
  );
};

export default DashboardPage;