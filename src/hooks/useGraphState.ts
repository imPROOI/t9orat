import { useState, useCallback, useEffect } from 'react';
import { Node, Edge } from '@xyflow/react';

interface HistoryState {
  nodes: Node[];
  edges: Edge[];
}

const STORAGE_KEY = 'symphony_graph_session';

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

  // Save to localStorage on change
  useEffect(() => {
    if (nodes.length > 0 || edges.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ nodes, edges }));
    } else if (nodes.length === 0 && edges.length === 0) {
      localStorage.removeItem(STORAGE_KEY);
    }
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

  const deleteNode = useCallback((nodeId: string) => {
    saveHistory();
    setNodes((nds) => nds.filter((n) => n.id !== nodeId));
    setEdges((eds) => eds.filter((e) => e.source !== nodeId && e.target !== nodeId));
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

  const hasHistory = nodes.length > 0 || past.length > 0;
  const canUndo = past.length > 0;
  const canRedo = future.length > 0;

  return {
    nodes,
    edges,
    hasHistory,
    canUndo,
    canRedo,
    setGraphData,
    deleteNode,
    clearAll,
    undo,
    redo,
    toggleStar
  };
}
