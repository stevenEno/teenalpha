'use client';

import { motion } from 'framer-motion';
import type { Position } from '@/lib/mind-map-utils';
import { getCurvedPath, getStraightPath } from '@/lib/mind-map-utils';

interface ConnectionLine {
  from: Position;
  to: Position;
  id: string;
  isSelected?: boolean;
  isStep?: boolean;
}

interface ConnectionLinesProps {
  lines: ConnectionLine[];
  containerWidth: number;
  containerHeight: number;
}

// Colors matching PathNode colors
const lineColors = [
  '#34d399', // emerald
  '#fbbf24', // amber
  '#f472b6', // pink
  '#22d3ee', // cyan
  '#a78bfa', // violet
];

export function ConnectionLines({ lines, containerWidth, containerHeight }: ConnectionLinesProps) {
  const centerX = containerWidth / 2;
  const centerY = containerHeight / 2;

  return (
    <svg
      className="absolute inset-0 w-full h-full pointer-events-none z-0"
      viewBox={`0 0 ${containerWidth} ${containerHeight}`}
      preserveAspectRatio="xMidYMid meet"
    >
      <defs>
        {/* Gradient definitions for each line color */}
        {lineColors.map((color, i) => (
          <linearGradient key={`gradient-${i}`} id={`line-gradient-${i}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#a78bfa" stopOpacity="0.3" />
            <stop offset="100%" stopColor={color} stopOpacity="0.8" />
          </linearGradient>
        ))}

        {/* Glow filter for selected lines */}
        <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {lines.map((line, index) => {
        // Adjust positions to SVG coordinates (center-based to top-left-based)
        const fromX = centerX + line.from.x;
        const fromY = centerY + line.from.y;
        const toX = centerX + line.to.x;
        const toY = centerY + line.to.y;

        const adjustedFrom = { x: fromX, y: fromY };
        const adjustedTo = { x: toX, y: toY };

        const pathData = line.isStep
          ? getStraightPath(adjustedFrom, adjustedTo)
          : getCurvedPath(adjustedFrom, adjustedTo);

        const colorIndex = parseInt(line.id.split('-')[1]) || index;
        const strokeColor = line.isStep
          ? 'rgba(156, 163, 175, 0.4)' // gray for step lines
          : `url(#line-gradient-${colorIndex % lineColors.length})`;

        return (
          <motion.path
            key={line.id}
            d={pathData}
            fill="none"
            stroke={strokeColor}
            strokeWidth={line.isSelected ? 3 : 2}
            strokeLinecap="round"
            filter={line.isSelected ? 'url(#glow)' : undefined}
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{
              pathLength: { duration: 0.5, delay: index * 0.1 },
              opacity: { duration: 0.3, delay: index * 0.1 },
            }}
          />
        );
      })}
    </svg>
  );
}
