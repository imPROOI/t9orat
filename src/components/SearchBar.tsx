import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  Sparkles,
  Loader2,
  Settings,
  ArrowLeft,
  ArrowRight,
  Lightbulb,
  Shuffle,
  Zap,
  FlameKindling,
  BookOpen,
  X,
  ExternalLink
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { INITIAL_SUGGESTIONS, INSPIRING_TOPICS, FUSION_PAIRS } from '../data/suggestedTopics';
import { fetchRandomWikipediaArticle, WikipediaArticle } from '../lib/wikipedia';

interface SearchBarProps {
  onSearch: (keywords: string[], isNewSearch?: boolean) => void;
  isLoading: boolean;
  hasSearched: boolean;
  suggestedTopics: { title: string; description: string }[];
  contrarianTopics?: { title: string; description: string }[];
  onOpenConfig?: () => void;
}

/**
 * Detects if a text predominantly starts with or contains Arabic characters
 */
function detectTextDirection(text: string): 'rtl' | 'ltr' {
  if (!text.trim()) return 'rtl';
  const arabicRegex = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/;
  // Check the first strong character
  for (const char of text) {
    if (arabicRegex.test(char)) return 'rtl';
    if (/[a-zA-Z]/.test(char)) return 'ltr';
  }
  return 'rtl';
}

