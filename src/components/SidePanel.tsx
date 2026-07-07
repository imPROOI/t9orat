import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Trash2, Search, GraduationCap, Youtube, BookOpen, Globe, ExternalLink, Star } from 'lucide-react';
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

interface SidePanelProps {
  isOpen: boolean;
  onClose: () => void;
  onDeleteNode?: (nodeId: string) => void;
  onExpandNode?: (nodeId: string, nodeLabel: string) => void;
  onToggleStar?: (nodeId: string) => void;
  data: {
    type: 'node' | 'edge';
    nodeId?: string;
    title?: string;
    description: string;
    nodeType?: NodeType;
    ideaContext?: string;
    recommendationType?: string;
    starred?: boolean;
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

export function SidePanel({ isOpen, onClose, data, onDeleteNode, onExpandNode, onToggleStar }: SidePanelProps) {
  const [activeTab, setActiveTab] = useState<'details' | 'context' | 'recommendation'>('details');

  useEffect(() => {
    setActiveTab('details');
  }, [data?.nodeId]);

  if (!data) return null;

  const isNode = data.type === 'node';
  const nodeType = data.nodeType;
  const typeMeta = nodeType ? NODE_TYPE_META[nodeType] : null;

  const availableTabs = [
    { id: 'details', label: 'التفاصيل' },
    ...(data.ideaContext         ? [{ id: 'context',        label: 'السياق'  }] : []),
    ...(data.recommendationType  ? [{ id: 'recommendation', label: 'المصادر' }] : []),
  ] as const;

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
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 320, damping: 34 }}
            className={cn(
              // Mobile: bottom sheet
              'fixed inset-x-0 bottom-0 z-50 flex flex-col',
              'h-[78dvh] w-full rounded-t-[2rem]',
              // Desktop: side panel
              'md:absolute md:top-0 md:right-0 md:bottom-0 md:h-full',
              'md:w-[400px] md:rounded-none',
              // Surface
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
              className={cn(
                'absolute top-4 left-4 md:top-5 md:right-5 md:left-auto z-10',
                'w-8 h-8 flex items-center justify-center rounded-none',
                'bg-text-main/5 hover:bg-text-main/10 text-text-main',
                'transition-colors duration-200'
              )}
            >
              <X className="w-4 h-4" />
            </motion.button>

            {/* Scrollable content */}
            <div
              className="flex-1 overflow-y-auto custom-scrollbar pt-4 md:pt-8 px-6 md:px-9 pb-8"
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
                    className="mb-6"
                  >
                    {typeMeta && (
                      <div className="flex items-center gap-2 mb-4">
                        <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', typeMeta.dot)} />
                        <span className="text-[10px] font-sans font-semibold uppercase tracking-[0.18em] text-text-dim">
                          {typeMeta.label}
                        </span>
                      </div>
                    )}
                    <h2 className="text-2xl md:text-3xl font-bold text-text-main leading-snug">
                      {data.title}
                    </h2>
                  </motion.div>

                  {/* Tabs – only render if more than one available */}
                  {availableTabs.length > 1 && (
                    <motion.div
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: 0.1 }}
                      className="flex gap-1 mb-6 p-1 rounded-xl bg-white/4 self-start"
                    >
                      {availableTabs.map(tab => (
                        <button
                          key={tab.id}
                          onClick={() => setActiveTab(tab.id as typeof activeTab)}
                          className={cn(
                            'px-4 py-1.5 text-sm font-medium rounded-none transition-all duration-200',
                            activeTab === tab.id
                              ? 'bg-text-main text-bg-base'
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
                    className="flex-1"
                  >
                    {activeTab === 'details' && (
                       <div className="space-y-6">
                         <p className="font-serif text-[15px] text-text-dim leading-loose whitespace-pre-line">
                           {data.description}
                         </p>
                         
                         {data.searchQueries && data.searchQueries.length > 0 && (
                           <div className="mt-8 pt-6 border-t border-border-subtle">
                             <h4 className="text-xs font-sans font-bold text-text-main mb-4 flex items-center gap-1.5">
                               <Search className="w-3.5 h-3.5 text-accent-primary" />
                               <span>أبحاث ومصادر مقترحة للاستزادة:</span>
                             </h4>
                             <div className="space-y-3">
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
                                     className="flex items-center justify-between p-3.5 rounded-2xl border border-border-subtle bg-bg-surface hover:bg-border-subtle/40 hover:border-text-main/20 transition-all group"
                                   >
                                     <div className="flex items-center gap-3">
                                       <div className="w-8 h-8 rounded-lg bg-bg-base flex items-center justify-center text-text-main/80 group-hover:text-text-main">
                                         <Icon className="w-4 h-4" />
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

                  {/* Actions */}
                  <div className="mt-auto pt-5 border-t border-text-main/10 flex flex-col gap-2">
                    {data.nodeId && onToggleStar && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.2 }}
                      >
                        <button
                          onClick={() => onToggleStar(data.nodeId as string)}
                          className={cn(
                            'w-full flex items-center justify-center gap-2',
                            'py-3.5 rounded-none text-sm font-bold',
                            'transition-all duration-300 border-2',
                            data.starred
                              ? 'bg-yellow-400/10 text-yellow-500 border-yellow-400/40 hover:bg-yellow-400/20'
                              : 'text-text-main bg-bg-base border-border-subtle hover:border-text-main'
                          )}
                        >
                          <Star className={cn('w-4 h-4', data.starred && 'fill-yellow-400')} />
                          {data.starred ? 'إزالة من المميزة' : 'تمييز كفكرة مهمة'}
                        </button>
                      </motion.div>
                    )}
                    {data.nodeId && onExpandNode && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.3 }}
                      >
                        <button
                          onClick={() => onExpandNode(data.nodeId as string, data.title || '')}
                          className={cn(
                            'w-full flex items-center justify-center gap-2',
                            'py-3.5 rounded-none text-sm font-bold',
                            'text-bg-base bg-text-main',
                            'hover:opacity-80',
                            'transition-all duration-300 border-2 border-text-main'
                          )}
                        >
                          <span className="w-1.5 h-1.5 rounded-none bg-bg-base shrink-0" />
                          توسيع الفكرة (Deep Dive)
                        </button>
                      </motion.div>
                    )}

                    {data.nodeId && onDeleteNode && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.3 }}
                      >
                        <button
                          onClick={() => onDeleteNode(data.nodeId as string)}
                          className={cn(
                            'w-full flex items-center justify-center gap-2',
                            'py-3.5 rounded-none text-sm font-bold',
                            'text-text-main bg-bg-base border-2 border-text-main',
                            'hover:bg-text-main hover:text-bg-base',
                            'transition-all duration-300'
                          )}
                        >
                          <Trash2 className="w-4 h-4" />
                          إزالة من الشبكة
                        </button>
                      </motion.div>
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
                      <span className="w-1.5 h-1.5 rounded-full bg-text-dim/50 shrink-0" />
                      <span className="text-[10px] font-sans font-semibold uppercase tracking-[0.18em] text-text-dim">
                        تحليل الارتباط
                      </span>
                    </div>
                    <h2 className="text-2xl md:text-3xl font-display text-text-main leading-snug">
                      الرابط المنطقي
                    </h2>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.12 }}
                    className="pr-4 border-r-2 border-white/10"
                  >
                    <h3 className="text-[10px] font-sans font-semibold uppercase tracking-[0.18em] text-text-dim mb-3">
                      جسر الفكرة
                    </h3>
                    <p className="font-serif text-[15px] text-text-dim leading-loose italic">
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