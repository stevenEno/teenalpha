'use client';

import { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { motion } from 'framer-motion';
import type { ExploreStep } from '@teen-alpha/database';

interface StepNodeData {
  step: ExploreStep;
  delay: number;
}

function StepFlowNodeInner({ data }: NodeProps) {
  const { step, delay } = data as unknown as StepNodeData;

  return (
    <>
      <Handle type="target" position={Position.Top} className="!opacity-0 !w-0 !h-0" />
      <motion.div
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{
          type: 'spring',
          stiffness: 400,
          damping: 30,
          delay,
        }}
      >
        <div className="relative">
          {/* Step number badge */}
          <div className="w-12 h-12 rounded-full bg-white shadow-lg border-2 border-gray-100 flex items-center justify-center">
            <span className="text-base font-bold text-gray-700">
              {step.order}
            </span>
          </div>

          {/* Step title tooltip */}
          <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 whitespace-nowrap">
            <span className="text-xs text-gray-500 bg-white/90 px-1.5 py-0.5 rounded shadow-sm max-w-[100px] truncate block">
              {step.title}
            </span>
          </div>
        </div>
      </motion.div>
    </>
  );
}

export const StepFlowNode = memo(StepFlowNodeInner);
