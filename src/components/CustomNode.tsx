import { memo } from 'react';
import { Handle, Position, NodeProps, Node } from '@xyflow/react';
import { cn } from '../lib/utils';
import { NodeType } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { Star, FileText, Check } from 'lucide-react';

export type CustomNodeColor = 'emerald' | 'amber' | 'rose' | 'sky' | 'purple' | 'indigo' | string;

export interface CustomNodeData extends Record<string, unknown> {
  label: string;
  type: NodeType;
  description: string;
  isFaded?: boolean;
  starred?: boolean;
  customColor?: CustomNodeColor;
  userNotes?: string;
  isMultiSelected?: boolean;
  ideaContext?: string;
  recommendationType?: string;
  searchQueries?: {
    label: string;
    query: string;
    site: 'google' | 'scholar' | 'youtube' | 'wikipedia';
  }[];
}

export type CustomNodeType = Node<CustomNodeData, 'customNode'>;
export type CustomNodeComponentProps = NodeProps<CustomNodeType>;

interface ColorScheme {
  bg: string;
  border: string;
  dot: string;
  dotGlow: string;
  badge: string;
}

const COLOR_SCHEMES: Record<string, ColorScheme> = {
  emerald: {
    bg: 'bg-gradient-to-br from-emerald-500/15 via-emerald-500/5 to-bg-surface/90 dark:from-emerald-500/25 dark:via-emerald-500/10 dark:to-bg-surface/90',
    border: 'border-emerald-500/40 hover:border-emerald-500/70',
    dot: 'bg-emerald-500',
    dotGlow: 'shadow-[0_0_10px_rgba(16,185,129,0.85)]',
    badge: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30'
  },
  amber: {
    bg: 'bg-gradient-to-br from-amber-500/15 via-amber-500/5 to-bg-surface/90 dark:from-amber-500/25 dark:via-amber-500/10 dark:to-bg-surface/90',
    border: 'border-amber-500/40 hover:border-amber-500/70',
    dot: 'bg-amber-500',
    dotGlow: 'shadow-[0_0_10px_rgba(245,158,11,0.85)]',
    badge: 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30',
    text: 'text-text-main'
  } as ColorScheme,
  rose: {
    bg: 'bg-gradient-to-br from-rose-500/15 via-rose-500/5 to-bg-surface/90 dark:from-rose-500/25 dark:via-rose-500/10 dark:to-bg-surface/90',
    border: 'border-rose-500/40 hover:border-rose-500/70',
    dot: 'bg-rose-500',
    dotGlow: 'shadow-[0_0_10px_rgba(244,63,94,0.85)]',
    badge: 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30'
  },
  sky: {
    bg: 'bg-gradient-to-br from-sky-500/15 via-sky-500/5 to-bg-surface/90 dark:from-sky-500/25 dark:via-sky-500/10 dark:to-bg-surface/90',
    border: 'border-sky-500/40 hover:border-sky-500/70',
    dot: 'bg-sky-500',
    dotGlow: 'shadow-[0_0_10px_rgba(14,165,233,0.85)]',
    badge: 'bg-sky-500/15 text-sky-700 dark:text-sky-300 border-sky-500/30'
  },
  purple: {
    bg: 'bg-gradient-to-br from-purple-500/15 via-purple-500/5 to-bg-surface/90 dark:from-purple-500/25 dark:via-purple-500/10 dark:to-bg-surface/90',
    border: 'border-purple-500/40 hover:border-purple-500/70',
    dot: 'bg-purple-500',
    dotGlow: 'shadow-[0_0_10px_rgba(168,85,247,0.85)]',
    badge: 'bg-purple-500/15 text-purple-700 dark:text-purple-300 border-purple-500/30'
  },
  indigo: {
    bg: 'bg-gradient-to-br from-indigo-500/15 via-indigo-500/5 to-bg-surface/90 dark:from-indigo-500/25 dark:via-indigo-500/10 dark:to-bg-surface/90',
    border: 'border-indigo-500/40 hover:border-indigo-500/70',
    dot: 'bg-indigo-500',
    dotGlow: 'shadow-[0_0_10px_rgba(99,102,241,0.85)]',
    badge: 'bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border-indigo-500/30'
  }
};

