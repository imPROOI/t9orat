import { BaseEdge, EdgeProps, getBezierPath } from '@xyflow/react';

interface CustomEdgeData extends Record<string, unknown> {
  explanation?: string;
  isFaded?: boolean;
  isHighlighted?: boolean;
}

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
  style
}: EdgeProps<any>) {
  const [edgePath] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const isFaded = data?.isFaded;
  const isHighlighted = data?.isHighlighted;

  const strokeColor = selected || isHighlighted ? 'var(--color-accent-primary)' : 'rgba(115, 118, 106, 0.3)';
  const strokeWidthAttr = selected || isHighlighted ? 2 : 1;
  const opacityAttr = isFaded ? 0.1 : 1;

  return (
    <g style={{ opacity: opacityAttr, transition: 'opacity 0.4s ease-out' }}>
      <BaseEdge 
        path={edgePath} 
        style={{
          ...style,
          strokeWidth: strokeWidthAttr,
          stroke: strokeColor,
          transition: 'stroke 0.8s cubic-bezier(0.16, 1, 0.3, 1), stroke-width 0.8s cubic-bezier(0.16, 1, 0.3, 1)',
        }} 
      />
      {/* Invisible thicker edge for easier clicking */}
      <BaseEdge 
        path={edgePath} 
        style={{
          strokeWidth: 20,
          stroke: 'transparent',
          cursor: 'pointer'
        }} 
        className="react-flow__edge-interaction transition-colors duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] hover:[stroke:rgba(158,103,82,0.3)]"
      />
    </g>
  );
}
