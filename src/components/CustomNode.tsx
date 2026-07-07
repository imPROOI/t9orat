import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { cn } from '../lib/utils';
import { NodeType } from '../types';
import { motion } from 'motion/react';
import { Star } from 'lucide-react';

interface CustomNodeProps {
  data: {
    label: string;
    type: NodeType;
    description: string;
    isFaded?: boolean;
    starred?: boolean;
  };
  selected?: boolean;
}

const CustomNode = ({ data, selected }: CustomNodeProps) => {
  const isInput = data.type === 'input';
  const isIdea = data.type === 'idea';
  const isRec = data.type === 'recommendation';

  const isFaded = data.isFaded;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ 
        opacity: isFaded ? 0.15 : 1, 
        scale: selected ? 1.05 : 1 
      }}
      whileHover={!selected ? { scale: 1.02 } : undefined}
      transition={{
        opacity: { duration: 0.4, ease: "easeOut" },
        scale: { duration: 0.3, type: "spring", bounce: 0.4 }
      }}
      className={cn(
        "relative flex flex-col items-center justify-center cursor-pointer transition-colors duration-300",
        // Modern soft rounded aesthetic
        "min-w-[100px] max-w-[240px] px-5 py-3 rounded-2xl shadow-sm hover:shadow-md",
        "backdrop-blur-md bg-opacity-90 dark:bg-opacity-80",
        {
          // Input Node: Highlighted
          "bg-accent-primary text-bg-base border border-accent-primary z-[3]": isInput,
          // Idea Node: Main surface
          "bg-bg-base text-text-main border border-border-subtle z-[2]": isIdea,
          // Recommendation Node: Subtle surface
          "bg-bg-surface text-text-dim border border-border-subtle z-[1]": isRec,
          
          // Selection States
          "ring-4 ring-offset-2 ring-offset-bg-base ring-text-main": selected,
        }
      )}
    >
      <Handle type="target" position={Position.Top} className="opacity-0 w-full h-full absolute inset-0 z-[-1]" />
      <Handle type="source" position={Position.Bottom} className="opacity-0 w-full h-full absolute inset-0 z-[-1]" />
      
      {/* Soft rounded dot */}
      <div className={cn("absolute -top-1.5 -right-1.5 w-3.5 h-3.5 rounded-full shadow-sm", {
          "bg-bg-base border border-accent-primary": isInput,
          "bg-accent-primary": isIdea,
          "bg-text-dim": isRec,
      })} />

      {/* Star indicator */}
      {data.starred && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute -top-1.5 -left-1.5 z-10"
        >
          <Star className="w-4 h-4 fill-yellow-400 text-yellow-400 drop-shadow-sm" />
        </motion.div>
      )}

      <div className={cn(
        "w-full text-center whitespace-pre-wrap break-words leading-tight",
        {
          "font-bold text-[15px] uppercase tracking-wider": isInput,
          "font-medium text-[14px]": isIdea,
          "font-normal text-[12px]": isRec,
        }
      )} dir="auto">
        {data.label}
      </div>
    </motion.div>
  );
};

export default memo(CustomNode);
