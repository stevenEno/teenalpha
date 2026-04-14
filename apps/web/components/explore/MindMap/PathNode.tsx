'use client';

import { motion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import type { ExplorePathSummary } from '@teen-alpha/database';
import type { Position } from '@/lib/mind-map-utils';
import { getPathIcon } from '@/lib/path-icons';

interface PathNodeProps {
  path: ExplorePathSummary;
  position: Position;
  index: number;
  isSelected: boolean;
  onSelect: () => void;
  delay?: number;
}

// Colors for each path node
const pathColors = [
  { bg: 'from-emerald-400 to-teal-500', border: 'border-emerald-300', glow: 'bg-emerald-400' },
  { bg: 'from-amber-400 to-orange-500', border: 'border-amber-300', glow: 'bg-amber-400' },
  { bg: 'bg-[#2EC4B6]', border: 'border-[#2EC4B6]/40', glow: 'bg-[#2EC4B6]/60' },
  { bg: 'from-cyan-400 to-blue-500', border: 'border-cyan-300', glow: 'bg-cyan-400' },
  { bg: 'bg-[#FF6B35]', border: 'border-[#FF6B35]/40', glow: 'bg-[#FF6B35]/60' },
];

export function PathNode({
  path,
  position,
  index,
  isSelected,
  onSelect,
  delay = 0,
}: PathNodeProps) {
  const colors = pathColors[index % pathColors.length];

  return (
    <motion.button
      onClick={onSelect}
      className="absolute z-10"
      style={{
        left: `calc(50% + ${position.x}px)`,
        top: `calc(50% + ${position.y}px)`,
        transform: 'translate(-50%, -50%)',
      }}
      initial={{ opacity: 0, scale: 0 }}
      animate={{
        opacity: 1,
        scale: isSelected ? 1.1 : 1,
      }}
      transition={{
        type: 'spring',
        stiffness: 300,
        damping: 25,
        delay,
      }}
      whileHover={{ scale: isSelected ? 1.1 : 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      <div className="relative">
        {/* Glow effect when selected */}
        {isSelected && (
          <motion.div
            className={`absolute inset-0 ${colors.glow} rounded-2xl blur-lg opacity-40 scale-110`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.4 }}
          />
        )}

        {/* Main node */}
        <div
          className={`
            relative w-28 h-28 sm:w-32 sm:h-32 rounded-2xl
            bg-gradient-to-br ${colors.bg}
            flex flex-col items-center justify-center gap-1
            shadow-lg ${isSelected ? 'ring-4 ring-white ring-offset-2' : ''}
            ${colors.border} border-2
            transition-shadow duration-200
            p-2
          `}
        >
          {/* Illustration */}
          <img
            src={getPathIcon(path.name, path.tagline)}
            alt={path.name}
            className="w-10 h-10 sm:w-12 sm:h-12 object-contain drop-shadow-sm"
          />

          {/* Name */}
          <span className="text-white font-semibold text-xs sm:text-sm text-center px-1 leading-tight">
            {path.name.length > 15 ? path.name.slice(0, 15) + '...' : path.name}
          </span>

          {/* Expand indicator */}
          {isSelected && (
            <motion.div
              className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-white rounded-full p-0.5 shadow-md"
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <ChevronRight className="w-3 h-3 text-gray-600 rotate-90" />
            </motion.div>
          )}
        </div>

        {/* Tagline tooltip on hover (desktop) */}
        <div className="hidden sm:block absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
          <span className="text-xs text-gray-600 bg-white px-2 py-1 rounded shadow-sm">
            {path.tagline}
          </span>
        </div>
      </div>
    </motion.button>
  );
}
