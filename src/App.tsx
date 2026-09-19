import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Node, Edge, ReactFlowProvider, useReactFlow } from '@xyflow/react';
import { motion, AnimatePresence } from 'motion/react';
import { toPng } from 'html-to-image';
import { AlertCircle, UploadCloud } from 'lucide-react';

import { NodeType, AppConfig, SearchQuery } from './types';
import { generateGraphData, expandNode, generateSummary, askAIAboutNode } from './lib/ai';
import { applyForceLayout, applyIncrementalLayout } from './lib/layoutAlgorithm';
import { exportToMarkdown } from './lib/exportMarkdown';
import { validateAndParseMindMapJSON, exportMindMapToJSON } from './lib/jsonExport';
import { loadEncryptedConfig, saveEncryptedConfig } from './lib/crypto';
import { useGraphState } from './hooks/useGraphState';
import { useSessions } from './hooks/useSessions';

import {
  TopBar, FloatingDock, CanvasControls, InMapSearch,
  MapStatsModal, KeyboardShortcutsModal, ShareModal, SearchBar,
  GraphCanvas, SidePanel, ConfigScreen, IntroScreen, SessionsScreen, SummaryModal
} from './components';

const spring = { type: 'spring', stiffness: 350, damping: 25 };

function AppContent() {
  const [hasSeenIntro, setHasSeenIntro] = useState(() => sessionStorage.getItem('introSeen') === 'true');
  const [config, setConfig] = useState<AppConfig | null>(() => loadEncryptedConfig());

  const {
    nodes, edges, hasHistory, canUndo, canRedo,
    setGraphData, loadGraphData, deleteNode, clearAll, undo, redo, toggleStar, updateNodeData
  } = useGraphState();
  const { sessions, saveCurrentSession, deleteSession } = useSessions();
  const { fitView } = useReactFlow();

  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(hasHistory);
  const [sessionName, setSessionName] = useState('جلسة فكرية جديدة');
  const [suggestedTopics, setSuggestedTopics] = useState<{ title: string; description: string }[]>([]);
  const [contrarianTopics, setContrarianTopics] = useState<{ title: string; description: string }[]>([]);
  const [panelData, setPanelData] = useState<{
    type: 'node' | 'edge'; nodeId?: string; title?: string; description: string;
    nodeType?: NodeType; ideaContext?: string; recommendationType?: string; starred?: boolean;
    notes?: string; color?: string;
    searchQueries?: { label: string; query: string; site: 'google' | 'scholar' | 'youtube' | 'wikipedia' }[];
  } | null>(null);

  const [showConfig, setShowConfig] = useState(!config);
  const [showSessions, setShowSessions] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [summaryText, setSummaryText] = useState('');
  const [isSummaryLoading, setIsSummaryLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'error' | 'info' } | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(() => localStorage.getItem('t9orat_theme') !== 'light');
  const [isDragging, setIsDragging] = useState(false);
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const closeModals = () => { setPanelData(null); setShowSearch(false); setShowStats(false); setShowShortcuts(false); setShowShare(false); setShowSummary(false); setShowSessions(false); };

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDarkMode);
    localStorage.setItem('t9orat_theme', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  useEffect(() => { if (config) localStorage.setItem('symphony_config', JSON.stringify(config)); }, [config]);
  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 3500);
      return () => clearTimeout(t);
    }
  }, [toast]);

  const handleFitView = useCallback(() => fitView({ padding: 0.2, duration: 400 }), [fitView]);

  const handleSearch = async (keywords: string[], isNewSearch = false) => {
    if (!config) return;
    setIsLoading(true); setPanelData(null); setHasSearched(true);
    if (keywords.length > 0) setSessionName(keywords.join(' • '));
    try {
      const ctx = isNewSearch ? [] : nodes.map(n => ({ id: n.id, label: (n.data.label as string) || '' }));
      const graphData = await generateGraphData(keywords, config, ctx);
      if (graphData.suggestedTopics) setSuggestedTopics(graphData.suggestedTopics);
      if (graphData.contrarianTopics) setContrarianTopics(graphData.contrarianTopics);
      const layout = (nodes.length === 0 || isNewSearch) ? await applyForceLayout(graphData) : await applyIncrementalLayout(nodes, edges, graphData);
      setGraphData(layout.nodes, layout.edges);
      setTimeout(() => handleFitView(), 200);
    } catch (err: unknown) {
      const msg = err instanceof Error && err.message.includes('402') ? 'الرصيد غير كافٍ' : 'حدث خطأ أثناء التوليد';
      setToast({ message: msg, type: 'error' });
      if (nodes.length === 0) setHasSearched(false);
    } finally { setIsLoading(false); }
  };

  const handleExpandNode = useCallback(async (nodeId: string, nodeLabel: string) => {
    if (!config) return;
    setIsLoading(true); setPanelData(null);
    try {
      const ctx = nodes.map(n => ({ id: n.id, label: (n.data.label as string) || '' }));
      const newGraph = await expandNode(nodeId, nodeLabel, config, ctx);
      const layout = await applyIncrementalLayout(nodes, edges, newGraph);
      setGraphData(layout.nodes, layout.edges);
      setToast({ message: 'تم توسيع الفكرة بنجاح', type: 'info' });
    } catch { setToast({ message: 'عذراً، حدث خطأ أثناء توسيع الفكرة', type: 'error' }); }
    finally { setIsLoading(false); }
  }, [config, nodes, edges, setGraphData]);

  const handleRegenerateBranches = useCallback(async (nodeId: string, nodeLabel: string) => {
    if (!config) return;
    setIsLoading(true); setPanelData(null);
    try {
      const outgoingTargets = edges.filter(e => e.source === nodeId).map(e => e.target);
      const remainingEdges = edges.filter(e => e.source !== nodeId);
      const remainingNodes = nodes.filter(n => !outgoingTargets.includes(n.id) || n.data?.type === 'input');
      const ctx = remainingNodes.map(n => ({ id: n.id, label: (n.data?.label as string) || '' }));
      const newGraph = await expandNode(nodeId, nodeLabel, config, ctx);
      const layout = await applyIncrementalLayout(remainingNodes, remainingEdges, newGraph);
      setGraphData(layout.nodes, layout.edges);
      setToast({ message: 'تمت إعادة توليد الفروع بنجاح', type: 'info' });
    } catch { setToast({ message: 'عذراً، حدث خطأ أثناء إعادة توليد الفروع', type: 'error' }); }
    finally { setIsLoading(false); }
  }, [config, nodes, edges, setGraphData]);

  const handleImportJsonFile = async (file: File) => {
    try {
      const text = await file.text();
      const parsed = validateAndParseMindMapJSON(text);
      loadGraphData(parsed.nodes, parsed.edges);
      setHasSearched(true);
      if (parsed.title) setSessionName(parsed.title);
      setToast({ message: `تم استيراد ${parsed.nodes.length} عقدة بنجاح`, type: 'info' });
      setTimeout(() => handleFitView(), 250);
    } catch (e: unknown) {
      setToast({ message: e instanceof Error ? e.message : 'فشل قراءة الملف', type: 'error' });
    }
  };

  const handleExportPng = useCallback(() => {
    if (!reactFlowWrapper.current) return;
    toPng(reactFlowWrapper.current, { backgroundColor: '#0A0A0C' })
      .then((url) => {
        const a = document.createElement('a'); a.download = `${sessionName}.png`; a.href = url; a.click();
        setToast({ message: 'تم حفظ الصورة بنجاح', type: 'info' });
      })
      .catch(() => setToast({ message: 'فشل حفظ الصورة', type: 'error' }));
  }, [sessionName]);

  const handleSummary = useCallback(async () => {
    if (!config || nodes.length === 0) return;
    setShowSummary(true); setIsSummaryLoading(true); setSummaryText('');
    try {
      const nds = nodes.map(n => ({ id: n.id, label: (n.data.label as string) || '', description: (n.data.description as string) || '', type: (n.data.type as string) || 'idea' }));
      const eds = edges.map(e => ({ source: e.source, target: e.target, explanation: (e.data?.explanation as string) || '' }));
      setSummaryText(await generateSummary(nds, eds, config));
    } catch { setToast({ message: 'فشل توليد الملخص', type: 'error' }); setShowSummary(false); }
    finally { setIsSummaryLoading(false); }
  }, [config, nodes, edges]);

  // Global Keyboard Shortcuts
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const isInput = ['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName) || (e.target as HTMLElement)?.isContentEditable;
      if (isInput) return;
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'f') { e.preventDefault(); setShowSearch(true); }
      else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z' && !e.shiftKey) { e.preventDefault(); undo(); }
      else if (((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') || ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'z')) { e.preventDefault(); redo(); }
      else if (e.key === 'Delete' || e.key === 'Backspace') {
        if (panelData?.nodeId) { deleteNode(panelData.nodeId); setPanelData(null); setToast({ message: 'تم حذف العقدة', type: 'info' }); }
      } else if (e.key === 'Escape') {
        closeModals();
      } else if (e.key === '?' || (e.shiftKey && e.key === '/')) { e.preventDefault(); setShowShortcuts(true); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [panelData, undo, redo, deleteNode]);

  const selectNodeInPanel = (n: Node) => setPanelData({
    type: 'node', nodeId: n.id, title: n.data.label as string, description: n.data.description as string,
    nodeType: n.data.type as NodeType, ideaContext: n.data.ideaContext as string,
    recommendationType: n.data.recommendationType as string, starred: n.data.starred as boolean,
    notes: n.data.userNotes as string, color: n.data.customColor as string,
    searchQueries: n.data.searchQueries as SearchQuery[] | undefined
  });

  return (
    <div className="fixed inset-0 bg-bg-base text-text-main font-sans overflow-hidden flex flex-col select-none">
      <AnimatePresence mode="wait">
        {!hasSeenIntro && (
          <motion.div key="intro" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-[100]">
            <IntroScreen onStart={() => { sessionStorage.setItem('introSeen', 'true'); setHasSeenIntro(true); }} />
          </motion.div>
        )}
        {hasSeenIntro && (showConfig || !config) && (
          <motion.div key="cfg" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-[90] flex items-center justify-center bg-bg-base/80 backdrop-blur-md p-4">
            <ConfigScreen savedConfig={config} onCancel={config ? () => setShowConfig(false) : undefined} onSaved={(c) => { saveEncryptedConfig(c); setConfig(c); setShowConfig(false); }} />
          </motion.div>
        )}
        {hasSeenIntro && showSessions && (
          <motion.div key="ses" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-[90] flex items-center justify-center bg-bg-base/80 backdrop-blur-md p-4">
            <SessionsScreen sessions={sessions} currentNodes={nodes} currentEdges={edges} onSaveCurrent={saveCurrentSession} onLoadSession={(s) => { loadGraphData(s.nodes, s.edges); setSessionName(s.name); setShowSessions(false); }} onDeleteSession={deleteSession} onClose={() => setShowSessions(false)} />
          </motion.div>
        )}
      </AnimatePresence>

      {hasSeenIntro && config && (
        <div className="relative z-10 w-full h-full flex flex-col">
          <TopBar sessionName={sessionName} nodesCount={nodes.length} isDarkMode={isDarkMode} onOpenStats={() => setShowStats(true)} onOpenShortcuts={() => setShowShortcuts(true)} onOpenShare={() => setShowShare(true)} onOpenSettings={() => setShowConfig(true)} onToggleTheme={() => setIsDarkMode(!isDarkMode)} />
          <div className="relative z-20 shrink-0 p-3 md:p-6 pb-0">
            <SearchBar onSearch={handleSearch} isLoading={isLoading} hasSearched={hasSearched} suggestedTopics={suggestedTopics} contrarianTopics={contrarianTopics} onOpenConfig={() => setShowConfig(true)} />
          </div>
          <div
            className="flex-1 relative w-full overflow-hidden"
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => { e.preventDefault(); setIsDragging(false); if (e.dataTransfer.files?.[0]) handleImportJsonFile(e.dataTransfer.files[0]); }}
          >
            {hasSearched && (
              <div className="absolute inset-0 z-10" ref={reactFlowWrapper}>
                <GraphCanvas nodes={nodes} edges={edges} onNodeClick={selectNodeInPanel} onEdgeClick={(e) => setPanelData({ type: 'edge', description: (e.data?.explanation as string) || 'لا يوجد شرح لهذا الرابط.' })} />
                <CanvasControls className="absolute bottom-20 md:bottom-8 right-4 md:right-6" onFitView={handleFitView} />
                <FloatingDock canUndo={canUndo} canRedo={canRedo} hasNodes={nodes.length > 0} onUndo={undo} onRedo={redo} onFitView={handleFitView} onOpenSearch={() => setShowSearch(true)} onOpenSessions={() => setShowSessions(true)} onExportPng={handleExportPng} onExportMarkdown={() => exportToMarkdown(nodes, edges)} onExportJson={() => exportMindMapToJSON(nodes, edges, sessionName)} onImportJson={handleImportJsonFile} onOpenSummary={handleSummary} onOpenStats={() => setShowStats(true)} onClearAll={() => { clearAll(); setHasSearched(false); setPanelData(null); }} />
              </div>
            )}
            <AnimatePresence>
              {isDragging && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-50 flex items-center justify-center bg-bg-base/80 backdrop-blur-md border-2 border-dashed border-accent-primary m-4 rounded-3xl" dir="rtl">
                  <div className="flex flex-col items-center gap-3 text-accent-primary"><UploadCloud className="w-12 h-12 animate-bounce" /><p className="font-bold text-lg">أفلت ملف الخريطة الذهنية (JSON) للاستيراد الفوري</p></div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      )}

      <SidePanel
        isOpen={!!panelData}
        onClose={() => setPanelData(null)}
        data={panelData}
        onDeleteNode={(id) => { deleteNode(id); setPanelData(null); }}
        onExpandNode={handleExpandNode}
        onRegenerateBranches={handleRegenerateBranches}
        onToggleStar={toggleStar}
        onUpdateNotes={(id, notes) => updateNodeData(id, { userNotes: notes })}
        onUpdateColor={(id, color) => updateNodeData(id, { customColor: color })}
        onAskAI={async (nodeId, question) => {
          if (!config) throw new Error('يرجى ضبط مفتاح الـ API في الإعدادات أولاً');
          const target = nodes.find(n => n.id === nodeId);
          return await askAIAboutNode(
            (target?.data?.label as string) || '',
            (target?.data?.description as string) || '',
            question,
            config
          );
        }}
      />
      <InMapSearch isOpen={showSearch} nodes={nodes} onClose={() => setShowSearch(false)} onSelectNode={selectNodeInPanel} />
      <MapStatsModal isOpen={showStats} onClose={() => setShowStats(false)} nodes={nodes} edges={edges} sessionName={sessionName} />
      <KeyboardShortcutsModal isOpen={showShortcuts} onClose={() => setShowShortcuts(false)} />
      <ShareModal isOpen={showShare} onClose={() => setShowShare(false)} nodes={nodes} edges={edges} sessionName={sessionName} onNotify={(msg) => setToast({ message: msg, type: 'info' })} />
      <AnimatePresence>{showSummary && <SummaryModal summary={summaryText} isLoading={isSummaryLoading} onClose={() => setShowSummary(false)} />}</AnimatePresence>
      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity: 0, y: 20, scale: 0.9, x: '-50%' }} animate={{ opacity: 1, y: 0, scale: 1, x: '-50%' }} exit={{ opacity: 0, y: 10, scale: 0.9, x: '-50%' }} transition={spring} className="fixed bottom-24 md:bottom-28 left-1/2 z-[200] max-w-[90vw]" dir="rtl">
            <div className={`flex items-center gap-3 px-5 py-3 rounded-full border soft-shadow ${toast.type === 'error' ? 'bg-red-500/15 border-red-500/30 text-red-200' : 'bg-bg-surface/95 border-border-subtle text-text-main backdrop-blur-xl'}`}>
              {toast.type === 'error' && <AlertCircle className="w-5 h-5 text-red-400" />}
              <p className="text-sm font-medium">{toast.message}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function App() {
  return (
    <ReactFlowProvider>
      <AppContent />
    </ReactFlowProvider>
  );
}