import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, Share2, Copy, Check, Download, Link2, 
  FileJson, Sparkles, CheckCircle2 
} from 'lucide-react';
import { Node, Edge } from '@xyflow/react';
import { exportMindMapToJSON } from '../lib/jsonExport';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  nodes: Node[];
  edges: Edge[];
  sessionName?: string;
  onNotify?: (msg: string) => void;
}

const springPhysics = { type: 'spring', stiffness: 350, damping: 25 };

export function ShareModal({
  isOpen,
  onClose,
  nodes,
  edges,
  sessionName = 'خريطة فكرية',
  onNotify,
}: ShareModalProps) {
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedJson, setCopiedJson] = useState(false);
  const [localFeedback, setLocalFeedback] = useState<string | null>(null);

  // Check if Web Share API is supported
  const isWebShareSupported = typeof navigator !== 'undefined' && typeof navigator.share === 'function';

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

  // Clean JSON string of the graph
  const jsonString = useMemo(() => {
    const payload = {
      version: '1.0',
      title: sessionName,
      exportedAt: new Date().toISOString(),
      generator: 'تصوّرات - سيمفونية الأفكار',
      stats: {
        totalNodes: nodes.length,
        totalEdges: edges.length,
      },
      nodes,
      edges,
    };
    return JSON.stringify(payload, null, 2);
  }, [nodes, edges, sessionName]);

  // Share URL
  const shareUrl = typeof window !== 'undefined' ? window.location.href : '';

  const notify = (msg: string) => {
    setLocalFeedback(msg);
    if (onNotify) onNotify(msg);
    setTimeout(() => setLocalFeedback(null), 3000);
  };

  const handleWebShare = async () => {
    if (!isWebShareSupported) return;
    try {
      await navigator.share({
        title: `تصوّرات: ${sessionName}`,
        text: `استكشف هذه الخريطة الفكرية «${sessionName}» المكونة من ${nodes.length} عقدة فكرية و${edges.length} رابط منطقي.`,
        url: shareUrl,
      });
      notify('تمت المشاركة بنجاح');
    } catch (err: unknown) {
      if (err instanceof Error && err.name !== 'AbortError') {
        console.error('Web Share failed', err);
      }
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopiedLink(true);
      notify('تم نسخ رابط الخريطة إلى الحافظة');
      setTimeout(() => setCopiedLink(false), 2500);
    } catch {
      notify('تعذر نسخ الرابط');
    }
  };

  const handleCopyJson = async () => {
    try {
      await navigator.clipboard.writeText(jsonString);
      setCopiedJson(true);
      notify('تم نسخ بيانات الخريطة (JSON) بنجاح');
      setTimeout(() => setCopiedJson(false), 2500);
    } catch {
      notify('تعذر نسخ بيانات JSON');
    }
  };

  const handleDownloadFile = () => {
    try {
      exportMindMapToJSON(nodes, edges, sessionName);
      notify('تم تصدير الخريطة كملف للتنزيل والمشاركة بنجاح');
    } catch {
      // Fallback download
      const blob = new Blob([jsonString], { type: 'application/json;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${sessionName}.json`;
      a.click();
      URL.revokeObjectURL(url);
      notify('تم تنزيل ملف الخريطة بنجاح');
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div 
        className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md overflow-y-auto"
        onClick={onClose}
        dir="rtl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="share-modal-title"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={springPhysics}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-lg bg-bg-surface/95 backdrop-blur-2xl border border-border-subtle rounded-3xl soft-shadow overflow-hidden shadow-2xl flex flex-col max-h-[85dvh]"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-border-subtle bg-bg-base/40 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-accent-primary/10 border border-accent-primary/20 flex items-center justify-center text-accent-primary">
                <Share2 className="w-5 h-5" />
              </div>
              <div>
                <h3 id="share-modal-title" className="text-lg font-bold text-text-main">
                  مشاركة وتصدير الخريطة
                </h3>
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

          {/* Body Options */}
          <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-4">
            {/* Feedback Alert */}
            {localFeedback && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 text-xs font-semibold"
              >
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{localFeedback}</span>
              </motion.div>
            )}

            {/* Option 1: Web Share API */}
            <div className="p-4 rounded-2xl bg-bg-base/70 border border-border-subtle flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-accent-primary/10 text-accent-primary flex items-center justify-center shrink-0">
                  <Share2 className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-text-main">مشاركة عبر المتصفح</h4>
                  <p className="text-[11px] text-text-dim">إرسال للتطبيقات والتواصل عبر نافذة النظام</p>
                </div>
              </div>
              {isWebShareSupported ? (
                <button
                  onClick={handleWebShare}
                  className="px-3.5 py-2 rounded-xl bg-text-main text-bg-base text-xs font-bold hover:opacity-85 transition-all flex items-center gap-1.5 shadow-xs shrink-0"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>مشاركة</span>
                </button>
              ) : (
                <span className="text-[10px] text-text-dim bg-bg-surface px-2.5 py-1 rounded-lg border border-border-subtle shrink-0">
                  غير مدعوم
                </span>
              )}
            </div>

            {/* Option 2: Copy JSON Data */}
            <div className="p-4 rounded-2xl bg-bg-base/70 border border-border-subtle space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-sky-500/10 text-sky-500 flex items-center justify-center shrink-0">
                    <FileJson className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-text-main">نسخ بيانات الخريطة (JSON)</h4>
                    <p className="text-[11px] text-text-dim">نسخ الهيكل الكامل لفتحه في أي جهاز آخر</p>
                  </div>
                </div>
                <button
                  onClick={handleCopyJson}
                  className="px-3.5 py-2 rounded-xl bg-bg-surface border border-border-subtle hover:border-text-main text-text-main text-xs font-bold transition-all flex items-center gap-1.5 shrink-0"
                >
                  {copiedJson ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                      <span className="text-emerald-500">تم النسخ</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>نسخ JSON</span>
                    </>
                  )}
                </button>
              </div>

              {/* JSON preview snippet */}
              <div className="p-2.5 rounded-xl bg-bg-surface/80 border border-border-subtle font-mono text-[11px] text-text-dim/80 select-all overflow-hidden line-clamp-2" dir="ltr">
                {jsonString.slice(0, 140)}...
              </div>
            </div>

            {/* Option 3: Export/Download JSON File */}
            <div className="p-4 rounded-2xl bg-bg-base/70 border border-border-subtle flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
                  <Download className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-text-main">تصدير كملف للتنزيل والمشاركة</h4>
                  <p className="text-[11px] text-text-dim">حفظ ملف (.json) يمكن سحبه وإفلاته في المتصفح</p>
                </div>
              </div>
              <button
                onClick={handleDownloadFile}
                className="px-3.5 py-2 rounded-xl bg-bg-surface border border-border-subtle hover:border-text-main text-text-main text-xs font-bold transition-all flex items-center gap-1.5 shrink-0"
              >
                <Download className="w-3.5 h-3.5" />
                <span>تنزيل الملف</span>
              </button>
            </div>

            {/* Option 4: Direct Link */}
            <div className="p-4 rounded-2xl bg-bg-base/70 border border-border-subtle flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center shrink-0">
                  <Link2 className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <h4 className="text-xs font-bold text-text-main">نسخ رابط الوصول</h4>
                  <p className="text-[11px] text-text-dim truncate" dir="ltr">{shareUrl}</p>
                </div>
              </div>
              <button
                onClick={handleCopyLink}
                className="px-3.5 py-2 rounded-xl bg-bg-surface border border-border-subtle hover:border-text-main text-text-main text-xs font-bold transition-all flex items-center gap-1.5 shrink-0"
              >
                {copiedLink ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                    <span className="text-emerald-500">تم النسخ</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>نسخ</span>
                  </>
                )}
              </button>
            </div>

            <div className="flex items-center justify-center gap-1.5 text-center text-xs text-text-dim pt-2">
              <Sparkles className="w-3.5 h-3.5 text-accent-primary" />
              <span>الخريطة الحالية تضم {nodes.length} عقدة و{edges.length} مسار رابط</span>
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
