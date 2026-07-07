import { useState } from 'react';
import { Node, Edge } from '@xyflow/react';
import { FolderOpen, X, Save, Trash2, Download } from 'lucide-react';
import { motion } from 'motion/react';
import { SavedSession } from '../hooks/useSessions';

interface SessionsScreenProps {
  sessions: SavedSession[];
  currentNodes: Node[];
  currentEdges: Edge[];
  onSaveCurrent: (name: string, nodes: Node[], edges: Edge[]) => void;
  onLoadSession: (session: SavedSession) => void;
  onDeleteSession: (id: string) => void;
  onClose: () => void;
}

export function SessionsScreen({
  sessions,
  currentNodes,
  currentEdges,
  onSaveCurrent,
  onLoadSession,
  onDeleteSession,
  onClose
}: SessionsScreenProps) {
  const [sessionName, setSessionName] = useState('');

  const handleSave = () => {
    if (!sessionName.trim()) return;
    onSaveCurrent(sessionName, currentNodes, currentEdges);
    setSessionName('');
  };

  return (
    <div className="w-full max-w-2xl mx-auto bg-bg-surface/90 backdrop-blur-2xl border border-border-subtle rounded-3xl overflow-hidden soft-shadow" dir="rtl">
      <div className="flex items-center justify-between p-6 border-b border-border-subtle bg-bg-base/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-accent-primary/10 flex items-center justify-center text-accent-primary">
            <FolderOpen className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-text-main">إدارة الجلسات</h2>
            <p className="text-sm text-text-dim mt-1">حفظ واسترجاع الخرائط الذهنية</p>
          </div>
        </div>
        <button 
          onClick={onClose}
          className="p-2 text-text-dim hover:text-text-main hover:bg-bg-base rounded-full transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="p-6 space-y-8">
        
        {/* Save Current Session */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-text-dim uppercase tracking-wider">حفظ الجلسة الحالية</h3>
          <div className="flex gap-3">
            <input
              type="text"
              value={sessionName}
              onChange={(e) => setSessionName(e.target.value)}
              placeholder="اسم الجلسة (مثال: أفكار تسويقية)"
              className="flex-1 bg-bg-base border border-border-subtle rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-accent-primary focus:ring-1 focus:ring-accent-primary transition-all text-text-main"
            />
            <button
              onClick={handleSave}
              disabled={!sessionName.trim() || currentNodes.length === 0}
              className="px-6 py-3 bg-accent-primary text-white rounded-xl font-medium hover:bg-accent-secondary transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              حفظ
            </button>
          </div>
          {currentNodes.length === 0 && (
            <p className="text-xs text-text-dim mt-2">لا توجد أفكار في الخريطة الحالية لحفظها.</p>
          )}
        </div>

        {/* Saved Sessions List */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-text-dim uppercase tracking-wider">الجلسات المحفوظة</h3>
          
          {sessions.length === 0 ? (
            <div className="text-center py-8 bg-bg-base/50 rounded-xl border border-border-subtle border-dashed">
              <FolderOpen className="w-8 h-8 text-text-dim/50 mx-auto mb-3" />
              <p className="text-sm text-text-dim">لا توجد جلسات محفوظة بعد.</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
              {sessions.map((session) => (
                <div key={session.id} className="flex items-center justify-between p-4 bg-bg-base border border-border-subtle rounded-xl hover:border-accent-primary/50 transition-colors">
                  <div>
                    <h4 className="text-text-main font-medium">{session.name}</h4>
                    <p className="text-xs text-text-dim mt-1">
                      {new Date(session.date).toLocaleDateString('ar-EG', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      {' '} • {session.nodes.length} أفكار
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onLoadSession(session)}
                      className="p-2 text-accent-primary hover:bg-accent-primary/10 rounded-lg transition-colors"
                      title="تحميل الجلسة"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onDeleteSession(session.id)}
                      className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                      title="حذف الجلسة"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
