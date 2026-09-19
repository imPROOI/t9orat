import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, X, ChevronUp, ChevronDown, Layers, ArrowLeft } from 'lucide-react';
import { Node, useReactFlow } from '@xyflow/react';

interface InMapSearchProps {
  isOpen: boolean;
  nodes: Node[];
  onClose: () => void;
  onSelectNode?: (node: Node) => void;
  onHighlightMatches?: (matchedIds: string[], currentMatchedId?: string) => void;
}

const springPhysics = { type: 'spring', stiffness: 350, damping: 25 };

const normalizeArabic = (text: string = '') => {
  return text
    .replace(/[\u064B-\u065F\u0670]/g, '') // Remove tashkeel
    .replace(/[أإآ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .trim()
    .toLowerCase();
};

export function InMapSearch({
  isOpen,
  nodes,
  onClose,
  onSelectNode,
  onHighlightMatches,
}: InMapSearchProps) {
  const [query, setQuery] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Try to use react flow instance for centering
  let reactFlow: ReturnType<typeof useReactFlow> | null = null;
  try {
    reactFlow = useReactFlow();
  } catch {
    reactFlow = null;
  }

  // Filter nodes matching query
  const matchingNodes = useMemo(() => {
    const trimmed = query.trim();
    if (!trimmed) return [];
    const normalized = normalizeArabic(trimmed);

    return nodes.filter((n) => {
      const label = normalizeArabic((n.data?.label as string) || '');
      const desc = normalizeArabic((n.data?.description as string) || '');
      const notes = normalizeArabic((n.data?.notes as string) || '');
      const context = normalizeArabic((n.data?.ideaContext as string) || '');
      return label.includes(normalized) || desc.includes(normalized) || notes.includes(normalized) || context.includes(normalized);
    });
  }, [nodes, query]);

  // Center canvas on node
  const centerOnNode = (node: Node) => {
    if (reactFlow && node.position) {
      reactFlow.setCenter(
        node.position.x + (node.measured?.width || 120) / 2,
        node.position.y + (node.measured?.height || 45) / 2,
        { zoom: 1.15, duration: 500 }
      );
    }
  };

  // Auto-focus when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      }, 50);
    } else {
      setQuery('');
      setCurrentIndex(0);
      onHighlightMatches?.([], undefined);
    }
  }, [isOpen, onHighlightMatches]);

  // Update highlighting and selection when index or matches change
  useEffect(() => {
    if (matchingNodes.length === 0) {
      setCurrentIndex(0);
      if (query.trim()) {
        onHighlightMatches?.([], undefined);
      }
    } else {
      const safeIndex = currentIndex >= matchingNodes.length ? 0 : currentIndex;
      setCurrentIndex(safeIndex);
      const currentMatched = matchingNodes[safeIndex];
      const matchedIds = matchingNodes.map((n) => n.id);
      onHighlightMatches?.(matchedIds, currentMatched?.id);
    }
  }, [matchingNodes, currentIndex, query, onHighlightMatches]);

  // Cycle to next match
  const handleNext = () => {
    if (matchingNodes.length === 0) return;
    const nextIdx = (currentIndex + 1) % matchingNodes.length;
    setCurrentIndex(nextIdx);
    const target = matchingNodes[nextIdx];
    centerOnNode(target);
    onSelectNode?.(target);
  };

  // Cycle to previous match
  const handlePrev = () => {
    if (matchingNodes.length === 0) return;
    const prevIdx = (currentIndex - 1 + matchingNodes.length) % matchingNodes.length;
    setCurrentIndex(prevIdx);
    const target = matchingNodes[prevIdx];
    centerOnNode(target);
    onSelectNode?.(target);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (e.shiftKey) {
        handlePrev();
      } else {
        handleNext();
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      handleNext();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      handlePrev();
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div 
        className="fixed inset-0 z-[120] flex items-start justify-center pt-16 md:pt-20 px-4 bg-black/40 backdrop-blur-xs pointer-events-auto"
        onClick={onClose}
        dir="rtl"
        role="search"
        aria-label="بحث داخل الخريطة"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: -20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -20 }}
          transition={springPhysics}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-xl bg-bg-surface/95 backdrop-blur-2xl border border-border-subtle rounded-2xl soft-shadow overflow-hidden flex flex-col shadow-2xl"
        >
          {/* Search Header Bar */}
          <div className="flex items-center gap-2 px-4 py-3 border-b border-border-subtle bg-bg-base/60">
            <Search className="w-5 h-5 text-accent-primary shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="ابحث في العناوين والوصف (Enter للتالي)..."
              className="flex-1 bg-transparent border-none outline-none text-text-main placeholder:text-text-dim/60 text-xs md:text-sm font-sans"
              dir="auto"
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                className="p-1 text-text-dim hover:text-text-main rounded-md transition-colors"
                title="مسح البحث"
              >
                <X className="w-4 h-4" />
              </button>
            )}

            {/* Match Counter & Next/Prev Buttons */}
            {query.trim() !== '' && (
              <div className="flex items-center gap-1 border-r border-border-subtle pr-2 shrink-0">
                <span className="text-[11px] font-mono text-text-dim px-1 min-w-[50px] text-center">
                  {matchingNodes.length > 0
                    ? `${currentIndex + 1} من ${matchingNodes.length}`
                    : 'لا توجد نتائج'}
                </span>

                <div className="flex items-center gap-0.5">
                  <button
                    onClick={handlePrev}
                    disabled={matchingNodes.length === 0}
                    className="p-1.5 rounded-lg text-text-dim hover:text-text-main hover:bg-bg-base/70 disabled:opacity-30 transition-all flex items-center gap-1 text-[11px]"
                    title="السابق (Shift + Enter)"
                  >
                    <ChevronUp className="w-4 h-4" />
                    <span className="hidden sm:inline">السابق</span>
                  </button>
                  <button
                    onClick={handleNext}
                    disabled={matchingNodes.length === 0}
                    className="p-1.5 rounded-lg text-text-dim hover:text-text-main hover:bg-bg-base/70 disabled:opacity-30 transition-all flex items-center gap-1 text-[11px]"
                    title="التالي (Enter)"
                  >
                    <ChevronDown className="w-4 h-4" />
                    <span className="hidden sm:inline">التالي</span>
                  </button>
                </div>
              </div>
            )}

            <button
              onClick={onClose}
              className="p-1.5 text-text-dim hover:text-text-main hover:bg-bg-base/80 rounded-lg transition-colors ml-0.5"
              title="إغلاق البحث (ESC)"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Matches Preview List */}
          {query.trim() !== '' && (
            <div className="max-h-72 overflow-y-auto custom-scrollbar p-2 divide-y divide-border-subtle/30">
              {matchingNodes.length === 0 ? (
                <div className="py-6 px-4 text-center text-text-dim text-xs">
                  لا توجد عقد تطابق بحثك
                </div>
              ) : (
                matchingNodes.map((node, index) => {
                  const label = (node.data?.label as string) || 'بدون عنوان';
                  const desc = (node.data?.description as string) || '';
                  const isSelected = index === currentIndex;

                  return (
                    <div
                      key={node.id}
                      onClick={() => {
                        setCurrentIndex(index);
                        centerOnNode(node);
                        onSelectNode?.(node);
                      }}
                      className={`flex items-start justify-between gap-3 p-2.5 rounded-xl cursor-pointer transition-all ${
                        isSelected 
                          ? 'bg-accent-primary/10 border border-accent-primary/30 shadow-xs' 
                          : 'hover:bg-bg-base/50 border border-transparent'
                      }`}
                    >
                      <div className="flex items-start gap-2.5 min-w-0">
                        <div className="mt-0.5 w-6 h-6 rounded-lg bg-bg-base flex items-center justify-center text-text-dim shrink-0">
                          <Layers className="w-3.5 h-3.5 text-accent-primary" />
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-xs md:text-sm font-semibold text-text-main truncate">{label}</h4>
                          {desc && (
                            <p className="text-[11px] text-text-dim line-clamp-1 mt-0.5">{desc}</p>
                          )}
                        </div>
                      </div>
                      <ArrowLeft className={`w-4 h-4 shrink-0 transition-opacity mt-1 ${isSelected ? 'opacity-100 text-accent-primary' : 'opacity-0'}`} />
                    </div>
                  );
                })
              )}
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
