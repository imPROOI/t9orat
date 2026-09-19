import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, Trash2, Search, GraduationCap, Youtube, BookOpen, Globe, 
  ExternalLink, Star, Sparkles, RefreshCw, Send, Copy, Check, 
  FileEdit, Palette, Loader2, RotateCcw
} from 'lucide-react';
import { NodeType } from '../types';
import { cn } from '../lib/utils';

const getSearchUrl = (site: string, query: string) => {
  const enc = encodeURIComponent(query);
  switch (site) {
    case 'scholar':
      return `https://scholar.google.com/scholar?q=${enc}`;
    case 'youtube':
      return `https://www.youtube.com/results?search_query=${enc}`;
    case 'wikipedia':
      return `https://ar.wikipedia.org/w/index.php?search=${enc}`;
    case 'google':
    default:
      return `https://www.google.com/search?q=${enc}`;
  }
};

const PALETTE_COLORS = [
  { id: 'default', label: 'افتراضي', class: 'bg-bg-surface border-2 border-border-subtle' },
  { id: 'emerald', label: 'زمردي',   class: 'bg-emerald-500' },
  { id: 'amber',   label: 'عنبري',   class: 'bg-amber-500' },
  { id: 'rose',    label: 'وردي',     class: 'bg-rose-500' },
  { id: 'sky',     label: 'سماوي',    class: 'bg-sky-500' },
  { id: 'violet',  label: 'بنفسجي',  class: 'bg-violet-500' },
] as const;

const AI_QUICK_PROMPTS = [
  'اشرح لي ببساطة',
  'أعطني أمثلة واقعية',
  'ما الفائدة والتطبيقات؟',
];

interface SidePanelProps {
  isOpen: boolean;
  onClose: () => void;
  onDeleteNode?: (nodeId: string) => void;
  onExpandNode?: (nodeId: string, nodeLabel: string) => void;
  onRegenerateBranches?: (nodeId: string, nodeLabel: string) => void;
  onToggleStar?: (nodeId: string) => void;
  onUpdateNotes?: (nodeId: string, notes: string) => void;
  onUpdateColor?: (nodeId: string, color?: string) => void;
  onAskAI?: (nodeId: string, question: string) => Promise<string>;
  data: {
    type: 'node' | 'edge';
    nodeId?: string;
    title?: string;
    description: string;
    nodeType?: NodeType;
    ideaContext?: string;
    recommendationType?: string;
    starred?: boolean;
    notes?: string;
    userNotes?: string;
    color?: string;
    customColor?: string;
    searchQueries?: {
      label: string;
      query: string;
      site: 'google' | 'scholar' | 'youtube' | 'wikipedia';
    }[];
  } | null;
}

const NODE_TYPE_META: Record<string, { label: string; dot: string }> = {
  input:          { label: 'المدخل الرئيسي',    dot: 'bg-accent-primary' },
  idea:           { label: 'تحليل فكري',         dot: 'bg-text-main' },
  recommendation: { label: 'توصية معرفية',       dot: 'bg-text-dim' },
};

