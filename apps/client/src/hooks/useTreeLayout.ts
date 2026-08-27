import { useMemo } from 'react';
import dagre from '@dagrejs/dagre';
import { Position, type Node, type Edge } from '@xyflow/react';
import type { FamilyTreeData } from '../types/family';

const NODE_WIDTH = 192;
const NODE_HEIGHT = 130;
const UNION_SIZE = 12;

export function useTreeLayout(treeData: FamilyTreeData | undefined) {
  return useMemo(() => {
    if (!treeData) return { nodes: [], edges: [] };

    const { members, relations, partnerships } = treeData;

    // Pentru fiecare copil, găsim toți părinții lui
    const parentsByChild = new Map<string, string[]>();
    relations.forEach((rel) => {
      const list = parentsByChild.get(rel.childId) ?? [];
      list.push(rel.parentId);
      parentsByChild.set(rel.childId, list);
    });

    // Găsim, pentru o pereche de părinți, dacă există un parteneriat între ei
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
      if (edgeIds.has(edge.id)) return; // evită dubluri când doi părinți au mai mulți copii comuni
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

    // Cazul 2: restul relațiilor părinte-copil (un singur părinte, sau doi părinți fără parteneriat înregistrat) → edge direct
    relations.forEach((rel) => {
      const unionHandled = parentsByChild.get(rel.childId)?.length === 2 && processedChildren.has(rel.childId);
      if (!unionHandled) {
        g.setEdge(rel.parentId, rel.childId);
        pushEdge({ id: `${rel.parentId}-${rel.childId}`, source: rel.parentId, sourceHandle: 'top-source', target: rel.childId, targetHandle: 'bottom-target', type: 'parentEdge' });
      }
    });

    dagre.layout(g);

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

    // Parteneriate fără copii comuni → linie punctată directă, orientată corect
    // stânga-dreapta după poziția reală calculată de dagre (nu presupunem ordinea A/B).
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