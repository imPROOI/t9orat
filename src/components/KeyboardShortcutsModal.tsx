import { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Keyboard } from 'lucide-react';

interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const springPhysics = { type: 'spring', stiffness: 350, damping: 25 };

interface ShortcutItem {
  keys: string[];
  description: string;
}

const SHORTCUTS: ShortcutItem[] = [
  { keys: ['?'], description: 'إظهار نافذة الاختصارات' },
  { keys: ['Ctrl', 'F'], description: 'بحث سريع داخل الخريطة' },
  { keys: ['Ctrl', 'Z'], description: 'تراجع عن الخطوة السابقة' },
  { keys: ['Ctrl', 'Y'], description: 'إعادة تطبيق الخطوة المتراجع عنها' },
  { keys: ['Delete', 'Backspace'], description: 'حذف العقدة المحددة' },
  { keys: ['Escape'], description: 'إغلاق اللوحة الجانبية أو النوافذ' },
  { keys: ['F'], description: 'ملاءمة العرض (Fit View)' },
  { keys: ['Ctrl', 'S'], description: 'حفظ الجلسة' },
  { keys: ['Ctrl', 'E'], description: 'تصدير الخريطة' },
];

export function KeyboardShortcutsModal({ isOpen, onClose }: KeyboardShortcutsModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div 
        className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md overflow-y-auto"
        onClick={onClose}
        dir="rtl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="keyboard-shortcuts-title"
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
                <Keyboard className="w-5 h-5" />
              </div>
              <div>
                <h3 id="keyboard-shortcuts-title" className="text-lg font-bold text-text-main">
                  اختصارات لوحة المفاتيح
                </h3>
                <p className="text-xs text-text-dim mt-0.5">تحكّم سريع وسلس في كافة أرجاء الخريطة</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-text-dim hover:text-text-main hover:bg-bg-base/80 rounded-full transition-colors"
              aria-label="إغلاق"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Shortcuts List */}
          <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-2.5">
            {SHORTCUTS.map((shortcut, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 rounded-2xl bg-bg-base/70 border border-border-subtle hover:border-text-main/20 transition-all"
              >
                <span className="text-xs md:text-sm font-medium text-text-main">
                  {shortcut.description}
                </span>
                <div className="flex items-center gap-1 shrink-0 ml-3" dir="ltr">
                  {shortcut.keys.map((k, kIdx) => (
                    <span key={kIdx} className="flex items-center gap-1">
                      <kbd className="px-2.5 py-1 text-xs font-mono font-bold rounded-lg bg-bg-surface border border-border-subtle text-text-main shadow-xs min-w-[26px] text-center">
                        {k}
                      </kbd>
                      {kIdx < shortcut.keys.length - 1 && (
                        <span className="text-text-dim text-xs font-mono">+</span>
                      )}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Footer Tip */}
          <div className="p-4 border-t border-border-subtle bg-bg-base/40 flex items-center justify-between text-[11px] text-text-dim shrink-0">
            <span>اضغط على أي اختصار أثناء تصفح الخريطة</span>
            <kbd className="px-2 py-0.5 rounded bg-bg-surface border border-border-subtle font-mono text-[10px]">
              ESC للإغلاق
            </kbd>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
