import { useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, BarChart3, Layers, GitFork, Star, 
  Lightbulb, Compass, FileText, TrendingUp 
} from 'lucide-react';
import { Node, Edge } from '@xyflow/react';

interface MapStatsModalProps {
  isOpen: boolean;
  onClose: () => void;
  nodes: Node[];
  edges: Edge[];
  sessionName?: string;
}

const springPhysics = { type: 'spring', stiffness: 350, damping: 25 };

export function MapStatsModal({
  isOpen,
  onClose,
  nodes,
  edges,
  sessionName = 'الجلسة الحالية',
}: MapStatsModalProps) {
  // Listen for Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const stats = useMemo(() => {
    const totalNodes = nodes.length;
    const totalEdges = edges.length;
    const starredNodes = nodes.filter((n) => n.data?.starred).length;
    const notesCount = nodes.filter((n) => typeof n.data?.notes === 'string' && (n.data.notes as string).trim().length > 0).length;

    const inputNodes = nodes.filter((n) => n.data?.type === 'input').length;
    const ideaNodes = nodes.filter((n) => n.data?.type === 'idea').length;
    const recommendationNodes = nodes.filter((n) => n.data?.type === 'recommendation').length;

    // Calculate maximum graph depth / levels
    let maxDepth = 0;
    if (totalNodes > 0) {
      const adj: Record<string, string[]> = {};
      const inDegree: Record<string, number> = {};

      nodes.forEach((n) => {
        adj[n.id] = [];
        inDegree[n.id] = 0;
      });

      edges.forEach((e) => {
        if (adj[e.source] && inDegree[e.target] !== undefined) {
          adj[e.source].push(e.target);
          inDegree[e.target] = (inDegree[e.target] || 0) + 1;
        }
      });

      let roots = nodes.filter((n) => inDegree[n.id] === 0).map((n) => n.id);
      if (roots.length === 0) {
        roots = nodes.filter((n) => n.data?.type === 'input').map((n) => n.id);
      }
      if (roots.length === 0) {
        roots = [nodes[0].id];
      }

      const memo: Record<string, number> = {};
      const visited = new Set<string>();

      const dfs = (nodeId: string): number => {
        if (memo[nodeId] !== undefined) return memo[nodeId];
        visited.add(nodeId);
        let maxChild = 0;
        for (const childId of (adj[nodeId] || [])) {
          if (!visited.has(childId)) {
            maxChild = Math.max(maxChild, dfs(childId));
          }
        }
        visited.delete(nodeId);
        memo[nodeId] = 1 + maxChild;
        return memo[nodeId];
      };

      roots.forEach((r) => {
        maxDepth = Math.max(maxDepth, dfs(r));
      });
    }

    const inputPct = totalNodes > 0 ? Math.round((inputNodes / totalNodes) * 100) : 0;
    const ideaPct = totalNodes > 0 ? Math.round((ideaNodes / totalNodes) * 100) : 0;
    const recPct = totalNodes > 0 ? Math.round((recommendationNodes / totalNodes) * 100) : 0;
    const avgConnections = totalNodes > 0 ? (totalEdges / totalNodes).toFixed(1) : '0';

    return {
      totalNodes,
      totalEdges,
      starredNodes,
      notesCount,
      inputNodes,
      ideaNodes,
      recommendationNodes,
      inputPct,
      ideaPct,
      recPct,
      maxDepth,
      avgConnections,
    };
  }, [nodes, edges]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div 
        className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md overflow-y-auto"
        onClick={onClose}
        dir="rtl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="map-stats-title"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={springPhysics}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-xl bg-bg-surface/95 backdrop-blur-2xl border border-border-subtle rounded-3xl soft-shadow overflow-hidden shadow-2xl flex flex-col max-h-[88dvh]"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-border-subtle bg-bg-base/40 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-accent-primary/10 border border-accent-primary/20 flex items-center justify-center text-accent-primary">
                <BarChart3 className="w-5 h-5" />
              </div>
              <div>
                <h3 id="map-stats-title" className="text-lg font-bold text-text-main">إحصائيات وتحليلات الخريطة</h3>
                <p className="text-xs text-text-dim mt-0.5">{sessionName}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-text-dim hover:text-text-main hover:bg-bg-base/80 rounded-full transition-colors"
              aria-label="إغلاق النافذة"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body Stats */}
          <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">
            {/* 4 Core KPIs */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-4 rounded-2xl bg-bg-base/70 border border-border-subtle flex flex-col justify-between">
                <div className="flex items-center justify-between text-text-dim mb-2">
                  <span className="text-xs font-semibold">إجمالي العقد</span>
                  <Layers className="w-3.5 h-3.5 text-accent-primary" />
                </div>
                <span className="text-2xl font-bold text-text-main font-mono">{stats.totalNodes}</span>
                <span className="text-[10px] text-text-dim mt-1">عنصر معرفي</span>
              </div>

              <div className="p-4 rounded-2xl bg-bg-base/70 border border-border-subtle flex flex-col justify-between">
                <div className="flex items-center justify-between text-text-dim mb-2">
                  <span className="text-xs font-semibold">الروابط</span>
                  <GitFork className="w-3.5 h-3.5 text-blue-400" />
                </div>
                <span className="text-2xl font-bold text-text-main font-mono">{stats.totalEdges}</span>
                <span className="text-[10px] text-text-dim mt-1">علاقة منطقية</span>
              </div>

              <div className="p-4 rounded-2xl bg-bg-base/70 border border-border-subtle flex flex-col justify-between">
                <div className="flex items-center justify-between text-text-dim mb-2">
                  <span className="text-xs font-semibold">أقصى عمق</span>
                  <TrendingUp className="w-3.5 h-3.5 text-purple-400" />
                </div>
                <span className="text-2xl font-bold text-text-main font-mono">{stats.maxDepth}</span>
                <span className="text-[10px] text-text-dim mt-1">مستويات تفرع</span>
              </div>

              <div className="p-4 rounded-2xl bg-bg-base/70 border border-border-subtle flex flex-col justify-between">
                <div className="flex items-center justify-between text-text-dim mb-2">
                  <span className="text-xs font-semibold">معدل الترابط</span>
                  <GitFork className="w-3.5 h-3.5 text-emerald-400" />
                </div>
                <span className="text-2xl font-bold text-text-main font-mono">{stats.avgConnections}</span>
                <span className="text-[10px] text-text-dim mt-1">رابط / عقدة</span>
              </div>
            </div>

            {/* Distribution Breakdown (Inputs vs Ideas vs Recommendations) */}
            <div className="p-5 rounded-2xl bg-bg-base/70 border border-border-subtle space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-text-main uppercase tracking-wider">توزيع الأفكار والمصادر</h4>
                <span className="text-xs text-text-dim font-mono">{stats.totalNodes} إجمالي</span>
              </div>

              {/* Multi-segment Bar */}
              <div className="w-full h-3 bg-bg-surface rounded-full overflow-hidden flex gap-0.5 p-0.5">
                <div 
                  style={{ width: `${stats.inputPct}%` }}
                  className="h-full bg-accent-primary rounded-full transition-all duration-500"
                  title={`مدخلات رئيسية: ${stats.inputPct}%`}
                />
                <div 
                  style={{ width: `${stats.ideaPct}%` }}
                  className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                  title={`أفكار وتحليلات: ${stats.ideaPct}%`}
                />
                <div 
                  style={{ width: `${stats.recPct}%` }}
                  className="h-full bg-purple-500 rounded-full transition-all duration-500"
                  title={`توصيات ومصادر: ${stats.recPct}%`}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-bg-surface/50 border border-border-subtle">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-accent-primary shrink-0" />
                    <span className="text-xs font-medium text-text-main">مدخلات رئيسية</span>
                  </div>
                  <span className="text-xs font-bold text-text-main font-mono">
                    {stats.inputNodes} <span className="text-text-dim text-[10px]">({stats.inputPct}%)</span>
                  </span>
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-xl bg-bg-surface/50 border border-border-subtle">
                  <div className="flex items-center gap-2">
                    <Lightbulb className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span className="text-xs font-medium text-text-main">أفكار وتحليلات</span>
                  </div>
                  <span className="text-xs font-bold text-text-main font-mono">
                    {stats.ideaNodes} <span className="text-text-dim text-[10px]">({stats.ideaPct}%)</span>
                  </span>
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-xl bg-bg-surface/50 border border-border-subtle">
                  <div className="flex items-center gap-2">
                    <Compass className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                    <span className="text-xs font-medium text-text-main">توصيات معرفية</span>
                  </div>
                  <span className="text-xs font-bold text-text-main font-mono">
                    {stats.recommendationNodes} <span className="text-text-dim text-[10px]">({stats.recPct}%)</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Starred Nodes and User Notes Written */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-4 rounded-2xl bg-bg-base/70 border border-border-subtle flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-2xl bg-amber-400/10 text-amber-500 flex items-center justify-center shrink-0">
                  <Star className="w-5 h-5 fill-amber-400" />
                </div>
                <div>
                  <div className="text-xl font-bold text-text-main font-mono">{stats.starredNodes}</div>
                  <div className="text-xs font-semibold text-text-main">العقد المميزة بنجمة</div>
                  <div className="text-[10px] text-text-dim mt-0.5">
                    {stats.totalNodes > 0 ? `${Math.round((stats.starredNodes / stats.totalNodes) * 100)}% من الإجمالي` : 'لا توجد عقد'}
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-bg-base/70 border border-border-subtle flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-2xl bg-sky-500/10 text-sky-500 flex items-center justify-center shrink-0">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xl font-bold text-text-main font-mono">{stats.notesCount}</div>
                  <div className="text-xs font-semibold text-text-main">ملاحظات شخصية مدونة</div>
                  <div className="text-[10px] text-text-dim mt-0.5">عقد تحتوي تعليقاتك الخاصة</div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 md:p-5 border-t border-border-subtle bg-bg-base/40 flex justify-end shrink-0">
            <button
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl bg-text-main text-bg-base text-xs font-bold hover:opacity-85 transition-all"
            >
              إغلاق
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
