import { Node, Edge } from '@xyflow/react';
import { MindMapSessionData, CustomNodeData } from '../types';

/**
 * Triggers a browser download of the mind map session as a structured JSON file.
 */
export function exportMindMapJSON(
  nodes: Node[],
  edges: Edge[],
  title?: string
): void {
  const sessionTitle = title?.trim() || 'خريطة أفكار تصوّرات';
  const now = new Date().toISOString();

  const sessionData: MindMapSessionData = {
    version: '1.0.0',
    title: sessionTitle,
    createdAt: now,
    updatedAt: now,
    nodes: nodes.map(n => ({
      id: String(n.id),
      type: n.type || 'customNode',
      position: {
        x: typeof n.position?.x === 'number' ? n.position.x : 0,
        y: typeof n.position?.y === 'number' ? n.position.y : 0,
      },
      data: (n.data || {}) as CustomNodeData,
    })),
    edges: edges.map(e => ({
      id: String(e.id),
      source: String(e.source),
      target: String(e.target),
      type: e.type || 'customEdge',
      data: e.data ? { ...e.data } : undefined,
    })),
    metadata: {
      nodeCount: nodes.length,
      edgeCount: edges.length,
      exportedAt: now,
      appVersion: '2.0.0',
    },
  };

  const jsonString = JSON.stringify(sessionData, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  // Generate safe filename from title or date
  const cleanTitle = sessionTitle
    .toLowerCase()
    .replace(/[^a-z0-9\u0600-\u06FF_-]/gi, '_')
    .slice(0, 40) || 'mindmap';

  link.download = `t9orat-${cleanTitle}-${now.slice(0, 10)}.json`;
  link.href = url;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Backward compatibility alias for exportMindMapJSON
 */
export const exportMindMapToJSON = exportMindMapJSON;

/**
 * Validates and parses an imported JSON string representing a mind map.
 * Throws clear Arabic error messages if invalid.
 */
export function validateAndParseMindMapJSON(
  jsonString: string
): { nodes: Node<CustomNodeData>[]; edges: Edge[]; title?: string } {
  if (!jsonString || typeof jsonString !== 'string' || !jsonString.trim()) {
    throw new Error('الملف فارغ أو لا يحتوي على نصوص صالحة.');
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonString);
  } catch {
    throw new Error('الملف المحدد ليس بصيغة JSON صالحة.');
  }

  if (!parsed || typeof parsed !== 'object') {
    throw new Error('صيغة الملف غير صالحة، يجب أن يحتوي على كائن بيانات.');
  }

  const data = parsed as Record<string, unknown>;

  // Check for presence of nodes and edges
  const rawNodes = data.nodes;
  const rawEdges = data.edges;

  if (!Array.isArray(rawNodes)) {
    throw new Error('الملف يفتقر إلى مصفوفة العقد (nodes).');
  }

  if (!Array.isArray(rawEdges)) {
    throw new Error('الملف يفتقر إلى مصفوفة الروابط (edges).');
  }

  // Validate and sanitize nodes
  const nodes: Node<CustomNodeData>[] = rawNodes.map((n, idx) => {
    if (!n || typeof n !== 'object') {
      throw new Error(`العقدة رقم ${idx + 1} بتنسيق غير صالح.`);
    }

    const nodeObj = n as Record<string, unknown>;
    if (!nodeObj.id || typeof nodeObj.id !== 'string') {
      throw new Error(`العقدة رقم ${idx + 1} لا تحتوي على معرف (id) صالح.`);
    }

    const pos = (nodeObj.position && typeof nodeObj.position === 'object')
      ? (nodeObj.position as { x?: number; y?: number })
      : { x: Math.random() * 400 - 200, y: Math.random() * 400 - 200 };

    const rawData = (nodeObj.data && typeof nodeObj.data === 'object')
      ? (nodeObj.data as Record<string, unknown>)
      : {};

    const nodeData: CustomNodeData = {
      label: typeof rawData.label === 'string' && rawData.label.trim() ? rawData.label : 'عقدة بدون عنوان',
      type: (['input', 'idea', 'recommendation'].includes(rawData.type as string) ? rawData.type : 'idea') as CustomNodeData['type'],
      description: typeof rawData.description === 'string' ? rawData.description : '',
      ideaContext: typeof rawData.ideaContext === 'string' ? rawData.ideaContext : undefined,
      recommendationType: typeof rawData.recommendationType === 'string' ? rawData.recommendationType : undefined,
      searchQueries: Array.isArray(rawData.searchQueries) ? (rawData.searchQueries as CustomNodeData['searchQueries']) : undefined,
      customColor: typeof rawData.customColor === 'string' ? rawData.customColor : undefined,
      userNotes: typeof rawData.userNotes === 'string' ? rawData.userNotes : undefined,
      aiExplanation: typeof rawData.aiExplanation === 'string' ? rawData.aiExplanation : undefined,
      starred: Boolean(rawData.starred),
      isFaded: Boolean(rawData.isFaded),
      ...rawData,
    };

    return {
      id: String(nodeObj.id),
      type: typeof nodeObj.type === 'string' ? nodeObj.type : 'customNode',
      position: {
        x: Number.isFinite(pos.x) ? Number(pos.x) : 0,
        y: Number.isFinite(pos.y) ? Number(pos.y) : 0,
      },
      data: nodeData,
    };
  });

  const validNodeIds = new Set(nodes.map(n => n.id));

  // Validate and sanitize edges
  const edges: Edge[] = rawEdges.map((e, idx) => {
    if (!e || typeof e !== 'object') {
      throw new Error(`الرابط رقم ${idx + 1} بتنسيق غير صالح.`);
    }

    const edgeObj = e as Record<string, unknown>;
    if (!edgeObj.id || typeof edgeObj.id !== 'string') {
      throw new Error(`الرابط رقم ${idx + 1} لا يحتوي على معرف (id) صالح.`);
    }

    if (!edgeObj.source || typeof edgeObj.source !== 'string') {
      throw new Error(`الرابط رقم ${idx + 1} يفتقر إلى مصدر (source).`);
    }

    if (!edgeObj.target || typeof edgeObj.target !== 'string') {
      throw new Error(`الرابط رقم ${idx + 1} يفتقر إلى هدف (target).`);
    }

    return {
      id: String(edgeObj.id),
      source: String(edgeObj.source),
      target: String(edgeObj.target),
      type: typeof edgeObj.type === 'string' ? edgeObj.type : 'customEdge',
      data: (edgeObj.data && typeof edgeObj.data === 'object')
        ? (edgeObj.data as Record<string, unknown>)
        : undefined,
      animated: Boolean(edgeObj.animated),
    };
  }).filter(e => validNodeIds.has(e.source) && validNodeIds.has(e.target));

  const title = typeof data.title === 'string' && data.title.trim() ? data.title.trim() : undefined;

  return { nodes, edges, title };
}
