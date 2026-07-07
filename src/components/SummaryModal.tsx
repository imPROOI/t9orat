import { useState } from 'react';
import { motion } from 'motion/react';
import { X, Copy, Check, BookOpen } from 'lucide-react';

interface SummaryModalProps {
  summary: string;
  isLoading: boolean;
  onClose: () => void;
}

export function SummaryModal({ summary, isLoading, onClose }: SummaryModalProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(summary);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="w-full max-w-3xl mx-auto bg-bg-surface/90 backdrop-blur-2xl border border-border-subtle rounded-3xl overflow-hidden soft-shadow max-h-[85dvh] flex flex-col" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between p-5 md:p-6 border-b border-border-subtle bg-bg-base/50 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-accent-primary/10 flex items-center justify-center text-accent-primary">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg md:text-xl font-bold text-text-main">ملخص ذكي</h2>
            <p className="text-xs md:text-sm text-text-dim mt-0.5">مقال سردي مولّد بالذكاء الاصطناعي</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {summary && (
            <button
              onClick={handleCopy}
              className="p-2 text-text-dim hover:text-text-main hover:bg-bg-base rounded-full transition-colors"
              title="نسخ"
            >
              {copied ? <Check className="w-5 h-5 text-green-500" /> : <Copy className="w-5 h-5" />}
            </button>
          )}
          <button
            onClick={onClose}
            className="p-2 text-text-dim hover:text-text-main hover:bg-bg-base rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-5 md:p-8">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-16 gap-4">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
              className="w-10 h-10 border-2 border-border-subtle border-t-accent-primary rounded-full"
            />
            <p className="text-text-dim text-sm font-medium">جاري كتابة المقال...</p>
          </div>
        ) : (
          <div className="prose prose-lg max-w-none">
            <p className="font-serif text-[15px] md:text-[16px] text-text-dim leading-[2] whitespace-pre-line">
              {summary}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
