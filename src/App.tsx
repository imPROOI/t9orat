import { useState, useCallback, useRef, useEffect } from 'react';
import { Node, Edge } from '@xyflow/react';
import { SearchBar } from './components/SearchBar';
import { GraphCanvas } from './components/GraphCanvas';
import { SidePanel } from './components/SidePanel';
import { ConfigScreen } from './components/ConfigScreen';
import { IntroScreen } from './components/IntroScreen';
import { generateGraphData, expandNode, generateSummary } from './lib/ai';
import { applyForceLayout, applyIncrementalLayout } from './lib/layoutAlgorithm';
import { NodeType, AppConfig } from './types';
import { toPng } from 'html-to-image';
import { Download, Trash2, AlertCircle, Sparkles, Settings, Undo2, Redo2, Moon, Sun, FolderOpen, FileText, BookOpen } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useGraphState } from './hooks/useGraphState';
import { useSessions } from './hooks/useSessions';
import { exportToMarkdown } from './lib/exportMarkdown';
import { SessionsScreen } from './components/SessionsScreen';
import { SummaryModal } from './components/SummaryModal';

// حركة ارتداد سلسة وفخمة (Smooth Spring Physics)
const premiumSpring = { type: "spring", stiffness: 350, damping: 25 };

export default function App() {
  const [hasSeenIntro, setHasSeenIntro] = useState(() => {
    return sessionStorage.getItem('introSeen') === 'true';
  });

  const [config, setConfig] = useState<AppConfig | null>(() => {
    try {
      const saved = localStorage.getItem('symphony_config');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (!parsed.provider) parsed.provider = 'gemini';
        return parsed;
      }
      return null;
    } catch {
      return null;
    }
  });

  const {
    nodes,
    edges,
    hasHistory,
    canUndo,
    canRedo,
    setGraphData,
    deleteNode: deleteGraphNode,
    clearAll: clearGraphAll,
    undo,
    redo,
    toggleStar
  } = useGraphState();

  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(hasHistory);
  
  useEffect(() => {
    if (hasHistory) {
      setHasSearched(true);
    }
  }, [hasHistory]);
  const [suggestedTopics, setSuggestedTopics] = useState<{title: string, description: string}[]>([]);
  const [contrarianTopics, setContrarianTopics] = useState<{title: string, description: string}[]>([]);
  const [panelData, setPanelData] = useState<{
    type: 'node' | 'edge';
    nodeId?: string;
    title?: string;
    description: string;
    nodeType?: NodeType;
    ideaContext?: string;
    recommendationType?: string;
    starred?: boolean;
    searchQueries?: { label: string; query: string; site: 'google' | 'scholar' | 'youtube' | 'wikipedia' }[];
  } | null>(null);

  const [showConfig, setShowConfig] = useState(!config);
  const [showSessions, setShowSessions] = useState(false);
  const { sessions, saveCurrentSession, deleteSession } = useSessions();
  const [toast, setToast] = useState<{ message: string; type: 'error' | 'info' } | null>(null);
  const [showSummary, setShowSummary] = useState(false);
  const [summaryText, setSummaryText] = useState('');
  const [isSummaryLoading, setIsSummaryLoading] = useState(false);

  const [isDarkMode, setIsDarkMode] = useState(() => {
    return localStorage.getItem('t9orat_theme') === 'dark';
  });

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('t9orat_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('t9orat_theme', 'light');
    }
  }, [isDarkMode]);

  const reactFlowWrapper = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (config) {
      localStorage.setItem('symphony_config', JSON.stringify(config));
    }
  }, [config]);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3500);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const handleSearch = async (keywords: string[], isNewSearch: boolean = false) => {
    if (!config) return;
    setIsLoading(true);
    setPanelData(null);
    setHasSearched(true);
    
    try {
      const existingContext = isNewSearch ? [] : nodes.map(n => ({ id: n.id, label: (n.data.label as string) || '' }));
      const graphData = await generateGraphData(keywords, config, existingContext);

      if (graphData.suggestedTopics) setSuggestedTopics(graphData.suggestedTopics);
      if (graphData.contrarianTopics) setContrarianTopics(graphData.contrarianTopics);

      if (nodes.length === 0 || isNewSearch) {
        const { nodes: placedNodes, edges: placedEdges } = applyForceLayout(graphData);
        setGraphData(placedNodes, placedEdges);
      } else {
        const { nodes: placedNodes, edges: placedEdges } = applyIncrementalLayout(nodes, edges, graphData);
        setGraphData(placedNodes, placedEdges);
      }
    } catch (error) {
      console.error("Failed to generate graph:", error);
      let errorMessage = "عذراً، حدث خطأ أثناء التوليد. الرجاء المحاولة مرة أخرى.";
      if (error instanceof Error) {
        if (error.message.includes('402') || error.message.toLowerCase().includes('insufficient balance')) {
          errorMessage = "الرصيد غير كافٍ. يرجى الشحن أو تغيير المفتاح.";
        } else if (error.message.includes('401') || error.message.toLowerCase().includes('invalid api key')) {
          errorMessage = "مفتاح الـ API غير صالح.";
        }
      }
      setToast({ message: errorMessage, type: 'error' });
      if (nodes.length === 0) setHasSearched(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNodeClick = useCallback((node: Node) => {
    setPanelData({
      type: 'node',
      nodeId: node.id,
      title: node.data.label as string,
      description: node.data.description as string,
      nodeType: node.data.type as NodeType,
      ideaContext: node.data.ideaContext as string,
      recommendationType: node.data.recommendationType as string,
      starred: node.data.starred as boolean,
      searchQueries: node.data.searchQueries as any,
    });
  }, []);

  const handleEdgeClick = useCallback((edge: Edge) => {
    setPanelData({
      type: 'edge',
      description: edge.data?.explanation as string || 'لا يوجد شرح لهذا الرابط.',
    });
  }, []);

  const handleDeleteNode = useCallback((nodeId: string) => {
    deleteGraphNode(nodeId);
    setPanelData(null);
  }, [deleteGraphNode]);

  const handleClearAll = useCallback(() => {
    clearGraphAll();
    setHasSearched(false);
    setPanelData(null);
    setToast({ message: 'تم مسح اللوحة بنجاح', type: 'info' });
  }, [clearGraphAll]);

  const handleExpandNode = useCallback(async (nodeId: string, nodeLabel: string) => {
    if (!config) return;
    setIsLoading(true);
    setPanelData(null);
    
    try {
      const existingContext = nodes.map(n => ({ id: n.id, label: (n.data.label as string) || '' }));
      const newGraphData = await expandNode(nodeId, nodeLabel, config, existingContext);
      
      const { nodes: placedNodes, edges: placedEdges } = applyIncrementalLayout(nodes, edges, newGraphData);
      setGraphData(placedNodes, placedEdges);
      setToast({ message: 'تم توسيع الفكرة بنجاح', type: 'info' });
    } catch (error) {
      console.error("Failed to expand node:", error);
      let errorMessage = "عذراً، حدث خطأ أثناء توسيع الفكرة. الرجاء المحاولة مرة أخرى.";
      if (error instanceof Error) {
        if (error.message.includes('402') || error.message.toLowerCase().includes('insufficient balance')) {
          errorMessage = "الرصيد غير كافٍ. يرجى الشحن أو تغيير المفتاح.";
        } else if (error.message.includes('401') || error.message.toLowerCase().includes('invalid api key')) {
          errorMessage = "مفتاح الـ API غير صالح.";
        }
      }
      setToast({ message: errorMessage, type: 'error' });
    } finally {
      setIsLoading(false);
    }
  }, [config, nodes, edges, setGraphData]);

  const handleExport = useCallback(() => {
    if (reactFlowWrapper.current === null) return;

    // خلفية شفافة أو نفس لون الدارك مود أثناء التصدير
    toPng(reactFlowWrapper.current, { backgroundColor: '#0A0A0C' })
      .then((dataUrl) => {
        const link = document.createElement('a');
        link.download = 'symphony-graph.png';
        link.href = dataUrl;
        link.click();
        setToast({ message: 'تم حفظ الصورة', type: 'info' });
      })
      .catch((err) => {
        console.error('Failed to export graph', err);
        setToast({ message: 'فشل الحفظ', type: 'error' });
      });
  }, []);

  const handleExportMarkdown = useCallback(() => {
    exportToMarkdown(nodes, edges);
    setToast({ message: 'تم تصدير الخريطة كملف Markdown', type: 'info' });
  }, [nodes, edges]);

  const handleGenerateSummary = useCallback(async () => {
    if (!config || nodes.length === 0) return;
    setShowSummary(true);
    setIsSummaryLoading(true);
    setSummaryText('');
    try {
      const nodesData = nodes.map(n => ({
        id: n.id,
        label: (n.data.label as string) || '',
        description: (n.data.description as string) || '',
        type: (n.data.type as string) || 'idea',
      }));
      const edgesData = edges.map(e => ({
        source: e.source,
        target: e.target,
        explanation: (e.data?.explanation as string) || '',
      }));
      const result = await generateSummary(nodesData, edgesData, config);
      setSummaryText(result);
    } catch (error) {
      console.error('Failed to generate summary:', error);
      setToast({ message: 'فشل توليد الملخص', type: 'error' });
      setShowSummary(false);
    } finally {
      setIsSummaryLoading(false);
    }
  }, [config, nodes, edges]);

  const handleToggleStar = useCallback((nodeId: string) => {
    toggleStar(nodeId);
    setPanelData(prev => prev && prev.nodeId === nodeId ? { ...prev, starred: !prev.starred } : prev);
  }, [toggleStar]);

  return (
    <div className="fixed inset-0 bg-bg-base text-text-main font-sans selection:bg-accent-primary/30 overflow-hidden flex flex-col">
      
      {/* خلفية بتأثير إضاءة خافت وناعم */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-accent-primary/10 rounded-full blur-[120px]"></div>
      </div>

      <AnimatePresence mode="wait">
        {/* شاشة البداية */}
        {!hasSeenIntro && (
          <motion.div
            key="intro"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={premiumSpring}
            className="absolute inset-0 z-[100]"
          >
            <IntroScreen onStart={() => {
              sessionStorage.setItem('introSeen', 'true');
              setHasSeenIntro(true);
            }} />
          </motion.div>
        )}

        {/* شاشة الإعدادات */}
        {hasSeenIntro && (showConfig || !config) && (
          <motion.div
            key="config"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={premiumSpring}
            className="absolute inset-0 z-[90] flex items-center justify-center bg-bg-base/80 backdrop-blur-md p-4 overflow-y-auto"
          >
            <ConfigScreen 
              savedConfig={config} 
              onCancel={config ? () => setShowConfig(false) : undefined}
              onSaved={(newConfig) => {
                setConfig(newConfig);
                setShowConfig(false);
              }} 
            />
          </motion.div>
        )}

        {/* شاشة الجلسات */}
        {hasSeenIntro && showSessions && (
          <motion.div
            key="sessions"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={premiumSpring}
            className="absolute inset-0 z-[90] flex items-center justify-center bg-bg-base/80 backdrop-blur-md p-4 overflow-y-auto"
          >
            <SessionsScreen
              sessions={sessions}
              currentNodes={nodes}
              currentEdges={edges}
              onSaveCurrent={(name, n, e) => {
                saveCurrentSession(name, n, e);
                setToast({ message: 'تم حفظ الجلسة بنجاح', type: 'info' });
              }}
              onLoadSession={(session) => {
                setGraphData(session.nodes, session.edges);
                setShowSessions(false);
                setToast({ message: 'تم تحميل الجلسة بنجاح', type: 'info' });
              }}
              onDeleteSession={(id) => {
                deleteSession(id);
                setToast({ message: 'تم حذف الجلسة', type: 'info' });
              }}
              onClose={() => setShowSessions(false)}
            />
          </motion.div>
        )}

        {/* واجهة التطبيق الرئيسية */}
        {hasSeenIntro && config && !showConfig && (
          <motion.div
            key="main"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="relative z-10 w-full h-full flex flex-col"
          >
            {/* شريط البحث */}
            <div className="relative z-50 shrink-0 p-3 md:p-6 pb-0">
              <SearchBar 
                onSearch={handleSearch} 
                isLoading={isLoading} 
                hasSearched={hasSearched}
                suggestedTopics={suggestedTopics}
                contrarianTopics={contrarianTopics}
                onOpenConfig={() => setShowConfig(true)}
              />
            </div>

            {/* مساحة الرسم (اللوحة) */}
            <div className="flex-1 relative w-full overflow-hidden">
              {hasSearched && (
                <div className="absolute inset-0 z-10" ref={reactFlowWrapper}>
                  <GraphCanvas 
                    nodes={nodes} 
                    edges={edges} 
                    onNodeClick={handleNodeClick}
                    onEdgeClick={handleEdgeClick}
                  />
                </div>
              )}

              {/* شريط التحكم السفلي الزجاجي (Floating Dock) */}
              <AnimatePresence>
                {hasSearched && !isLoading && (
                  <motion.div 
                    initial={{ opacity: 0, y: 40, x: '-50%' }}
                    animate={{ opacity: 1, y: 0, x: '-50%' }}
                    exit={{ opacity: 0, y: 40, x: '-50%' }}
                    transition={premiumSpring}
                    className="absolute bottom-4 md:bottom-8 left-1/2 z-40 flex items-center gap-2 md:gap-3 px-3 md:px-4 py-2 md:py-3 bg-bg-glass backdrop-blur-xl border border-border-subtle rounded-full soft-shadow mobile-dock"
                  >
                    {!panelData && nodes.length > 0 && (
                      <div className="hidden md:flex items-center gap-2 pl-4 border-l border-border-subtle text-text-dim text-sm font-medium">
                        <Sparkles className="w-4 h-4 text-accent-primary" />
                        <span>انقر على الأشكال للاستكشاف</span>
                      </div>
                    )}

                    <div className="flex items-center gap-1 md:gap-2">
                      <motion.button
                        whileHover={{ scale: 1.05, backgroundColor: 'rgba(255,255,255,0.05)' }}
                        whileTap={{ scale: 0.95 }}
                        onClick={undo}
                        disabled={!canUndo}
                        className={`flex items-center justify-center w-10 h-10 rounded-full transition-colors ${canUndo ? 'text-text-dim hover:text-text-main' : 'text-text-dim/30 cursor-not-allowed'}`}
                        title="تراجع"
                      >
                        <Undo2 className="w-5 h-5" />
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.05, backgroundColor: 'rgba(255,255,255,0.05)' }}
                        whileTap={{ scale: 0.95 }}
                        onClick={redo}
                        disabled={!canRedo}
                        className={`flex items-center justify-center w-10 h-10 rounded-full transition-colors ${canRedo ? 'text-text-dim hover:text-text-main' : 'text-text-dim/30 cursor-not-allowed'}`}
                        title="إعادة"
                      >
                        <Redo2 className="w-5 h-5" />
                      </motion.button>
                      <div className="w-px h-6 bg-border-subtle mx-1"></div>

                      <motion.button
                        whileHover={{ scale: 1.05, backgroundColor: 'rgba(255,255,255,0.05)' }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setShowSessions(true)}
                        className="flex items-center justify-center text-text-dim hover:text-text-main w-10 h-10 rounded-full transition-colors"
                        title="الجلسات المحفوظة"
                      >
                        <FolderOpen className="w-5 h-5" />
                      </motion.button>

                      <motion.button
                        whileHover={{ scale: 1.05, backgroundColor: 'rgba(255,255,255,0.05)' }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handleExport}
                        className="flex items-center justify-center text-text-dim hover:text-text-main w-10 h-10 rounded-full transition-colors"
                        title="حفظ الصورة"
                      >
                        <Download className="w-5 h-5" />
                      </motion.button>

                      <motion.button
                        whileHover={{ scale: 1.05, backgroundColor: 'rgba(255,255,255,0.05)' }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handleExportMarkdown}
                        className="flex items-center justify-center text-text-dim hover:text-text-main w-10 h-10 rounded-full transition-colors"
                        title="تصدير Markdown"
                      >
                        <FileText className="w-5 h-5" />
                      </motion.button>

                      <motion.button
                        whileHover={{ scale: 1.05, backgroundColor: 'rgba(255,255,255,0.05)' }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handleGenerateSummary}
                        className="flex items-center justify-center text-text-dim hover:text-text-main w-10 h-10 rounded-full transition-colors"
                        title="ملخص ذكي"
                      >
                        <BookOpen className="w-5 h-5" />
                      </motion.button>

                      <motion.button
                        whileHover={{ scale: 1.05, backgroundColor: 'rgba(248,113,113,0.1)' }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handleClearAll}
                        className="flex items-center justify-center text-text-dim hover:text-accent-red w-10 h-10 rounded-full transition-colors"
                        title="مسح الكل"
                      >
                        <Trash2 className="w-5 h-5" />
                      </motion.button>

                      <motion.button
                        whileHover={{ scale: 1.05, backgroundColor: 'rgba(255,255,255,0.05)' }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setShowConfig(true)}
                        className="flex items-center justify-center text-text-dim hover:text-text-main w-10 h-10 rounded-full transition-colors"
                        title="الإعدادات"
                      >
                        <Settings className="w-5 h-5" />
                      </motion.button>
                      
                      <div className="w-px h-6 bg-border-subtle mx-1"></div>

                      <motion.button
                        whileHover={{ scale: 1.05, backgroundColor: 'rgba(255,255,255,0.05)' }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setIsDarkMode(!isDarkMode)}
                        className="flex items-center justify-center text-text-dim hover:text-text-main w-10 h-10 rounded-full transition-colors"
                        title="الوضع المظلم / الفاتح"
                      >
                        {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                      </motion.button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* شاشة التحميل */}
              <AnimatePresence>
                {isLoading && (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 z-[60] flex items-center justify-center bg-bg-base/50 backdrop-blur-md pointer-events-none"
                    dir="rtl"
                  >
                    <div className="flex flex-col items-center gap-4 bg-bg-surface border border-border-subtle soft-shadow rounded-3xl p-8">
                      <motion.div 
                        animate={{ rotate: 360 }}
                        transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                        className="w-10 h-10 border-2 border-border-subtle border-t-accent-primary rounded-full"
                      />
                      <p className="text-text-main text-sm font-medium tracking-wide">
                        جاري التفكير وربط الأفكار...
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <SidePanel 
        isOpen={!!panelData} 
        onClose={() => setPanelData(null)} 
        data={panelData}
        onDeleteNode={handleDeleteNode}
        onExpandNode={handleExpandNode}
        onToggleStar={handleToggleStar}
      />

      {/* AI Summary Modal */}
      <AnimatePresence>
        {showSummary && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={premiumSpring}
            className="fixed inset-0 z-[90] flex items-center justify-center bg-bg-base/80 backdrop-blur-md p-3 md:p-4 overflow-y-auto"
          >
            <SummaryModal
              summary={summaryText}
              isLoading={isSummaryLoading}
              onClose={() => setShowSummary(false)}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* التنبيهات (Dynamic Island Style) */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9, x: '-50%' }}
            animate={{ opacity: 1, y: 0, scale: 1, x: '-50%' }}
            exit={{ opacity: 0, y: 10, scale: 0.9, x: '-50%' }}
            transition={premiumSpring}
            className="absolute bottom-28 left-1/2 z-[200] w-max max-w-[90vw]"
            dir="rtl"
          >
            <div className={`flex items-center gap-3 px-5 py-3 rounded-full border soft-shadow ${
              toast.type === 'error' 
                ? 'bg-red-500/10 border-red-500/20 text-red-200' 
                : 'bg-bg-surface border-border-subtle text-text-main'
            }`}>
              {toast.type === 'error' && <AlertCircle className="w-5 h-5 shrink-0 text-red-400" />}
              <p className="text-sm font-medium mt-0.5">{toast.message}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}