const CustomNode = ({ id, data, selected }: CustomNodeComponentProps) => {
  const isInput = data.type === 'input';
  const isIdea = data.type === 'idea';
  const isRec = data.type === 'recommendation';
  const isFaded = data.isFaded;

  const customColorKey = data.customColor ? data.customColor.toLowerCase() : null;
  const colorTheme = customColorKey && COLOR_SCHEMES[customColorKey] ? COLOR_SCHEMES[customColorKey] : null;

  const isMultiSelected = Boolean(data.isMultiSelected);
  const isCurrentlySelected = Boolean(selected || isMultiSelected);
  const hasUserNotes = Boolean(data.userNotes && data.userNotes.trim().length > 0);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.85 }}
      animate={{
        opacity: isFaded ? 0.15 : 1,
        scale: isCurrentlySelected ? 1.05 : 1,
        y: isCurrentlySelected ? -2 : 0
      }}
      whileHover={!isCurrentlySelected ? { scale: 1.03, y: -2 } : undefined}
      whileTap={{ scale: 0.98 }}
      transition={{
        opacity: { duration: 0.35, ease: 'easeOut' },
        scale: { duration: 0.28, type: 'spring', bounce: 0.35 },
        y: { duration: 0.2 }
      }}
      role="button"
      tabIndex={0}
      aria-label={`${data.label} (${data.type})`}
      aria-selected={isCurrentlySelected}
      className={cn(
        'relative flex flex-col items-center justify-center cursor-pointer transition-all duration-300',
        // Modern soft rounded aesthetic
        'min-w-[110px] max-w-[260px] px-5 py-3.5 rounded-2xl shadow-sm hover:shadow-md',
        'backdrop-blur-md',
        // Default vs custom colors
        colorTheme
          ? cn(
              colorTheme.bg,
              'text-text-main border',
              colorTheme.border,
              'z-[2]'
            )
          : {
              // Input Node: Highlighted
              'bg-accent-primary text-bg-base border border-accent-primary z-[3] shadow-md': isInput,
              // Idea Node: Main surface
              'bg-bg-base/95 text-text-main border border-border-subtle z-[2]': isIdea,
              // Recommendation Node: Subtle surface
              'bg-bg-surface/90 text-text-dim border border-border-subtle z-[1]': isRec
            }
      )}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="opacity-0 w-full h-full absolute inset-0 z-[-1] cursor-pointer pointer-events-auto"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        className="opacity-0 w-full h-full absolute inset-0 z-[-1] cursor-pointer pointer-events-auto"
      />

      {/* Multi-selection distinctive animated ring */}
      <AnimatePresence>
        {isCurrentlySelected && (
          <motion.div
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            className={cn(
              'absolute -inset-1.5 rounded-[20px] pointer-events-none z-30',
              'border-2 ring-2 ring-offset-2 ring-offset-bg-base',
              isMultiSelected
                ? 'border-accent-primary ring-accent-primary/50 shadow-[0_0_12px_rgba(0,0,0,0.15)] dark:shadow-[0_0_15px_rgba(255,255,255,0.25)]'
                : 'border-text-main ring-text-main/30'
            )}
          />
        )}
      </AnimatePresence>

      {/* Multi-selection checkmark badge */}
      {isMultiSelected && (
        <motion.div
          initial={{ scale: 0, rotate: -20 }}
          animate={{ scale: 1, rotate: 0 }}
          exit={{ scale: 0 }}
          className="absolute -top-2 -right-2 z-40 flex items-center justify-center w-5 h-5 rounded-full bg-text-main text-bg-base shadow-md"
          title="عنصر محدد ضمن مجموعة"
        >
          <Check className="w-3 h-3 stroke-[3]" />
        </motion.div>
      )}

      {/* Glowing accent dot / status indicator */}
      {!isMultiSelected && (
        <div
          className={cn(
            'absolute -top-1.5 -right-1.5 w-3.5 h-3.5 rounded-full transition-all duration-300',
            colorTheme
              ? cn(colorTheme.dot, colorTheme.dotGlow)
              : {
                  'bg-bg-base border border-accent-primary': isInput,
                  'bg-accent-primary shadow-[0_0_6px_rgba(0,0,0,0.2)] dark:shadow-[0_0_6px_rgba(255,255,255,0.4)]': isIdea,
                  'bg-text-dim': isRec
                }
          )}
        />
      )}

      {/* Star indicator */}
      {data.starred && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute -top-1.5 -left-1.5 z-10 drop-shadow-sm"
          title="فكرة مميزة بنجمة"
        >
          <Star className="w-4 h-4 fill-amber-400 text-amber-500" />
        </motion.div>
      )}

      {/* User notes indicator */}
      {hasUserNotes && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          whileHover={{ scale: 1.15 }}
          className={cn(
            'absolute -bottom-1.5 -right-1.5 z-20 flex items-center justify-center w-5 h-5 rounded-full',
            'bg-bg-surface border border-border-subtle shadow-sm text-text-dim hover:text-text-main transition-colors',
            'hover:bg-bg-base'
          )}
          title={`ملاحظاتك: ${data.userNotes}`}
        >
          <FileText className="w-2.5 h-2.5 text-text-dim" />
        </motion.div>
      )}

      {/* Node label */}
      <div
        className={cn(
          'w-full text-center whitespace-pre-wrap break-words leading-snug select-none',
          {
            'font-bold text-[14px] sm:text-[15px] uppercase tracking-wider': isInput,
            'font-bold text-[13px] sm:text-[14px]': isIdea,
            'font-medium text-[12px] sm:text-[13px]': isRec
          }
        )}
        dir="auto"
      >
        {data.label}
      </div>
    </motion.div>
  );
};

export default memo(CustomNode);
