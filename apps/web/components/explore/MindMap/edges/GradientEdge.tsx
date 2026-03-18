'use client';

import { memo } from 'react';
import { BaseEdge, getBezierPath, type EdgeProps } from '@xyflow/react';

const lineColors = [
  '#34d399', // emerald
  '#fbbf24', // amber
  '#f472b6', // pink
  '#22d3ee', // cyan
  '#a78bfa', // violet
];

interface GradientEdgeData {
  colorIndex: number;
  isSelected: boolean;
  isStep: boolean;
}

function GradientEdgeInner({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
}: EdgeProps) {
  const { colorIndex, isSelected, isStep } = (data ?? {}) as unknown as GradientEdgeData;

  const [edgePath] = getBezierPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
  });

  const gradientId = `gradient-edge-${id}`;
  const filterId = `glow-edge-${id}`;
  const color = lineColors[colorIndex % lineColors.length];

  if (isStep) {
    return (
      <>
        <BaseEdge
          id={id}
          path={edgePath}
          style={{
            stroke: 'rgba(156, 163, 175, 0.5)',
            strokeWidth: 2,
            strokeLinecap: 'round',
          }}
        />
      </>
    );
  }

  return (
    <>
      <defs>
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#a78bfa" stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0.8" />
        </linearGradient>
        {isSelected && (
          <filter id={filterId} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        )}
      </defs>
      <BaseEdge
        id={id}
        path={edgePath}
        style={{
          stroke: `url(#${gradientId})`,
          strokeWidth: isSelected ? 3 : 2,
          strokeLinecap: 'round',
          filter: isSelected ? `url(#${filterId})` : undefined,
        }}
      />
    </>
  );
}

export const GradientEdge = memo(GradientEdgeInner);
