import { useState, useCallback, useEffect } from 'react';
import { Node, Edge } from '@xyflow/react';

interface HistoryState {
  nodes: Node[];
  edges: Edge[];
}

const STORAGE_KEY = 'symphony_graph_session';

/**
 * Safely writes to localStorage handling QuotaExceededError and other storage exceptions.
 */
export function safeLocalStorageSet(key: string, value: string): boolean {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch (error: unknown) {
    const err = error as { name?: string; code?: number };
    if (
      err?.name === 'QuotaExceededError' ||
      err?.name === 'NS_ERROR_DOM_QUOTA_REACHED' ||
      err?.code === 22 ||
      err?.code === 1014
    ) {
      console.warn(`[useGraphState] LocalStorage quota exceeded when saving key "${key}".`);
    } else {
      console.error(`[useGraphState] Failed to save key "${key}" to localStorage:`, error);
    }
    return false;
  }
}

export function useGraphState() {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  
  const [past, setPast] = useState<HistoryState[]>([]);
  const [future, setFuture] = useState<HistoryState[]>([]);
  
  // Load initial state
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const { nodes: savedNodes, edges: savedEdges } = JSON.parse(saved);
        if (savedNodes && savedEdges) {
          setNodes(savedNodes);
          setEdges(savedEdges);
        }
      }
    } catch (e) {
      console.error("Failed to load session", e);
    }
  }, []);

  // Debounced save to localStorage (800ms)
  useEffect(() => {
    const handler = setTimeout(() => {
      if (nodes.length > 0 || edges.length > 0) {
        safeLocalStorageSet(STORAGE_KEY, JSON.stringify({ nodes, edges }));
      } else if (nodes.length === 0 && edges.length === 0) {
        try {
          localStorage.removeItem(STORAGE_KEY);
        } catch (e) {
          console.error("Failed to remove session", e);
        }
      }
    }, 800);

    return () => {
      clearTimeout(handler);
    };
  }, [nodes, edges]);

  const saveHistory = useCallback(() => {
    setPast((prev) => [...prev, { nodes, edges }]);
    setFuture([]);
  }, [nodes, edges]);

  const setGraphData = useCallback((newNodes: Node[], newEdges: Edge[]) => {
    saveHistory();
    setNodes(newNodes);
    setEdges(newEdges);
  }, [saveHistory]);

  const loadGraphData = useCallback((newNodes: Node[], newEdges: Edge[]) => {
    setPast([]);
    setFuture([]);
    setNodes(newNodes);
    setEdges(newEdges);
  }, []);

  const updateNodeData = useCallback((nodeId: string, partialData: Record<string, unknown>) => {
    saveHistory();
    setNodes((nds) =>
      nds.map((n) => {
        if (n.id === nodeId) {
          return {
            ...n,
            data: {
              ...n.data,
              ...partialData,
            },
          };
        }
        return n;
      })
    );
  }, [saveHistory]);

  const deleteNode = useCallback((nodeId: string) => {
    saveHistory();
    setNodes((nds) => nds.filter((n) => n.id !== nodeId));
    setEdges((eds) => eds.filter((e) => e.source !== nodeId && e.target !== nodeId));
  }, [saveHistory]);

  const batchDelete = useCallback((nodeIds: string[]) => {
    if (nodeIds.length === 0) return;
    saveHistory();
    const idSet = new Set(nodeIds);
    setNodes((nds) => nds.filter((n) => !idSet.has(n.id)));
    setEdges((eds) => eds.filter((e) => !idSet.has(e.source) && !idSet.has(e.target)));
  }, [saveHistory]);

  const clearAll = useCallback(() => {
    saveHistory();
    setNodes([]);
    setEdges([]);
  }, [saveHistory]);

  const undo = useCallback(() => {
    if (past.length === 0) return;
    const previous = past[past.length - 1];
    const newPast = past.slice(0, past.length - 1);
    
    setFuture((prev) => [{ nodes, edges }, ...prev]);
    setPast(newPast);
    setNodes(previous.nodes);
    setEdges(previous.edges);
  }, [nodes, edges, past]);

  const redo = useCallback(() => {
    if (future.length === 0) return;
    const next = future[0];
    const newFuture = future.slice(1);
    
    setPast((prev) => [...prev, { nodes, edges }]);
    setFuture(newFuture);
    setNodes(next.nodes);
    setEdges(next.edges);
  }, [nodes, edges, future]);

  const toggleStar = useCallback((nodeId: string) => {
    setNodes((nds) => nds.map((n) => {
      if (n.id === nodeId) {
        return { ...n, data: { ...n.data, starred: !n.data.starred } };
      }
      return n;
    }));
  }, []);

  const batchStar = useCallback((nodeIds: string[], starred?: boolean) => {
    if (nodeIds.length === 0) return;
    saveHistory();
    const idSet = new Set(nodeIds);
    setNodes((nds) =>
      nds.map((n) => {
        if (idSet.has(n.id)) {
          const nextStarred = starred !== undefined ? starred : !n.data?.starred;
          return {
            ...n,
            data: {
              ...n.data,
              starred: nextStarred,
            },
          };
        }
        return n;
      })
    );
  }, [saveHistory]);

  const hasHistory = nodes.length > 0 || past.length > 0;
  const canUndo = past.length > 0;
  const canRedo = future.length > 0;

  const updateNodeNotes = useCallback((nodeId: string, notes: string) => {
    setNodes((nds) => nds.map((n) => {
      if (n.id === nodeId) {
        return { ...n, data: { ...n.data, notes } };
      }
      return n;
    }));
  }, []);

  const updateNodeColor = useCallback((nodeId: string, color?: string) => {
    setNodes((nds) => nds.map((n) => {
      if (n.id === nodeId) {
        return { ...n, data: { ...n.data, color } };
      }
      return n;
    }));
  }, []);

  const highlightMatches = useCallback((matchedIds: string[], currentMatchedId?: string) => {
    setNodes((nds) => nds.map((n) => ({
      ...n,
      data: {
        ...n.data,
        isSearchMatch: matchedIds.includes(n.id),
        isCurrentSearchMatch: n.id === currentMatchedId,
      }
    })));
  }, []);

  return {
    nodes,
    edges,
    hasHistory,
    canUndo,
    canRedo,
    setGraphData,
    loadGraphData,
    updateNodeData,
    updateNodeNotes,
    updateNodeColor,
    highlightMatches,
    deleteNode,
    batchDelete,
    clearAll,
    undo,
    redo,
    toggleStar,
    batchStar,
  };
}