export function SearchBar({
  onSearch,
  isLoading,
  hasSearched,
  suggestedTopics,
  contrarianTopics = [],
  onOpenConfig
}: SearchBarProps) {
  const [inputValue, setInputValue] = useState('');
  const [inspireIdx, setInspireIdx] = useState(0);
  const [isWikiLoading, setIsWikiLoading] = useState(false);
  const [wikiSnippet, setWikiSnippet] = useState<WikipediaArticle | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-focus after search completes for follow-up exploration
  useEffect(() => {
    if (!isLoading && hasSearched) {
      inputRef.current?.focus();
    }
  }, [isLoading, hasSearched]);

  // Dismiss Wikipedia preview when a search is running
  useEffect(() => {
    if (isLoading) {
      setWikiSnippet(null);
    }
  }, [isLoading]);

  // Determine text direction for mixed Arabic/English content
  const textDirection = useMemo(() => detectTextDirection(inputValue), [inputValue]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) return;
    const keywords = inputValue.split(/[,،]+/).map(k => k.trim()).filter(Boolean);
    if (keywords.length > 0) {
      setWikiSnippet(null);
      onSearch(keywords);
      setInputValue('');
    }
  };

  const handleInspireMe = () => {
    const nextIdx = (inspireIdx + 1) % INSPIRING_TOPICS.length;
    setInspireIdx(nextIdx);
    const topic = INSPIRING_TOPICS[nextIdx];
    setInputValue(topic);
    setWikiSnippet(null);
    onSearch([topic]);
  };

  const handleRandomFusion = () => {
    const pair = FUSION_PAIRS[Math.floor(Math.random() * FUSION_PAIRS.length)];
    setInputValue(pair.join('، '));
    setWikiSnippet(null);
    onSearch(pair);
  };

  const handleRandomWikipedia = async () => {
    if (isLoading || isWikiLoading) return;
    setIsWikiLoading(true);
    try {
      const article = await fetchRandomWikipediaArticle('ar');
      setInputValue(article.title);
      setWikiSnippet(article);
      inputRef.current?.focus();
    } catch (error) {
      console.error('Failed to fetch Wikipedia article:', error);
    } finally {
      setIsWikiLoading(false);
    }
  };

  const handleDirectInspire = (topic: string) => {
    setWikiSnippet(null);
    onSearch([topic]);
  };

  const handleExploreSnippet = () => {
    if (!wikiSnippet) return;
    const title = wikiSnippet.title;
    setWikiSnippet(null);
    setInputValue('');
    onSearch([title]);
  };

  const displayTopics = suggestedTopics.length > 0 ? suggestedTopics : INITIAL_SUGGESTIONS;
  const allSuggestions = [
    ...contrarianTopics.map(t => ({ ...t, isContrarian: true })),
    ...suggestedTopics.map(t => ({ ...t, isContrarian: false }))
  ];

  const isFusionMode = inputValue.includes('،') || inputValue.includes(',');
  const keywords = inputValue.split(/[,،]+/).map(k => k.trim()).filter(Boolean);

  return (
    <motion.div
      initial={false}
      animate={{ y: hasSearched ? 8 : '26vh' }}
      transition={{ type: 'spring', stiffness: 220, damping: 28 }}
      className={cn(
        'absolute left-0 right-0 z-40 px-4 sm:px-6 mx-auto',
        hasSearched ? 'top-4 max-w-[92vw]' : 'top-0 max-w-2xl'
      )}
    >
      {/* ── Hero Header (pre-search) ── */}
      <motion.div
        animate={{
          opacity: hasSearched ? 0 : 1,
          height: hasSearched ? 0 : 'auto',
          marginBottom: hasSearched ? 0 : undefined
        }}
        transition={{ duration: 0.5, ease: 'easeInOut' }}
        className="overflow-hidden text-center"
      >
        <div className="pt-6 md:pt-10 pb-2 select-none flex flex-col items-center">
          {/* Logo mark + wordmark tightly stacked */}
          <div className="flex flex-col items-center gap-0 text-text-main">
            {/* SVG network mark */}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="80 55 340 170"
              className="w-[160px] h-[90px] sm:w-[200px] sm:h-[112px] md:w-[240px] md:h-[135px]"
              aria-hidden="true"
            >
              <defs>
                {/* Gradient for curves */}
                <linearGradient id="curveGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="currentColor" stopOpacity="1" />
                  <stop offset="100%" stopColor="currentColor" stopOpacity="0.5" />
                </linearGradient>
                {/* Glow filter for center dot */}
                <filter id="glow" x="-80%" y="-80%" width="260%" height="260%">
                  <feGaussianBlur stdDeviation="4" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>
              {/* Faint connector lines */}
              <g stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round">
                <g strokeWidth="1.5" opacity="0.2">
                  <line x1="160" y1="180" x2="250" y2="160" />
                  <line x1="340" y1="180" x2="250" y2="160" />
                  <line x1="210" y1="110" x2="250" y2="160" />
                  <line x1="290" y1="110" x2="250" y2="160" />
                  <line x1="210" y1="110" x2="340" y2="180" />
                  <line x1="290" y1="110" x2="160" y2="180" />
                </g>
                {/* Main curves with gradient stroke */}
                <path d="M 160 180 C 160 250, 340 250, 340 180" strokeWidth="7.5" stroke="url(#curveGrad)" />
                <path d="M 160 180 C 100 110, 150 50, 210 110" strokeWidth="7.5" stroke="url(#curveGrad)" />
                <path d="M 340 180 C 400 110, 350 50, 290 110" strokeWidth="7.5" stroke="url(#curveGrad)" />
              </g>
              {/* Nodes */}
              <g fill="currentColor">
                <circle cx="210" cy="110" r="9" />
                <circle cx="290" cy="110" r="9" />
                <circle cx="160" cy="180" r="6.5" />
                <circle cx="340" cy="180" r="6.5" />
              </g>
              {/* Center glowing node */}
              <circle cx="250" cy="160" r="7" fill="currentColor" opacity="0.15" filter="url(#glow)" />
              <circle cx="250" cy="160" r="5" fill="none" stroke="currentColor" strokeWidth="2.5" filter="url(#glow)" />
            </svg>

            {/* Wordmark — zero gap from logo */}
            <h1 className="text-[52px] sm:text-7xl md:text-8xl font-serif tracking-tighter text-text-main leading-none -mt-1">
              تصورات
            </h1>
            {/* Subtitle — tight spacing */}
            <p className="text-text-dim text-[10px] md:text-[11px] font-sans font-medium tracking-[0.4em] mt-1 mb-8 uppercase">
              NEURAL EXPLORATION
            </p>
          </div>
        </div>
      </motion.div>

      {/* ── Search Row ── */}
      <div
        className={cn(
          'w-full mx-auto flex gap-2 sm:gap-3 items-center',
          hasSearched ? 'max-w-[680px]' : ''
        )}
      >
        <form onSubmit={handleSubmit} className="flex-1 relative">
          {/* Visually hidden accessible label */}
          <label htmlFor="mindmap-search-input" className="sr-only">
            ابحث عن فكرة أو ادمج عدة مجالات معرفية بفاصلة
          </label>

          <div
            className={cn(
              'relative flex items-center rounded-2xl transition-all duration-300',
              'bg-bg-surface border border-border-subtle',
              'soft-shadow',
              isFusionMode
                ? 'focus-within:ring-2 focus-within:ring-accent-primary/30 border-accent-primary/40'
                : 'focus-within:ring-2 focus-within:ring-text-main/20 focus-within:border-text-main'
            )}
          >
            {/* Fusion badge */}
            {isFusionMode && (
              <div className="absolute right-0 top-0 -translate-y-1/2 translate-x-0 flex items-center gap-1 bg-text-main text-bg-base text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">
                <Zap className="w-2.5 h-2.5" />
                دمج أفكار
              </div>
            )}

            <input
              id="mindmap-search-input"
              ref={inputRef}
              type="text"
              role="searchbox"
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
              disabled={isLoading}
              dir={textDirection}
              placeholder={
                hasSearched
                  ? 'استكشف مجالاً آخر... أو ادمج عدة مجالات بفاصلة'
                  : 'ادخل موضوعاً أو ادمج عدة مجالات بفاصلة (،)'
              }
              className={cn(
                'w-full bg-transparent text-text-main placeholder-text-dim/60 outline-none text-base sm:text-lg disabled:opacity-50 font-sans font-medium',
                'px-4 py-3.5 sm:px-5 sm:py-4',
                textDirection === 'ltr' ? 'text-left font-mono' : 'text-right'
              )}
            />

            <button
              type="submit"
              disabled={isLoading || !inputValue.trim()}
              aria-label={isFusionMode ? 'دمج الأفكار وتحليلها' : 'بدء البحث واستكشاف الخريطة الذهنية'}
              className={cn(
                'flex items-center justify-center gap-2 mr-1.5 sm:mr-2 shrink-0 rounded-xl font-bold text-sm',
                'px-4 py-2.5 sm:px-5 sm:py-3 transition-all duration-200',
                'bg-text-main text-bg-base',
                'hover:opacity-90',
                'active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed shadow-sm cursor-pointer'
              )}
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <span className="hidden sm:inline">
                    {isFusionMode && keywords.length > 1 ? `دمج (${keywords.length})` : 'تحليل'}
                  </span>
                  {textDirection === 'ltr' ? (
                    <ArrowRight className="w-4 h-4" />
                  ) : (
                    <ArrowLeft className="w-4 h-4" />
                  )}
                </>
              )}
            </button>
          </div>

          {/* Fusion keywords preview */}
          <AnimatePresence>
            {isFusionMode && keywords.length > 1 && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                className="absolute top-full mt-2 right-0 left-0 flex flex-wrap gap-1.5 px-1 z-30"
              >
                {keywords.map((kw, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1 bg-text-main/8 text-text-main text-[11px] font-bold px-2.5 py-1 rounded-full border border-text-main/15 backdrop-blur-sm"
                  >
                    <FlameKindling className="w-2.5 h-2.5 opacity-60" />
                    {kw}
                  </span>
                ))}
                <span className="text-[11px] text-text-dim font-medium self-center">← سيتم دمجها</span>
              </motion.div>
            )}
          </AnimatePresence>
        </form>

        {/* Settings button */}
        {onOpenConfig && (
          <motion.button
            whileTap={{ scale: 0.93 }}
            type="button"
            onClick={onOpenConfig}
            aria-label="إعدادات مزود الذكاء الاصطناعي والموديل"
            title="الإعدادات"
            className={cn(
              'flex-shrink-0 flex items-center justify-center cursor-pointer',
              'text-text-dim hover:text-text-main transition-colors duration-200',
              'bg-bg-surface border border-border-subtle rounded-2xl',
              'p-[14px] sm:p-[17px]',
              'soft-shadow',
              'hover:bg-bg-base'
            )}
          >
            <Settings className="w-5 h-5" />
          </motion.button>
        )}
      </div>

      {/* ── Wikipedia Article Snippet Preview Card ── */}
      <AnimatePresence>
        {wikiSnippet && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.97 }}
            transition={{ duration: 0.28, ease: 'easeOut' }}
            role="status"
            aria-live="polite"
            className={cn(
              'mt-3 mx-auto w-full max-w-[680px] rounded-2xl p-4 sm:p-5',
              'bg-bg-surface/95 backdrop-blur-md border border-border-subtle soft-shadow',
              'text-right relative z-30'
            )}
            dir="rtl"
          >
            <div className="flex items-start justify-between gap-3 mb-2.5">
              <div className="flex items-center gap-2">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-text-main/10 text-text-main">
                  <BookOpen className="w-3.5 h-3.5" />
                </span>
                <span className="text-[11px] font-sans font-bold tracking-wider text-text-dim uppercase">
                  مقالة عشوائية من ويكيبيديا
                </span>
                {wikiSnippet.description && (
                  <span className="hidden sm:inline text-[11px] text-text-dim/80 bg-text-main/5 px-2 py-0.5 rounded-md">
                    {wikiSnippet.description}
                  </span>
                )}
              </div>

              <button
                type="button"
                onClick={() => setWikiSnippet(null)}
                aria-label="إغلاق معاينة المقالة"
                className="text-text-dim hover:text-text-main transition-colors p-1 rounded-lg hover:bg-text-main/5 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <h3 className="text-lg font-bold text-text-main mb-1.5 leading-snug">
              {wikiSnippet.title}
            </h3>

            <p className="text-xs sm:text-sm text-text-dim leading-relaxed mb-4 line-clamp-3 font-serif">
              {wikiSnippet.extract}
            </p>

            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-border-subtle">
              {wikiSnippet.pageUrl && (
                <a
                  href={wikiSnippet.pageUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="قراءة المقالة كاملة على ويكيبيديا (يفتح في نافذة جديدة)"
                  className="inline-flex items-center gap-1.5 text-xs text-text-dim hover:text-text-main transition-colors font-medium"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>قراءة في ويكيبيديا</span>
                </a>
              )}

              <div className="flex items-center gap-2 mr-auto">
                <button
                  type="button"
                  onClick={handleExploreSnippet}
                  disabled={isLoading}
                  className={cn(
                    'inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl font-bold text-xs sm:text-sm',
                    'bg-text-main text-bg-base hover:opacity-90 transition-all cursor-pointer shadow-sm'
                  )}
                >
                  <span>استكشف هذه الفكرة الآن</span>
                  <ArrowLeft className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Inspire Me & Wikipedia Toolbar (pre-search only) ── */}
      <AnimatePresence>
        {!hasSearched && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="flex flex-wrap items-center justify-center gap-2 mt-3"
          >
            {/* ألهمني بفكرة */}
            <motion.button
              type="button"
              onClick={handleInspireMe}
              disabled={isLoading || isWikiLoading}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              aria-label="ألهمني بفكرة عشوائية للاستكشاف"
              className="flex items-center gap-2 px-3.5 sm:px-4 py-2 bg-bg-surface border border-border-subtle rounded-xl text-text-dim hover:text-text-main hover:border-text-main/30 transition-all duration-200 text-xs sm:text-sm font-medium soft-shadow cursor-pointer disabled:opacity-50"
            >
              <Lightbulb className="w-4 h-4 text-amber-500/80" />
              <span>ألهمني بفكرة</span>
            </motion.button>

            {/* مقالة عشوائية من ويكيبيديا 🎲 */}
            <motion.button
              type="button"
              onClick={handleRandomWikipedia}
              disabled={isLoading || isWikiLoading}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              aria-label="جلب مقالة عشوائية من ويكيبيديا العربية"
              title="جلب مقالة عشوائية غنية بالمعرفة من ويكيبيديا"
              className={cn(
                'flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-medium soft-shadow cursor-pointer transition-all duration-200',
                isWikiLoading
                  ? 'bg-text-main/10 text-text-main border border-text-main/30'
                  : 'bg-bg-surface border border-border-subtle text-text-dim hover:text-text-main hover:border-text-main/30'
              )}
            >
              {isWikiLoading ? (
                <Loader2 className="w-4 h-4 animate-spin text-text-main" />
              ) : (
                <BookOpen className="w-4 h-4 text-sky-500/80" />
              )}
              <span>مقالة عشوائية من ويكيبيديا 🎲</span>
            </motion.button>

            {/* دمج عشوائي */}
            <motion.button
              type="button"
              onClick={handleRandomFusion}
              disabled={isLoading || isWikiLoading}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              aria-label="دمج عشوائي بين مجالين معرفيين مختلفين"
              className="flex items-center gap-2 px-3.5 sm:px-4 py-2 bg-bg-surface border border-border-subtle rounded-xl text-text-dim hover:text-text-main hover:border-text-main/30 transition-all duration-200 text-xs sm:text-sm font-medium soft-shadow cursor-pointer disabled:opacity-50"
            >
              <Shuffle className="w-4 h-4 text-purple-500/80" />
              <span>دمج عشوائي</span>
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Pre-search Suggestions (vertical list) ── */}
      <AnimatePresence>
        {!hasSearched && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.4, delay: 0.15 }}
            className="flex flex-col items-center mt-6 sm:mt-8 w-full mx-auto max-w-lg"
          >
            <p className="text-[11px] font-sans font-semibold tracking-[0.18em] text-text-dim/70 uppercase mb-4">
              اقتراحات للاستكشاف
            </p>
            <div className="flex flex-col w-full gap-2" dir="rtl">
              {displayTopics.map((topic, i) => (
                <motion.button
                  key={`initial-${i}`}
                  initial={{ opacity: 0, x: 12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.05 * i, duration: 0.35 }}
                  type="button"
                  onClick={() => handleDirectInspire(topic.title)}
                  disabled={isLoading || isWikiLoading}
                  aria-label={`استكشف موضوع: ${topic.title}`}
                  className={cn(
                    'text-right w-full px-5 py-3.5 rounded-2xl group cursor-pointer',
                    'border border-border-subtle bg-bg-surface soft-shadow',
                    'hover:border-text-main/40 hover:bg-text-main/5 text-text-main',
                    'transition-all duration-200',
                    'disabled:opacity-50 flex items-center justify-between gap-3'
                  )}
                >
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-sm sm:text-base mb-0.5 transition-colors truncate">
                      {topic.title}
                    </h4>
                    <p className="text-text-dim text-xs font-medium leading-relaxed line-clamp-1">
                      {topic.description}
                    </p>
                  </div>
                  <ArrowLeft className="w-4 h-4 text-text-dim shrink-0 -translate-x-1 group-hover:-translate-x-2 group-hover:text-text-main transition-all opacity-50 group-hover:opacity-100" />
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Post-search Chips (horizontal wrap) ── */}
      <AnimatePresence>
        {hasSearched && (allSuggestions.length > 0 || !isLoading) && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35 }}
            className="mt-3 w-full mx-auto max-w-5xl flex flex-wrap justify-center gap-2 pb-1 px-1"
            dir="rtl"
          >
            {/* Random inspire chip */}
            <motion.button
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              type="button"
              onClick={handleInspireMe}
              disabled={isLoading || isWikiLoading}
              title="جرب موضوعاً عشوائياً"
              aria-label="ألهمني بموضوع عشوائي"
              className="flex-none flex items-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl text-[11px] sm:text-sm font-bold transition-all duration-200 border border-dashed border-text-dim/40 bg-bg-surface text-text-dim hover:border-text-main hover:text-text-main soft-shadow cursor-pointer disabled:opacity-50"
            >
              <Lightbulb className="w-3 h-3 shrink-0 text-amber-500/80" />
              <span>ألهمني</span>
            </motion.button>

            {/* Wikipedia random chip in post-search */}
            <motion.button
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.03, duration: 0.25 }}
              type="button"
              onClick={handleRandomWikipedia}
              disabled={isLoading || isWikiLoading}
              title="مقالة عشوائية من ويكيبيديا العربية"
              aria-label="مقالة عشوائية من ويكيبيديا"
              className={cn(
                'flex-none flex items-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl text-[11px] sm:text-sm font-bold transition-all duration-200 border border-dashed soft-shadow cursor-pointer disabled:opacity-50',
                isWikiLoading
                  ? 'border-text-main bg-text-main/10 text-text-main'
                  : 'border-text-dim/40 bg-bg-surface text-text-dim hover:border-text-main hover:text-text-main'
              )}
            >
              {isWikiLoading ? (
                <Loader2 className="w-3 h-3 animate-spin shrink-0" />
              ) : (
                <BookOpen className="w-3 h-3 shrink-0 text-sky-500/80" />
              )}
              <span>ويكيبيديا 🎲</span>
            </motion.button>

            {allSuggestions.map((topic, i) => (
              <motion.button
                key={`chip-${i}`}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.04 * (i + 1), duration: 0.25 }}
                type="button"
                onClick={() => onSearch([topic.title], topic.isContrarian)}
                disabled={isLoading || isWikiLoading}
                title={topic.description}
                aria-label={`استكشف موضوع ${topic.title}: ${topic.description}`}
                className={cn(
                  'flex-none flex items-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl cursor-pointer',
                  'text-[11px] sm:text-sm font-bold',
                  'transition-all duration-200 disabled:opacity-50 border soft-shadow',
                  topic.isContrarian
                    ? 'border-text-main bg-text-main text-bg-base hover:opacity-90'
                    : 'border-border-subtle bg-bg-surface hover:border-text-main/40 hover:bg-text-main/5 text-text-main'
                )}
              >
                <Sparkles
                  className={cn(
                    'w-3 h-3 shrink-0',
                    topic.isContrarian ? 'text-bg-base' : 'text-text-main opacity-60'
                  )}
                />
                <span className="truncate max-w-[140px] sm:max-w-[190px]">{topic.title}</span>
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}