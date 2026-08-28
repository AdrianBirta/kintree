import { useMemo } from 'react';
import dagre from '@dagrejs/dagre';
import { Position, type Node, type Edge } from '@xyflow/react';
import type { FamilyTreeData } from '../types/family';

const NODE_WIDTH = 192;
const NODE_HEIGHT = 130;
const UNION_SIZE = 12;

/**
 * După ce dagre a calculat layout-ul, parcurgem fiecare "rank" (nivel/generație)
 * și, dacă doi parteneri sunt pe același rank dar nu sunt adiacenți, îi lipim
 * unul lângă altul — păstrând EXACT aceleași poziții x calculate de dagre
 * (doar reasignăm cine ocupă care slot). Nu modificăm graful, deci nu poate
 * crăpa layout-ul dagre.
 */
function reorderPartnersWithinRanks(
  g: any,
  members: { id: string }[],
  partnerships: { partnerAId: string; partnerBId: string }[],
) {
  // grupăm membrii (doar noduri de tip persoană, nu union) după rank-ul lor (y)
  const rankGroups = new Map<number, string[]>();
  members.forEach((m) => {
    const pos = g.node(m.id);
    if (!pos) return;
    const y = Math.round(pos.y);
    const list = rankGroups.get(y) ?? [];
    list.push(m.id);
    rankGroups.set(y, list);
  });

  const partnerOf = new Map<string, string>();
  partnerships.forEach((p) => {
    partnerOf.set(p.partnerAId, p.partnerBId);
    partnerOf.set(p.partnerBId, p.partnerAId);
  });

  rankGroups.forEach((ids) => {
    if (ids.length < 2) return;

    const idsSet = new Set(ids);
    // ordinea curentă (de la dagre), stânga → dreapta
    const sortedByX = [...ids].sort((a, b) => g.node(a).x - g.node(b).x);
    // slot-urile de x rămân fixe — doar schimbăm cine stă în care slot
    const xSlots = sortedByX.map((id) => g.node(id).x);

    const newOrder: string[] = [];
    const placed = new Set<string>();

    sortedByX.forEach((id) => {
      if (placed.has(id)) return;
      newOrder.push(id);
      placed.add(id);

      const partnerId = partnerOf.get(id);
      // dacă partenerul e pe același rank și nu a fost deja plasat, îl lipim imediat lângă
      if (partnerId && idsSet.has(partnerId) && !placed.has(partnerId)) {
        newOrder.push(partnerId);
        placed.add(partnerId);
      }
    });

    // reasignăm coordonatele x păstrate, în noua ordine
    newOrder.forEach((id, i) => {
      g.node(id).x = xSlots[i];
    });
  });
}

