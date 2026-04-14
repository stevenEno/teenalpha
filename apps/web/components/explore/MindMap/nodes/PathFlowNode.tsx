'use client';

import { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { motion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import type { ExplorePathSummary } from '@teen-alpha/database';
import { getPathIcon } from '@/lib/path-icons';

interface PathNodeData {
  path: ExplorePathSummary;
  index: number;
  isSelected: boolean;
}

const pathColors = [
  { bg: 'from-emerald-400 to-teal-500', border: 'border-emerald-300', glow: 'bg-emerald-400' },
  { bg: 'from-amber-400 to-orange-500', border: 'border-amber-300', glow: 'bg-amber-400' },
  { bg: 'bg-[#2EC4B6]', border: 'border-[#2EC4B6]/40', glow: 'bg-[#2EC4B6]/60' },
  { bg: 'from-cyan-400 to-blue-500', border: 'border-cyan-300', glow: 'bg-cyan-400' },
  { bg: 'bg-[#FF6B35]', border: 'border-[#FF6B35]/40', glow: 'bg-[#FF6B35]/60' },
];

function PathFlowNodeInner({ data }: NodeProps) {
  const { path, index, isSelected } = data as unknown as PathNodeData;
  const colors = pathColors[index % pathColors.length];

  return (
    <>
      <Handle type="target" position={Position.Top} className="!opacity-0 !w-0 !h-0" />
      <Handle type="source" position={Position.Bottom} className="!opacity-0 !w-0 !h-0" />
      <motion.div
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: isSelected ? 1.1 : 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        whileHover={{ scale: isSelected ? 1.1 : 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="cursor-pointer"
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
              relative w-32 h-32 rounded-2xl
              bg-gradient-to-br ${colors.bg}
              flex flex-col items-center justify-center gap-1
              shadow-lg ${isSelected ? 'ring-4 ring-white ring-offset-2' : ''}
              ${colors.border} border-2
              transition-shadow duration-200
              p-2
            `}
          >
            <img
              src={getPathIcon(path.name, path.tagline)}
              alt={path.name}
              className="w-12 h-12 object-contain drop-shadow-sm"
            />
            <span className="text-white font-semibold text-sm text-center px-1 leading-tight">
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

          {/* Tagline below */}
          <div className="mt-2 text-center max-w-[140px]">
            <span className="text-xs text-gray-600 bg-white/90 px-2 py-1 rounded shadow-sm">
              {path.tagline}
            </span>
          </div>
        </div>
      </motion.div>
    </>
  );
}

export const PathFlowNode = memo(PathFlowNodeInner);
