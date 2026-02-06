'use client';

import { motion } from 'framer-motion';
import type { ExploreStep } from '@teen-alpha/database';
import type { Position } from '@/lib/mind-map-utils';

interface StepNodeProps {
  step: ExploreStep;
  position: Position;
  delay?: number;
  isVisible: boolean;
}

export function StepNode({ step, position, delay = 0, isVisible }: StepNodeProps) {
  return (
    <motion.div
      className="absolute z-5 pointer-events-none"
      style={{
        left: `calc(50% + ${position.x}px)`,
        top: `calc(50% + ${position.y}px)`,
        transform: 'translate(-50%, -50%)',
      }}
      initial={{ opacity: 0, scale: 0 }}
      animate={
        isVisible
          ? { opacity: 1, scale: 1 }
          : { opacity: 0, scale: 0 }
      }
      transition={{
        type: 'spring',
        stiffness: 400,
        damping: 30,
        delay: isVisible ? delay : 0,
      }}
    >
      <div className="relative">
        {/* Step number badge */}
        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white shadow-lg border-2 border-gray-100 flex items-center justify-center">
          <span className="text-sm sm:text-base font-bold text-gray-700">
            {step.order}
          </span>
        </div>

        {/* Step title tooltip */}
        <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 whitespace-nowrap">
          <span className="text-[10px] sm:text-xs text-gray-500 bg-white/90 px-1.5 py-0.5 rounded shadow-sm max-w-[80px] sm:max-w-[100px] truncate block">
            {step.title}
          </span>
        </div>
      </div>
    </motion.div>
  );
}
