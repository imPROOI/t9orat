import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Undo2,
  Redo2,
  Maximize2,
  Search,
  FolderOpen,
  Download,
  BookOpen,
  BarChart3,
  Trash2,
  Sparkles,
  FileText,
  FileCode,
  Upload,
  ChevronUp,
  X,
  MoreHorizontal
} from 'lucide-react';

interface FloatingDockProps {
  canUndo: boolean;
  canRedo: boolean;
  hasNodes: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onFitView: () => void;
  onOpenSearch: () => void;
  onOpenSessions: () => void;
  onExportPng: () => void;
  onExportMarkdown: () => void;
  onExportJson: () => void;
  onImportJson: (file: File) => void;
  onOpenSummary: () => void;
  onOpenStats: () => void;
  onClearAll: () => void;
}

const springPhysics = { type: 'spring', stiffness: 400, damping: 30 };

export function FloatingDock({
  canUndo,
  canRedo,
  hasNodes,
  onUndo,
  onRedo,
  onFitView,
  onOpenSearch,
  onOpenSessions,
  onExportPng,
  onExportMarkdown,
  onExportJson,
  onImportJson,
  onOpenSummary,
  onOpenStats,
  onClearAll,
}: FloatingDockProps) {
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showMobileDrawer, setShowMobileDrawer] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onImportJson(file);
      // Reset file input so re-selecting same file triggers onChange
      e.target.value = '';
    }
    setShowExportMenu(false);
    setShowMobileDrawer(false);
  };

  const triggerImportClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <>
      {/* Hidden file input for JSON import */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".json,application/json"
        className="hidden"
      />

      {/* Desktop & Tablet Floating Dock (hidden on very small screens) */}
      <div 
        className="hidden md:flex absolute bottom-6 left-1/2 -translate-x-1/2 z-40 items-center gap-1.5 px-3.5 py-2.5 bg-bg-surface/85 backdrop-blur-2xl border border-border-subtle rounded-full soft-shadow select-none"
        dir="rtl"
      >
        {/* Explore Hint */}
        {hasNodes && (
          <div className="flex items-center gap-2 pl-3 ml-1 border-l border-border-subtle text-text-dim text-xs font-medium">
            <Sparkles className="w-3.5 h-3.5 text-accent-primary" />
            <span className="hidden lg:inline">انقر على الأشكال للاستكشاف</span>
          </div>
        )}

        {/* Undo */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onUndo}
          disabled={!canUndo}
          aria-label="تراجع (Ctrl+Z)"
          title="تراجع (Ctrl+Z)"
          className={`flex items-center justify-center w-9 h-9 rounded-full transition-colors ${
            canUndo ? 'text-text-dim hover:text-text-main hover:bg-white/5' : 'text-text-dim/30 cursor-not-allowed'
          }`}
        >
          <Undo2 className="w-4.5 h-4.5" />
        </motion.button>

        {/* Redo */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onRedo}
          disabled={!canRedo}
          aria-label="إعادة (Ctrl+Y)"
          title="إعادة (Ctrl+Y)"
          className={`flex items-center justify-center w-9 h-9 rounded-full transition-colors ${
            canRedo ? 'text-text-dim hover:text-text-main hover:bg-white/5' : 'text-text-dim/30 cursor-not-allowed'
          }`}
        >
          <Redo2 className="w-4.5 h-4.5" />
        </motion.button>

        <div className="w-px h-5 bg-border-subtle mx-0.5" />

        {/* Fit View */}
        <motion.button
          whileHover={{ scale: 1.05, backgroundColor: 'rgba(255,255,255,0.05)' }}
          whileTap={{ scale: 0.95 }}
          onClick={onFitView}
          aria-label="ملاءمة العرض"
          title="ملاءمة العرض (Fit View)"
          className="flex items-center justify-center w-9 h-9 rounded-full text-text-dim hover:text-text-main transition-colors"
        >
          <Maximize2 className="w-4.5 h-4.5" />
        </motion.button>

        {/* In-Map Search */}
        <motion.button
          whileHover={{ scale: 1.05, backgroundColor: 'rgba(255,255,255,0.05)' }}
          whileTap={{ scale: 0.95 }}
          onClick={onOpenSearch}
          aria-label="بحث في الخريطة (Ctrl+F)"
          title="بحث في الخريطة (Ctrl+F)"
          className="flex items-center justify-center w-9 h-9 rounded-full text-text-dim hover:text-text-main transition-colors"
        >
          <Search className="w-4.5 h-4.5" />
        </motion.button>

        {/* Saved Sessions */}
        <motion.button
          whileHover={{ scale: 1.05, backgroundColor: 'rgba(255,255,255,0.05)' }}
          whileTap={{ scale: 0.95 }}
          onClick={onOpenSessions}
          aria-label="الجلسات المحفوظة"
          title="الجلسات المحفوظة"
          className="flex items-center justify-center w-9 h-9 rounded-full text-text-dim hover:text-text-main transition-colors"
        >
          <FolderOpen className="w-4.5 h-4.5" />
        </motion.button>

        {/* Export Options Popover */}
        <div className="relative">
          <motion.button
            whileHover={{ scale: 1.05, backgroundColor: 'rgba(255,255,255,0.05)' }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowExportMenu(!showExportMenu)}
            aria-label="خيارات التصدير والاستيراد"
            title="تصدير واستيراد الخريطة"
            className={`flex items-center justify-center w-9 h-9 rounded-full transition-colors ${
              showExportMenu ? 'text-accent-primary bg-accent-primary/10' : 'text-text-dim hover:text-text-main'
            }`}
          >
            <Download className="w-4.5 h-4.5" />
          </motion.button>

          <AnimatePresence>
            {showExportMenu && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                transition={springPhysics}
                className="absolute bottom-12 left-1/2 -translate-x-1/2 w-48 p-1.5 bg-bg-surface/95 backdrop-blur-2xl border border-border-subtle rounded-2xl soft-shadow flex flex-col gap-1 z-50"
              >
                <button
                  onClick={() => {
                    onExportPng();
                    setShowExportMenu(false);
                  }}
                  className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-text-dim hover:text-text-main hover:bg-white/5 rounded-xl transition-colors text-right w-full"
                >
                  <Download className="w-4 h-4 text-accent-primary" />
                  <span>تصدير كصورة (PNG)</span>
                </button>

                <button
                  onClick={() => {
                    onExportMarkdown();
                    setShowExportMenu(false);
                  }}
                  className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-text-dim hover:text-text-main hover:bg-white/5 rounded-xl transition-colors text-right w-full"
                >
                  <FileText className="w-4 h-4 text-blue-400" />
                  <span>تصدير Markdown</span>
                </button>

                <button
                  onClick={() => {
                    onExportJson();
                    setShowExportMenu(false);
                  }}
                  className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-text-dim hover:text-text-main hover:bg-white/5 rounded-xl transition-colors text-right w-full"
                >
                  <FileCode className="w-4 h-4 text-emerald-400" />
                  <span>تصدير JSON</span>
                </button>

                <div className="w-full h-px bg-border-subtle my-0.5" />

                <button
                  onClick={triggerImportClick}
                  className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-text-dim hover:text-text-main hover:bg-white/5 rounded-xl transition-colors text-right w-full"
                >
                  <Upload className="w-4 h-4 text-amber-400" />
                  <span>استيراد JSON</span>
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* AI Summary */}
        <motion.button
          whileHover={{ scale: 1.05, backgroundColor: 'rgba(255,255,255,0.05)' }}
          whileTap={{ scale: 0.95 }}
          onClick={onOpenSummary}
          aria-label="توليد ملخص ذكي"
          title="ملخص ذكي بالذكاء الاصطناعي"
          className="flex items-center justify-center w-9 h-9 rounded-full text-text-dim hover:text-text-main transition-colors"
        >
          <BookOpen className="w-4.5 h-4.5" />
        </motion.button>

        {/* Stats */}
        <motion.button
          whileHover={{ scale: 1.05, backgroundColor: 'rgba(255,255,255,0.05)' }}
          whileTap={{ scale: 0.95 }}
          onClick={onOpenStats}
          aria-label="إحصائيات الخريطة"
          title="إحصائيات الخريطة"
          className="flex items-center justify-center w-9 h-9 rounded-full text-text-dim hover:text-text-main transition-colors"
        >
          <BarChart3 className="w-4.5 h-4.5" />
        </motion.button>

        <div className="w-px h-5 bg-border-subtle mx-0.5" />

        {/* Clear All */}
        <motion.button
          whileHover={{ scale: 1.05, backgroundColor: 'rgba(248,113,113,0.1)' }}
          whileTap={{ scale: 0.95 }}
          onClick={onClearAll}
          aria-label="مسح اللوحة بالكامل"
          title="مسح الكل"
          className="flex items-center justify-center w-9 h-9 rounded-full text-text-dim hover:text-accent-red transition-colors"
        >
          <Trash2 className="w-4.5 h-4.5" />
        </motion.button>
      </div>

      {/* Mobile Floating Bar & Expandable Drawer */}
      <div className="md:hidden fixed bottom-4 left-4 right-4 z-40 flex items-center justify-between px-3 py-2 bg-bg-surface/90 backdrop-blur-2xl border border-border-subtle rounded-2xl soft-shadow" dir="rtl">
        <div className="flex items-center gap-1">
          {/* Mobile Undo */}
          <button
            onClick={onUndo}
            disabled={!canUndo}
            aria-label="تراجع"
            className={`p-2 rounded-xl transition-colors ${canUndo ? 'text-text-main' : 'text-text-dim/30'}`}
          >
            <Undo2 className="w-4.5 h-4.5" />
          </button>

          {/* Mobile Redo */}
          <button
            onClick={onRedo}
            disabled={!canRedo}
            aria-label="إعادة"
            className={`p-2 rounded-xl transition-colors ${canRedo ? 'text-text-main' : 'text-text-dim/30'}`}
          >
            <Redo2 className="w-4.5 h-4.5" />
          </button>

          {/* Mobile Fit View */}
          <button
            onClick={onFitView}
            aria-label="ملاءمة العرض"
            className="p-2 text-text-dim hover:text-text-main rounded-xl transition-colors"
          >
            <Maximize2 className="w-4.5 h-4.5" />
          </button>

          {/* Mobile Search */}
          <button
            onClick={onOpenSearch}
            aria-label="بحث في الخريطة"
            className="p-2 text-text-dim hover:text-text-main rounded-xl transition-colors"
          >
            <Search className="w-4.5 h-4.5" />
          </button>
        </div>

        {/* Expand FAB button */}
        <button
          onClick={() => setShowMobileDrawer(true)}
          aria-label="المزيد من الأدوات"
          className="flex items-center gap-1.5 px-3 py-1.5 bg-accent-primary/10 border border-accent-primary/20 text-accent-primary text-xs font-semibold rounded-xl"
        >
          <span>الأدوات</span>
          <MoreHorizontal className="w-4 h-4" />
        </button>
      </div>

      {/* Mobile Drawer (Bottom Sheet) */}
      <AnimatePresence>
        {showMobileDrawer && (
          <div className="md:hidden fixed inset-0 z-50 flex flex-col justify-end bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={springPhysics}
              className="bg-bg-surface border-t border-border-subtle rounded-t-3xl p-5 max-h-[85vh] overflow-y-auto space-y-4"
              dir="rtl"
            >
              {/* Header */}
              <div className="flex items-center justify-between pb-3 border-b border-border-subtle">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-accent-primary" />
                  <span className="font-bold text-sm text-text-main">أدوات تصوّرات</span>
                </div>
                <button
                  onClick={() => setShowMobileDrawer(false)}
                  className="p-1 text-text-dim hover:text-text-main rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Action grid */}
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  onClick={() => {
                    onOpenSessions();
                    setShowMobileDrawer(false);
                  }}
                  className="flex items-center gap-2.5 p-3 rounded-xl bg-bg-base/60 border border-border-subtle text-text-main text-xs font-medium"
                >
                  <FolderOpen className="w-4 h-4 text-accent-primary" />
                  <span>الجلسات المحفوظة</span>
                </button>

                <button
                  onClick={() => {
                    onOpenSummary();
                    setShowMobileDrawer(false);
                  }}
                  className="flex items-center gap-2.5 p-3 rounded-xl bg-bg-base/60 border border-border-subtle text-text-main text-xs font-medium"
                >
                  <BookOpen className="w-4 h-4 text-purple-400" />
                  <span>ملخص ذكي (AI)</span>
                </button>

                <button
                  onClick={() => {
                    onOpenStats();
                    setShowMobileDrawer(false);
                  }}
                  className="flex items-center gap-2.5 p-3 rounded-xl bg-bg-base/60 border border-border-subtle text-text-main text-xs font-medium"
                >
                  <BarChart3 className="w-4 h-4 text-amber-400" />
                  <span>إحصائيات الخريطة</span>
                </button>

                <button
                  onClick={() => {
                    onExportPng();
                    setShowMobileDrawer(false);
                  }}
                  className="flex items-center gap-2.5 p-3 rounded-xl bg-bg-base/60 border border-border-subtle text-text-main text-xs font-medium"
                >
                  <Download className="w-4 h-4 text-emerald-400" />
                  <span>حفظ صورة (PNG)</span>
                </button>

                <button
                  onClick={() => {
                    onExportMarkdown();
                    setShowMobileDrawer(false);
                  }}
                  className="flex items-center gap-2.5 p-3 rounded-xl bg-bg-base/60 border border-border-subtle text-text-main text-xs font-medium"
                >
                  <FileText className="w-4 h-4 text-blue-400" />
                  <span>تصدير Markdown</span>
                </button>

                <button
                  onClick={() => {
                    onExportJson();
                    setShowMobileDrawer(false);
                  }}
                  className="flex items-center gap-2.5 p-3 rounded-xl bg-bg-base/60 border border-border-subtle text-text-main text-xs font-medium"
                >
                  <FileCode className="w-4 h-4 text-indigo-400" />
                  <span>تصدير JSON</span>
                </button>

                <button
                  onClick={triggerImportClick}
                  className="flex items-center gap-2.5 p-3 rounded-xl bg-bg-base/60 border border-border-subtle text-text-main text-xs font-medium"
                >
                  <Upload className="w-4 h-4 text-yellow-400" />
                  <span>استيراد JSON</span>
                </button>

                <button
                  onClick={() => {
                    onClearAll();
                    setShowMobileDrawer(false);
                  }}
                  className="flex items-center gap-2.5 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-xs font-medium"
                >
                  <Trash2 className="w-4 h-4 text-red-400" />
                  <span>مسح اللوحة</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