export function SidePanel({ 
  isOpen, 
  onClose, 
  data, 
  onDeleteNode, 
  onExpandNode, 
  onRegenerateBranches,
  onToggleStar,
  onUpdateNotes,
  onUpdateColor,
  onAskAI
}: SidePanelProps) {
  const [activeTab, setActiveTab] = useState<'details' | 'context' | 'recommendation'>('details');
  const [localNotes, setLocalNotes] = useState('');
  const [customQuestion, setCustomQuestion] = useState('');
  const [isAskingAI, setIsAskingAI] = useState(false);
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);

  // Sync state on node selection
  useEffect(() => {
    setActiveTab('details');
    setLocalNotes(data?.notes || data?.userNotes || '');
    setCustomQuestion('');
    setAiResponse(null);
    setAiError(null);
    setIsCopied(false);
  }, [data?.nodeId, data?.notes, data?.userNotes]);

  // Keyboard Escape listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!data) return null;

  const isNode = data.type === 'node';
  const nodeType = data.nodeType;
  const typeMeta = nodeType ? NODE_TYPE_META[nodeType] : null;

  const availableTabs = [
    { id: 'details', label: 'التفاصيل' },
    ...(data.ideaContext         ? [{ id: 'context',        label: 'السياق'  }] : []),
    ...(data.recommendationType  ? [{ id: 'recommendation', label: 'المصادر' }] : []),
  ] as const;

  const handleNotesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setLocalNotes(value);
    if (data.nodeId && onUpdateNotes) {
      onUpdateNotes(data.nodeId, value);
    }
  };

  const handleSendAIQuestion = async (q: string) => {
    const trimmed = q.trim();
    if (!trimmed || !data.nodeId || !onAskAI) return;
    setIsAskingAI(true);
    setAiError(null);
    try {
      const response = await onAskAI(data.nodeId, trimmed);
      setAiResponse(response);
    } catch (err: any) {
      console.error('Failed to ask AI:', err);
      setAiError(err.message || 'حدث خطأ أثناء التواصل مع الذكاء الاصطناعي.');
    } finally {
      setIsAskingAI(false);
    }
  };

  const handleCopyAnswer = () => {
    if (!aiResponse) return;
    navigator.clipboard.writeText(aiResponse);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const currentColor = data.color || data.customColor || 'default';

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Mobile dim overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-[2px] z-40 md:hidden"
          />

          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={isNode ? `تفاصيل الفكرة: ${data.title || ''}` : 'تفاصيل الارتباط'}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 320, damping: 34 }}
            className={cn(
              // Mobile: bottom sheet
              'fixed inset-x-0 bottom-0 z-50 flex flex-col',
              'h-[85dvh] w-full rounded-t-[2rem]',
              // Desktop: side panel
              'md:absolute md:top-0 md:right-0 md:bottom-0 md:h-full',
              'md:w-[440px] md:rounded-none',
              // Surface & Glassmorphism
              'bg-bg-base text-text-main',
              'border-t border-border-subtle md:border-t-0 md:border-l md:border-border-subtle',
              'shadow-2xl md:shadow-[-8px_0_30px_rgba(0,0,0,0.05)] dark:md:shadow-[-8px_0_30px_rgba(0,0,0,0.2)]',
            )}
          >
            {/* Mobile drag pill */}
            <div className="w-12 h-1 bg-text-main/15 rounded-none mx-auto mt-4 mb-1 md:hidden pointer-events-none" />

            {/* Close button */}
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={onClose}
              aria-label="إغلاق اللوحة الجانبية"
              className={cn(
                'absolute top-4 left-4 md:top-5 md:right-5 md:left-auto z-10',
                'w-8 h-8 flex items-center justify-center rounded-full',
                'bg-text-main/5 hover:bg-text-main/10 text-text-main',
                'transition-colors duration-200'
              )}
            >
              <X className="w-4 h-4" />
            </motion.button>

            {/* Scrollable content */}
            <div
              className="flex-1 overflow-y-auto custom-scrollbar pt-4 md:pt-8 px-5 md:px-8 pb-8"
              dir="rtl"
            >
              {isNode ? (
                /* ── Node detail view ── */
                <div className="flex flex-col min-h-full">

                  {/* Type badge + title */}
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.45, delay: 0.05 }}
                    className="mb-5"
                  >
                    {typeMeta && (
                      <div className="flex items-center gap-2 mb-3">
                        <span className={cn('w-2 h-2 rounded-full shrink-0', typeMeta.dot)} />
                        <span className="text-[11px] font-sans font-semibold uppercase tracking-[0.16em] text-text-dim">
                          {typeMeta.label}
                        </span>
                      </div>
                    )}
                    <h2 className="text-2xl md:text-3xl font-bold text-text-main leading-snug">
                      {data.title}
                    </h2>
                  </motion.div>

                  {/* ── تلوين العقدة (Node Color Palette) ── */}
                  {data.nodeId && onUpdateColor && (
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="mb-5 p-3 rounded-2xl bg-bg-surface/50 border border-border-subtle"
                    >
                      <div className="flex items-center justify-between mb-2.5">
                        <span className="text-xs font-bold text-text-main flex items-center gap-1.5">
                          <Palette className="w-3.5 h-3.5 text-accent-primary" />
                          <span>تلوين العقدة:</span>
                        </span>
                        <span className="text-[11px] text-text-dim">
                          {PALETTE_COLORS.find(c => c.id === currentColor)?.label}
                        </span>
                      </div>
                      <div className="flex items-center gap-2.5">
                        {PALETTE_COLORS.map(c => {
                          const isSelected = currentColor === c.id;
                          return (
                            <button
                              key={c.id}
                              type="button"
                              onClick={() => onUpdateColor(data.nodeId as string, c.id === 'default' ? undefined : c.id)}
                              title={c.label}
                              aria-label={`لون ${c.label}`}
                              className={cn(
                                'relative w-7 h-7 rounded-full transition-all duration-200 cursor-pointer flex items-center justify-center',
                                c.class,
                                isSelected 
                                  ? 'ring-2 ring-offset-2 ring-offset-bg-base ring-text-main scale-110 shadow-sm' 
                                  : 'hover:scale-105 opacity-85 hover:opacity-100'
                              )}
                            >
                              {isSelected && (
                                <Check className={cn(
                                  'w-3.5 h-3.5',
                                  c.id === 'default' ? 'text-text-main' : 'text-white'
                                )} />
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}

                  {/* Tabs – render if more than one available */}
                  {availableTabs.length > 1 && (
                    <motion.div
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: 0.1 }}
                      className="flex gap-1 mb-5 p-1 rounded-xl bg-text-main/5 self-start"
                    >
                      {availableTabs.map(tab => (
                        <button
                          key={tab.id}
                          onClick={() => setActiveTab(tab.id as typeof activeTab)}
                          className={cn(
                            'px-4 py-1.5 text-xs font-semibold rounded-lg transition-all duration-200',
                            activeTab === tab.id
                              ? 'bg-text-main text-bg-base shadow-xs'
                              : 'text-text-dim hover:text-text-main'
                          )}
                        >
                          {tab.label}
                        </button>
                      ))}
                    </motion.div>
                  )}

                  {/* Tab content */}
                  <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className="flex-1 space-y-6"
                  >
                    {activeTab === 'details' && (
                      <div className="space-y-6">
                        {/* Node description */}
                        <p className="font-serif text-[15px] text-text-dim leading-loose whitespace-pre-line">
                          {data.description}
                        </p>

                        {/* ── اسأل الذكاء الاصطناعي عن هذه الفكرة ── */}
                        <div className="p-4 rounded-2xl bg-bg-surface border border-border-subtle space-y-3">
                          <div className="flex items-center justify-between">
                            <h4 className="text-xs font-bold text-text-main flex items-center gap-1.5">
                              <Sparkles className="w-3.5 h-3.5 text-accent-primary" />
                              <span>اسأل الذكاء الاصطناعي عن هذه الفكرة</span>
                            </h4>
                            {isAskingAI && (
                              <span className="flex items-center gap-1 text-[11px] text-accent-primary animate-pulse">
                                <Loader2 className="w-3 h-3 animate-spin" />
                                <span>جاري التفكير...</span>
                              </span>
                            )}
                          </div>

                          {/* Quick prompt chips */}
                          <div className="flex flex-wrap gap-1.5">
                            {AI_QUICK_PROMPTS.map((promptText, i) => (
                              <button
                                key={i}
                                disabled={isAskingAI || !onAskAI}
                                onClick={() => {
                                  setCustomQuestion(promptText);
                                  handleSendAIQuestion(promptText);
                                }}
                                className="px-2.5 py-1 text-xs rounded-lg border border-border-subtle bg-bg-base/70 text-text-dim hover:text-text-main hover:border-text-main/30 hover:bg-bg-base transition-all disabled:opacity-50"
                              >
                                {promptText}
                              </button>
                            ))}
                          </div>

                          {/* Custom Question input */}
                          <div className="flex items-center gap-1.5">
                            <input
                              type="text"
                              value={customQuestion}
                              onChange={(e) => setCustomQuestion(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' && !isAskingAI) {
                                  handleSendAIQuestion(customQuestion);
                                }
                              }}
                              placeholder="اطرح سؤالاً محدداً عن الفكرة..."
                              disabled={isAskingAI || !onAskAI}
                              className="flex-1 px-3 py-2 text-xs rounded-xl bg-bg-base border border-border-subtle text-text-main placeholder:text-text-dim/60 focus:outline-none focus:border-text-main/40 transition-colors"
                            />
                            <button
                              disabled={isAskingAI || !customQuestion.trim() || !onAskAI}
                              onClick={() => handleSendAIQuestion(customQuestion)}
                              className="p-2 rounded-xl bg-text-main text-bg-base hover:opacity-85 disabled:opacity-30 transition-all flex items-center justify-center shrink-0"
                              title="إرسال السؤال"
                            >
                              {isAskingAI ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                            </button>
                          </div>

                          {/* AI Error */}
                          {aiError && (
                            <p className="text-xs text-red-500 bg-red-500/10 p-2.5 rounded-xl border border-red-500/20">
                              {aiError}
                            </p>
                          )}

                          {/* AI Response display */}
                          {aiResponse && (
                            <motion.div
                              initial={{ opacity: 0, scale: 0.98 }}
                              animate={{ opacity: 1, scale: 1 }}
                              className="mt-3 p-3.5 rounded-xl bg-bg-base border border-border-subtle space-y-2 relative group"
                            >
                              <div className="flex items-center justify-between pb-2 border-b border-border-subtle text-text-dim text-[11px] font-medium">
                                <span className="flex items-center gap-1 text-text-main font-bold">
                                  <Sparkles className="w-3 h-3 text-accent-primary" />
                                  إجابة الذكاء الاصطناعي:
                                </span>
                                <div className="flex items-center gap-1">
                                  <button
                                    onClick={handleCopyAnswer}
                                    className="p-1 rounded hover:bg-bg-surface text-text-dim hover:text-text-main transition-colors flex items-center gap-1 text-[10px]"
                                    title="نسخ الإجابة"
                                  >
                                    {isCopied ? (
                                      <>
                                        <Check className="w-3 h-3 text-emerald-500" />
                                        <span className="text-emerald-500 font-bold">تم النسخ</span>
                                      </>
                                    ) : (
                                      <>
                                        <Copy className="w-3 h-3" />
                                        <span>نسخ</span>
                                      </>
                                    )}
                                  </button>
                                  <button
                                    onClick={() => setAiResponse(null)}
                                    className="p-1 rounded hover:bg-bg-surface text-text-dim hover:text-text-main transition-colors"
                                    title="مسح الإجابة"
                                  >
                                    <X className="w-3 h-3" />
                                  </button>
                                </div>
                              </div>
                              <p className="font-serif text-[13px] md:text-[14px] text-text-main/90 leading-relaxed whitespace-pre-line">
                                {aiResponse}
                              </p>
                            </motion.div>
                          )}
                        </div>

                        {/* ── ملاحظاتي الشخصية (Personal Notes) ── */}
                        <div className="p-4 rounded-2xl bg-bg-surface border border-border-subtle space-y-2.5">
                          <div className="flex items-center justify-between">
                            <h4 className="text-xs font-bold text-text-main flex items-center gap-1.5">
                              <FileEdit className="w-3.5 h-3.5 text-accent-primary" />
                              <span>ملاحظاتي الشخصية</span>
                            </h4>
                            <span className="text-[10px] text-text-dim/80 flex items-center gap-1">
                              <Check className="w-2.5 h-2.5 text-emerald-500" />
                              <span>حفظ تلقائي</span>
                            </span>
                          </div>
                          <textarea
                            value={localNotes}
                            onChange={handleNotesChange}
                            rows={3}
                            placeholder="اكتب أفكارك وملاحظاتك الشخصية أو روابط متعلقة بهذه الفكرة..."
                            className="w-full p-3 text-xs md:text-[13px] rounded-xl bg-bg-base border border-border-subtle text-text-main placeholder:text-text-dim/60 focus:outline-none focus:border-text-main/40 transition-colors resize-y leading-relaxed font-sans"
                          />
                          <div className="flex justify-between items-center text-[10px] text-text-dim">
                            <span>تُحفظ الملاحظات ضمن جلسة الخريطة</span>
                            <span>{localNotes.length} حرف</span>
                          </div>
                        </div>

                        {/* ── أبحاث ومصادر مقترحة للاستزادة ── */}
                        {data.searchQueries && data.searchQueries.length > 0 && (
                          <div className="pt-4 border-t border-border-subtle">
                            <h4 className="text-xs font-sans font-bold text-text-main mb-3 flex items-center gap-1.5">
                              <Search className="w-3.5 h-3.5 text-accent-primary" />
                              <span>أبحاث ومصادر مقترحة للاستزادة:</span>
                            </h4>
                            <div className="space-y-2.5">
                              {data.searchQueries.map((item, idx) => {
                                const Icon = item.site === 'scholar' ? GraduationCap
                                           : item.site === 'youtube' ? Youtube
                                           : item.site === 'wikipedia' ? BookOpen
                                           : Globe;
                                const searchUrl = getSearchUrl(item.site, item.query);
                                return (
                                  <a
                                    key={idx}
                                    href={searchUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center justify-between p-3 rounded-2xl border border-border-subtle bg-bg-surface hover:bg-border-subtle/40 hover:border-text-main/20 transition-all group"
                                  >
                                    <div className="flex items-center gap-2.5">
                                      <div className="w-7 h-7 rounded-lg bg-bg-base flex items-center justify-center text-text-main/80 group-hover:text-text-main">
                                        <Icon className="w-3.5 h-3.5" />
                                      </div>
                                      <div className="text-right">
                                        <div className="text-xs font-bold text-text-main">{item.label}</div>
                                        <div className="text-[10px] text-text-dim font-mono line-clamp-1">{item.query}</div>
                                      </div>
                                    </div>
                                    <ExternalLink className="w-3.5 h-3.5 text-text-dim group-hover:text-text-main transition-colors ml-1" />
                                  </a>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {activeTab === 'context' && data.ideaContext && (
                      <div className="pr-4 border-r-2 border-text-main">
                        <h3 className="text-[10px] font-bold uppercase tracking-[0.18em] text-text-main mb-3">
                          سياق الفكرة
                        </h3>
                        <p className="font-medium text-[15px] text-text-dim leading-loose">
                          {data.ideaContext}
                        </p>
                      </div>
                    )}

                    {activeTab === 'recommendation' && data.recommendationType && (
                      <div className="pr-4 border-r-2 border-border-subtle">
                        <h3 className="text-[10px] font-sans font-semibold uppercase tracking-[0.18em] text-text-dim mb-3">
                          نوع المصدر
                        </h3>
                        <p className="font-serif text-[15px] text-text-dim leading-loose">
                          {data.recommendationType}
                        </p>
                      </div>
                    )}
                  </motion.div>

                  {/* ── Actions Footer ── */}
                  <div className="mt-auto pt-5 border-t border-border-subtle flex flex-col gap-2">
                    {data.nodeId && onToggleStar && (
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                        <button
                          onClick={() => onToggleStar(data.nodeId as string)}
                          className={cn(
                            'w-full flex items-center justify-center gap-2',
                            'py-3 rounded-xl text-xs md:text-sm font-bold',
                            'transition-all duration-300 border',
                            data.starred
                              ? 'bg-amber-400/10 text-amber-500 border-amber-400/40 hover:bg-amber-400/20'
                              : 'text-text-main bg-bg-surface border-border-subtle hover:border-text-main'
                          )}
                        >
                          <Star className={cn('w-4 h-4', data.starred && 'fill-amber-400 text-amber-400')} />
                          {data.starred ? 'إزالة من المفضلة' : 'تمييز كفكرة مهمة'}
                        </button>
                      </motion.div>
                    )}

                    {/* Expand & Regenerate grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {data.nodeId && onExpandNode && (
                        <button
                          onClick={() => onExpandNode(data.nodeId as string, data.title || '')}
                          className={cn(
                            'flex items-center justify-center gap-2',
                            'py-3 rounded-xl text-xs md:text-sm font-bold',
                            'text-bg-base bg-text-main hover:opacity-85',
                            'transition-all duration-200'
                          )}
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>توسيع الفكرة</span>
                        </button>
                      )}

                      {data.nodeId && onRegenerateBranches && (
                        <button
                          onClick={() => onRegenerateBranches(data.nodeId as string, data.title || '')}
                          className={cn(
                            'flex items-center justify-center gap-2',
                            'py-3 rounded-xl text-xs md:text-sm font-bold',
                            'text-text-main bg-bg-surface border border-border-subtle hover:border-text-main hover:bg-border-subtle/30',
                            'transition-all duration-200'
                          )}
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                          <span>إعادة توليد الفروع</span>
                        </button>
                      )}
                    </div>

                    {data.nodeId && onDeleteNode && (
                      <button
                        onClick={() => onDeleteNode(data.nodeId as string)}
                        className={cn(
                          'w-full flex items-center justify-center gap-2',
                          'py-2.5 rounded-xl text-xs font-medium',
                          'text-red-500/80 hover:text-red-500 hover:bg-red-500/10 border border-transparent hover:border-red-500/20',
                          'transition-all duration-200'
                        )}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>إزالة من الشبكة</span>
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                /* ── Edge detail view ── */
                <div className="flex flex-col min-h-full">
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.45, delay: 0.05 }}
                    className="mb-7"
                  >
                    <div className="flex items-center gap-2 mb-4">
                      <span className="w-2 h-2 rounded-full bg-text-dim/50 shrink-0" />
                      <span className="text-[11px] font-sans font-semibold uppercase tracking-[0.16em] text-text-dim">
                        تحليل الارتباط
                      </span>
                    </div>
                    <h2 className="text-2xl md:text-3xl font-bold text-text-main leading-snug">
                      الرابط المنطقي
                    </h2>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.12 }}
                    className="pr-4 border-r-2 border-border-subtle"
                  >
                    <h3 className="text-[11px] font-sans font-semibold uppercase tracking-[0.16em] text-text-dim mb-3">
                      جسر الفكرة
                    </h3>
                    <p className="font-serif text-[15px] text-text-dim leading-loose">
                      {data.description}
                    </p>
                  </motion.div>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}