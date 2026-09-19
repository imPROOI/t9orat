import { motion } from 'motion/react';
import { 
  BarChart3, 
  Keyboard, 
  Share2, 
  Moon, 
  Sun, 
  Settings, 
  Sparkles,
  Layers
} from 'lucide-react';

interface TopBarProps {
  sessionName?: string;
  nodesCount?: number;
  isDarkMode: boolean;
  onOpenStats: () => void;
  onOpenShortcuts: () => void;
  onOpenShare: () => void;
  onOpenSettings: () => void;
  onToggleTheme: () => void;
}

export function TopBar({
  sessionName = 'جلسة عمل جديدة',
  nodesCount = 0,
  isDarkMode,
  onOpenStats,
  onOpenShortcuts,
  onOpenShare,
  onOpenSettings,
  onToggleTheme,
}: TopBarProps) {
  return (
    <header 
      className="w-full shrink-0 z-30 px-3 py-2.5 md:px-6 md:py-3 flex items-center justify-between bg-bg-surface/70 backdrop-blur-xl border-b border-border-subtle/80"
      dir="rtl"
    >
      {/* Brand and Session Info */}
      <div className="flex items-center gap-3 md:gap-4 min-w-0">
        <div className="flex items-center gap-2 select-none shrink-0">
          <div className="w-8 h-8 md:w-9 md:h-9 rounded-xl bg-accent-primary/10 border border-accent-primary/20 flex items-center justify-center text-accent-primary shadow-sm shadow-accent-primary/10">
            <Sparkles className="w-4 h-4 md:w-5 md:h-5 text-accent-primary" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-base md:text-lg tracking-tight text-text-main">تصوّرات</span>
              <span className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] uppercase font-semibold tracking-wider rounded-md bg-accent-primary/10 text-accent-primary border border-accent-primary/20">
                v2.0
              </span>
            </div>
          </div>
        </div>

        {/* Vertical divider */}
        <div className="hidden sm:block w-px h-5 bg-border-subtle" />

        {/* Current Session Indicator */}
        <div className="flex items-center gap-2 min-w-0">
          <span 
            className="text-xs md:text-sm font-medium text-text-dim truncate max-w-[140px] sm:max-w-[200px] md:max-w-[300px]"
            title={sessionName}
          >
            {sessionName}
          </span>
          {nodesCount > 0 && (
            <span className="hidden xs:inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-bg-base/80 border border-border-subtle text-text-dim shrink-0">
              <Layers className="w-3 h-3 text-accent-primary" />
              <span>{nodesCount}</span>
            </span>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-1 md:gap-1.5 shrink-0">
        {/* Map Stats */}
        <motion.button
          whileHover={{ scale: 1.05, backgroundColor: 'rgba(255,255,255,0.05)' }}
          whileTap={{ scale: 0.95 }}
          onClick={onOpenStats}
          aria-label="إحصائيات الخريطة"
          title="إحصائيات الخريطة"
          className="flex items-center justify-center w-8 h-8 md:w-9 md:h-9 rounded-xl text-text-dim hover:text-text-main transition-colors"
        >
          <BarChart3 className="w-4 h-4 md:w-4.5 md:h-4.5" />
        </motion.button>

        {/* Keyboard Shortcuts */}
        <motion.button
          whileHover={{ scale: 1.05, backgroundColor: 'rgba(255,255,255,0.05)' }}
          whileTap={{ scale: 0.95 }}
          onClick={onOpenShortcuts}
          aria-label="اختصارات لوحة المفاتيح (?)"
          title="اختصارات لوحة المفاتيح (?)"
          className="flex items-center justify-center w-8 h-8 md:w-9 md:h-9 rounded-xl text-text-dim hover:text-text-main transition-colors"
        >
          <Keyboard className="w-4 h-4 md:w-4.5 md:h-4.5" />
        </motion.button>

        {/* Share */}
        <motion.button
          whileHover={{ scale: 1.05, backgroundColor: 'rgba(255,255,255,0.05)' }}
          whileTap={{ scale: 0.95 }}
          onClick={onOpenShare}
          aria-label="مشاركة الخريطة"
          title="مشاركة الخريطة"
          className="flex items-center justify-center w-8 h-8 md:w-9 md:h-9 rounded-xl text-text-dim hover:text-text-main transition-colors"
        >
          <Share2 className="w-4 h-4 md:w-4.5 md:h-4.5" />
        </motion.button>

        <div className="w-px h-5 bg-border-subtle mx-0.5 md:mx-1" />

        {/* Theme Toggle */}
        <motion.button
          whileHover={{ scale: 1.05, backgroundColor: 'rgba(255,255,255,0.05)' }}
          whileTap={{ scale: 0.95 }}
          onClick={onToggleTheme}
          aria-label={isDarkMode ? 'تفعيل الوضع الفاتح' : 'تفعيل الوضع الداكن'}
          title={isDarkMode ? 'تفعيل الوضع الفاتح' : 'تفعيل الوضع الداكن'}
          className="flex items-center justify-center w-8 h-8 md:w-9 md:h-9 rounded-xl text-text-dim hover:text-text-main transition-colors"
        >
          {isDarkMode ? <Sun className="w-4 h-4 md:w-4.5 md:h-4.5" /> : <Moon className="w-4 h-4 md:w-4.5 md:h-4.5" />}
        </motion.button>

        {/* Settings */}
        <motion.button
          whileHover={{ scale: 1.05, backgroundColor: 'rgba(255,255,255,0.05)' }}
          whileTap={{ scale: 0.95 }}
          onClick={onOpenSettings}
          aria-label="إعدادات الذكاء الاصطناعي"
          title="إعدادات الذكاء الاصطناعي"
          className="flex items-center justify-center w-8 h-8 md:w-9 md:h-9 rounded-xl text-text-dim hover:text-text-main transition-colors"
        >
          <Settings className="w-4 h-4 md:w-4.5 md:h-4.5" />
        </motion.button>
      </div>
    </header>
  );
}
