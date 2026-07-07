import { useState, useCallback, useEffect } from 'react';
import { Node, Edge } from '@xyflow/react';

export interface SavedSession {
  id: string;
  name: string;
  date: string;
  nodes: Node[];
  edges: Edge[];
}

const SESSIONS_STORAGE_KEY = 't9orat_saved_sessions';

export function useSessions() {
  const [sessions, setSessions] = useState<SavedSession[]>([]);

  // Load sessions from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(SESSIONS_STORAGE_KEY);
      if (saved) {
        setSessions(JSON.parse(saved));
      }
    } catch (e) {
      console.error("Failed to load saved sessions", e);
    }
  }, []);

  // Save sessions to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem(SESSIONS_STORAGE_KEY, JSON.stringify(sessions));
  }, [sessions]);

  const saveCurrentSession = useCallback((name: string, nodes: Node[], edges: Edge[]) => {
    const newSession: SavedSession = {
      id: crypto.randomUUID(),
      name,
      date: new Date().toISOString(),
      nodes,
      edges,
    };
    setSessions((prev) => [newSession, ...prev]);
  }, []);

  const deleteSession = useCallback((id: string) => {
    setSessions((prev) => prev.filter((s) => s.id !== id));
  }, []);

  return {
    sessions,
    saveCurrentSession,
    deleteSession
  };
}