export function useTreeLayout(treeData: FamilyTreeData | undefined) {
  return useMemo(() => {
    if (!treeData) return { nodes: [], edges: [] };

    const { members, relations, partnerships } = treeData;

    const parentsByChild = new Map<string, string[]>();
    relations.forEach((rel) => {
      const list = parentsByChild.get(rel.childId) ?? [];
      list.push(rel.parentId);
      parentsByChild.set(rel.childId, list);
    });

    const partnershipByPair = new Map<string, string>();
    partnerships.forEach((p) => {
      partnershipByPair.set(`${p.partnerAId}|${p.partnerBId}`, p.id);
      partnershipByPair.set(`${p.partnerBId}|${p.partnerAId}`, p.id);
    });

    const g = new dagre.graphlib.Graph();
    g.setDefaultEdgeLabel(() => ({}));
    g.setGraph({ rankdir: 'BT', nodesep: 70, ranksep: 110, ranker: 'tight-tree' });

    members.forEach((member) => {
      g.setNode(member.id, { width: NODE_WIDTH, height: NODE_HEIGHT });
    });

    const unionNodeIds = new Set<string>();
    const edgeIds = new Set<string>();
    const edgesToCreate: {
      id: string;
      source: string;
      target: string;
      sourceHandle: string;
      targetHandle: string;
      type: 'parentEdge' | 'unionEdge' | 'partnerEdge';
    }[] = [];

    const pushEdge = (edge: (typeof edgesToCreate)[number]) => {
      if (edgeIds.has(edge.id)) return;
      edgeIds.add(edge.id);
      edgesToCreate.push(edge);
    };

    const processedChildren = new Set<string>();

    // Cazul 1: copii cu doi părinți care au parteneriat între ei → nod de uniune
    parentsByChild.forEach((parentIds, childId) => {
      if (parentIds.length === 2) {
        const [a, b] = parentIds;
        const partnershipId = partnershipByPair.get(`${a}|${b}`);
        if (partnershipId) {
          const unionId = `union-${partnershipId}`;
          if (!unionNodeIds.has(unionId)) {
            unionNodeIds.add(unionId);
            g.setNode(unionId, { width: UNION_SIZE, height: UNION_SIZE });
          }
          g.setEdge(a, unionId);
          g.setEdge(b, unionId);
          g.setEdge(unionId, childId);

          pushEdge({ id: `${a}-${unionId}`, source: a, sourceHandle: 'top-source', target: unionId, targetHandle: 'bottom-target', type: 'parentEdge' });
          pushEdge({ id: `${b}-${unionId}`, source: b, sourceHandle: 'top-source', target: unionId, targetHandle: 'bottom-target', type: 'parentEdge' });
          pushEdge({ id: `${unionId}-${childId}`, source: unionId, sourceHandle: 'top-source', target: childId, targetHandle: 'bottom-target', type: 'unionEdge' });

          processedChildren.add(childId);
        }
      }
    });

    // Cazul 2: restul relațiilor părinte-copil
    relations.forEach((rel) => {
      const unionHandled = parentsByChild.get(rel.childId)?.length === 2 && processedChildren.has(rel.childId);
      if (!unionHandled) {
        g.setEdge(rel.parentId, rel.childId);
        pushEdge({ id: `${rel.parentId}-${rel.childId}`, source: rel.parentId, sourceHandle: 'top-source', target: rel.childId, targetHandle: 'bottom-target', type: 'parentEdge' });
      }
    });

    // NU mai adăugăm edge-uri de partener în graful lui dagre — asta cauza crash-ul.
    dagre.layout(g);

    // FIX: după layout, mutăm partenerii adiacenți unul lângă altul (fără să atingem dagre)
    reorderPartnersWithinRanks(g, members, partnerships);

    const nodes: Node[] = members.map((member) => {
      const pos = g.node(member.id);
      return {
        id: member.id,
        type: 'memberNode',
        position: { x: pos.x - NODE_WIDTH / 2, y: pos.y - NODE_HEIGHT / 2 },
        data: { member },
        targetPosition: Position.Bottom,
        sourcePosition: Position.Top,
      };
    });

    unionNodeIds.forEach((unionId) => {
      const pos = g.node(unionId);
      nodes.push({
        id: unionId,
        type: 'unionNode',
        position: { x: pos.x - UNION_SIZE / 2, y: pos.y - UNION_SIZE / 2 },
        data: {},
        draggable: false,
      });
    });

    // Parteneriate fără copii comuni → linie punctată directă
    // acum poziția reală (după reorder) e corectă, deci left/right va reflecta adiacența reală
    const usedUnionPartnerships = new Set([...unionNodeIds].map((u) => u.replace('union-', '')));
    partnerships.forEach((p) => {
      if (usedUnionPartnerships.has(p.id)) return;
      const posA = g.node(p.partnerAId);
      const posB = g.node(p.partnerBId);
      const [leftId, rightId] = posA.x <= posB.x ? [p.partnerAId, p.partnerBId] : [p.partnerBId, p.partnerAId];
      pushEdge({ id: `partner-${p.id}`, source: leftId, sourceHandle: 'right-source', target: rightId, targetHandle: 'left-target', type: 'partnerEdge' });
    });

    const edges: Edge[] = edgesToCreate.map((e) => {
      if (e.type === 'unionEdge') {
        return {
          id: e.id, source: e.source, sourceHandle: e.sourceHandle, target: e.target, targetHandle: e.targetHandle,
          type: 'default', style: { stroke: '#7c4dd4', strokeWidth: 2.5 },
        };
      }
      if (e.type === 'partnerEdge') {
        return {
          id: e.id, source: e.source, sourceHandle: e.sourceHandle, target: e.target, targetHandle: e.targetHandle,
          type: 'straight', style: { stroke: '#b99cea', strokeWidth: 2, strokeDasharray: '5 5' },
          label: '⚭', labelStyle: { fill: '#7c4dd4', fontSize: 14 }, labelBgStyle: { fill: '#f6f1fc' },
        };
      }
      return {
        id: e.id, source: e.source, sourceHandle: e.sourceHandle, target: e.target, targetHandle: e.targetHandle,
        type: 'default', style: { stroke: '#9b72e0', strokeWidth: 2 },
      };
    });

    return { nodes, edges };
  }, [treeData]);
}