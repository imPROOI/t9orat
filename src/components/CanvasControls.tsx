import { useReactFlow } from '@xyflow/react';
import { Plus, Minus, Maximize2 } from 'lucide-react';
import { motion } from 'motion/react';

interface CanvasControlsProps {
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  onFitView?: () => void;
  className?: string;
}

export function CanvasControls({
  onZoomIn,
  onZoomOut,
  onFitView,
  className = '',
}: CanvasControlsProps) {
  // Try to acquire ReactFlow instance if mounted within ReactFlowProvider
  let reactFlow: ReturnType<typeof useReactFlow> | null = null;
  try {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    reactFlow = useReactFlow();
  } catch {
    // In case CanvasControls is used outside ReactFlowProvider, fallback to props
    reactFlow = null;
  }

  const handleZoomIn = () => {
    if (onZoomIn) {
      onZoomIn();
    } else if (reactFlow) {
      reactFlow.zoomIn({ duration: 300 });
    }
  };

  const handleZoomOut = () => {
    if (onZoomOut) {
      onZoomOut();
    } else if (reactFlow) {
      reactFlow.zoomOut({ duration: 300 });
    }
  };

  const handleFitView = () => {
    if (onFitView) {
      onFitView();
    } else if (reactFlow) {
      reactFlow.fitView({ padding: 0.2, duration: 400 });
    }
  };

  return (
    <aside
      aria-label="أدوات التحكم باللوحة"
      className={`flex flex-col items-center gap-1 p-1.5 bg-bg-surface/85 backdrop-blur-xl border border-border-subtle rounded-2xl soft-shadow z-30 select-none ${className}`}
      dir="rtl"
    >
      <motion.button
        whileHover={{ scale: 1.1, backgroundColor: 'rgba(255,255,255,0.08)' }}
        whileTap={{ scale: 0.9 }}
        onClick={handleZoomIn}
        aria-label="تكبير المنظور (+)"
        title="تكبير (+)"
        className="w-8 h-8 md:w-9 md:h-9 flex items-center justify-center rounded-xl text-text-dim hover:text-text-main transition-colors"
      >
        <Plus className="w-4 h-4 md:w-4.5 md:h-4.5" />
      </motion.button>

      <div className="w-4 h-px bg-border-subtle/80" />

      <motion.button
        whileHover={{ scale: 1.1, backgroundColor: 'rgba(255,255,255,0.08)' }}
        whileTap={{ scale: 0.9 }}
        onClick={handleZoomOut}
        aria-label="تصغير المنظور (-)"
        title="تصغير (-)"
        className="w-8 h-8 md:w-9 md:h-9 flex items-center justify-center rounded-xl text-text-dim hover:text-text-main transition-colors"
      >
        <Minus className="w-4 h-4 md:w-4.5 md:h-4.5" />
      </motion.button>

      <div className="w-4 h-px bg-border-subtle/80" />

      <motion.button
        whileHover={{ scale: 1.1, backgroundColor: 'rgba(255,255,255,0.08)' }}
        whileTap={{ scale: 0.9 }}
        onClick={handleFitView}
        aria-label="ملاءمة العرض للخريطة"
        title="ملاءمة العرض (Fit View)"
        className="w-8 h-8 md:w-9 md:h-9 flex items-center justify-center rounded-xl text-text-dim hover:text-text-main transition-colors"
      >
        <Maximize2 className="w-4 h-4 md:w-4.5 md:h-4.5" />
      </motion.button>
    </aside>
  );
}
