import { useState } from 'react';
import { BaseEdge, EdgeProps, Edge, getBezierPath } from '@xyflow/react';

export interface CustomEdgeData extends Record<string, unknown> {
  explanation?: string;
  isFaded?: boolean;
  isHighlighted?: boolean;
  animated?: boolean;
  label?: string;
}

export type CustomEdgeType = Edge<CustomEdgeData, 'customEdge'>;

export default function CustomEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  selected,
  data,
  style,
  markerEnd,
  markerStart
}: EdgeProps<CustomEdgeType>) {
  const [isHovered, setIsHovered] = useState(false);

  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const isFaded = Boolean(data?.isFaded);
  const isHighlighted = Boolean(data?.isHighlighted);
  const isAnimated = Boolean(data?.animated || isHighlighted);
  const isActive = Boolean(selected || isHighlighted || isHovered);

  // Dynamic stroke styling based on interaction state
  const strokeColor = isActive
    ? 'var(--color-text-main)'
    : 'rgba(115, 118, 106, 0.35)';

  const strokeWidthAttr = isActive ? (selected ? 2.5 : 2) : 1.25;
  const opacityAttr = isFaded ? 0.08 : 1;

  return (
    <g
      className="custom-edge-group group cursor-pointer"
      style={{ opacity: opacityAttr, transition: 'opacity 0.35s cubic-bezier(0.16, 1, 0.3, 1)' }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      role="graphics-symbol"
      aria-label={data?.explanation || 'رابط منطقي بين الفكرتين'}
    >
      {/* Tooltip for SVG */}
      {data?.explanation && <title>{data.explanation}</title>}

      {/* SVG Keyframe Animation for dynamic flow */}
      <defs>
        <style>{`
          @keyframes edgeFlow_${id.replace(/[^a-zA-Z0-9_-]/g, '_')} {
            0% { stroke-dashoffset: 24; }
            100% { stroke-dashoffset: 0; }
          }
        `}</style>
        {isActive && (
          <filter id={`edge-glow-${id.replace(/[^a-zA-Z0-9_-]/g, '_')}`} x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="0" stdDeviation="2.5" floodColor="currentColor" floodOpacity="0.3" />
          </filter>
        )}
      </defs>

      {/* Ambient soft glow line behind when hovered or selected */}
      {isActive && (
        <BaseEdge
          path={edgePath}
          style={{
            strokeWidth: strokeWidthAttr + 4,
            stroke: strokeColor,
            opacity: 0.15,
            transition: 'all 0.3s ease-out'
          }}
        />
      )}

      {/* Main Base Edge */}
      <BaseEdge
        path={edgePath}
        markerEnd={markerEnd}
        markerStart={markerStart}
        style={{
          ...style,
          strokeWidth: strokeWidthAttr,
          stroke: strokeColor,
          strokeDasharray: isAnimated ? '5, 4' : undefined,
          animation: isAnimated
            ? `edgeFlow_${id.replace(/[^a-zA-Z0-9_-]/g, '_')} 1.2s linear infinite`
            : undefined,
          transition: 'stroke 0.3s cubic-bezier(0.16, 1, 0.3, 1), stroke-width 0.25s cubic-bezier(0.16, 1, 0.3, 1), stroke-dasharray 0.3s ease',
          filter: isActive ? `url(#edge-glow-${id.replace(/[^a-zA-Z0-9_-]/g, '_')})` : undefined
        }}
      />

      {/* Invisible thicker path for effortless mouse and touch interaction */}
      <BaseEdge
        path={edgePath}
        style={{
          strokeWidth: 28,
          stroke: 'transparent',
          cursor: 'pointer'
        }}
        className="react-flow__edge-interaction"
      />

      {/* Optional subtle dot marker traversing active edges */}
      {isActive && (
        <circle
          r="3"
          className="fill-text-main animate-pulse transition-opacity duration-300 pointer-events-none"
          cx={labelX}
          cy={labelY}
        />
      )}
    </g>
  );
}
