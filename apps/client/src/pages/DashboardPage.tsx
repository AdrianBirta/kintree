import React, { useEffect, useState, useCallback } from 'react';
import { ReactFlow, Background, Controls, MiniMap, type NodeTypes } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { familyMembersService } from '../api/familyMembersService';
import type { FamilyTreeData } from '../types/family';
import { useTreeLayout } from '../hooks/useTreeLayout';
import MemberNode from '../components/tree/MemberNode';
import UnionNode from '../components/tree/UnionNode';
import Header from '../components/layout/Header';
import AddMemberModal from '../components/tree/AddMemberModal';
import LinkPartnersModal from '../components/tree/LinkPartnersModal';

function PartnerGroupNode() {
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        border: '1.5px dashed #c9b3ec',
        borderRadius: 16,
        background: 'rgba(124, 77, 212, 0.03)',
      }}
    />
  );
}

const nodeTypes = {
  memberNode: MemberNode,
  unionNode: UnionNode,
  partnerGroupNode: PartnerGroupNode,
};

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

  const { nodes, edges } = useTreeLayout(treeData);

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
            <ReactFlow
              nodes={nodes}
              edges={edges}
              nodeTypes={nodeTypes}
              fitView
              minZoom={0.2}
              maxZoom={1.5}
              proOptions={{ hideAttribution: true }}
            >
              <Background color="#d6c3f2" gap={20} />
              <Controls />
              <MiniMap
                nodeColor="#9b72e0"
                maskColor="rgba(236, 224, 250, 0.6)"
                className="!bg-white !border !border-earbore-border"
              />
            </ReactFlow>

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