import { motion } from 'motion/react';
import { ArrowLeft } from 'lucide-react';

interface IntroScreenProps {
  onStart: () => void;
}

// A tiny animated node decoration — purely presentational
function FloatingDot({ x, y, delay, size = 4 }: { x: string; y: string; delay: number; size?: number }) {
  return (
    <motion.div
      className="absolute bg-text-main/10 pointer-events-none"
      style={{ left: x, top: y, width: size, height: size }}
      animate={{ y: [0, -10, 0], opacity: [0.2, 0.5, 0.2] }}
      transition={{ duration: 4 + delay, repeat: Infinity, ease: 'easeInOut', delay }}
    />
  );
}

export function IntroScreen({ onStart }: IntroScreenProps) {
  return (
    <div
      className="fixed inset-0 bg-bg-base text-text-main font-sans flex flex-col items-center justify-center p-6 overflow-hidden"
      dir="rtl"
    >
      {/* Minimalist Backdrop */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute inset-0 bg-bg-base" />
      </div>

      {/* Ambient floating dots — evoke graph nodes */}
      <FloatingDot x="12%"  y="20%" delay={0}   size={5} />
      <FloatingDot x="80%"  y="15%" delay={1.3} size={3} />
      <FloatingDot x="88%"  y="70%" delay={0.7} size={6} />
      <FloatingDot x="7%"   y="72%" delay={2.1} size={4} />
      <FloatingDot x="55%"  y="88%" delay={0.4} size={3} />
      <FloatingDot x="25%"  y="85%" delay={1.8} size={5} />
      <FloatingDot x="70%"  y="30%" delay={1.0} size={4} />

      {/* Main content */}
      <motion.div
        initial={{ opacity: 0, y: 28 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1.0, ease: [0.16, 1, 0.3, 1] }}
        className="max-w-xl w-full text-center z-10 flex flex-col items-center gap-0"
      >
        {/* Logo text instead of image for minimalism */}
        <motion.div
          initial={{ scale: 0.75, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.9, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          className="mb-7 relative"
        >
          <div className="text-6xl md:text-8xl font-black tracking-tighter text-text-main uppercase">
            T9ORAT
          </div>
        </motion.div>

        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="text-4xl sm:text-5xl md:text-[58px] font-bold text-text-main leading-[1.15] mb-4"
        >
          مساحة التأمل{' '}
          <span className="text-text-dim/70">والمعرفة</span>
        </motion.h1>

        {/* Sub-headline */}
        <motion.p
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="text-base sm:text-lg text-text-dim/85 font-serif leading-relaxed mb-10 max-w-md mx-auto px-2"
        >
          منصة بصرية لتوليد أفكار استثنائية وبناء شبكات عقلية مترابطة — تعتمد على الاكتشاف والمنطق والتوصيات الدقيقة.
        </motion.p>

        {/* CTA */}
        <motion.button
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.42, ease: [0.16, 1, 0.3, 1] }}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={onStart}
          className="group relative inline-flex items-center justify-center gap-3 px-9 py-4 rounded-none font-bold text-[15px] bg-text-main text-bg-base overflow-hidden shadow-none hover:bg-bg-base hover:text-text-main border-2 border-text-main transition-colors duration-300 uppercase"
        >
          <span>تفعيل الشبكة والانطلاق</span>
          <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform duration-200" />
        </motion.button>
      </motion.div>

      {/* Footer credit */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 0.8 }}
        className="absolute bottom-7 left-0 right-0 text-center pointer-events-none z-10"
      >
        <p className="text-[11px] font-sans text-text-dim/50 select-none">
          صنع بحب ·{' '}
          <a
            href="mailto:OsamaAl-Zahrani@outlook.sa"
            className="hover:text-text-main transition-colors pointer-events-auto font-bold"
          >
            OsamaAl-Zahrani@outlook.sa
          </a>
        </p>
        <span className="text-[9px] uppercase tracking-[0.3em] text-text-dim/50 font-bold mt-1 block">
          T9ORAT EXPERIMENTAL
        </span>
      </motion.div>
    </div>
  );
}