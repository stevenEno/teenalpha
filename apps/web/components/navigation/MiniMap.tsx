'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { Map, X, ChevronRight, Sparkles, DollarSign, CheckCircle } from 'lucide-react';
import type { ExplorePath, ExploreStep } from '@teen-alpha/database';

interface MiniMapProps {
  isVisible: boolean;
  onClose: () => void;
  interest: string | null;
  selectedPath: ExplorePath | null;
  completedSteps?: number[];
}

export function MiniMap({
  isVisible,
  onClose,
  interest,
  selectedPath,
  completedSteps = [],
}: MiniMapProps) {
  const router = useRouter();

  if (!interest || !selectedPath) {
    return null;
  }

  const totalSteps = selectedPath.steps?.length || 0;
  const completedCount = completedSteps.length;
  const progress = totalSteps > 0 ? (completedCount / totalSteps) * 100 : 0;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className="fixed bottom-4 right-4 z-40 w-80 max-w-[calc(100vw-2rem)]"
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        >
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
            {/* Header */}
            <div className="bg-[#FF6B35] p-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                  <Map className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="text-white text-xs font-medium opacity-80">Your Path</p>
                  <p className="text-white font-semibold text-sm truncate max-w-[180px]">
                    {selectedPath.icon} {selectedPath.name}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center text-white hover:bg-white/30 transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            </div>

            {/* Progress bar */}
            <div className="px-3 py-2 bg-gray-50 border-b border-gray-100">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-gray-600">Progress</span>
                <span className="text-[#FF6B35] font-medium">
                  {completedCount}/{totalSteps} steps
                </span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-[#FF6B35] rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.5, ease: 'easeOut' }}
                />
              </div>
            </div>

            {/* Steps list */}
            <div className="p-2 max-h-48 overflow-y-auto">
              {selectedPath.steps?.map((step, index) => {
                const isCompleted = completedSteps.includes(index);
                const isNext = !isCompleted && completedSteps.length === index;

                return (
                  <div
                    key={step.order}
                    className={`flex items-center gap-2 p-2 rounded-lg mb-1 last:mb-0 ${
                      isCompleted
                        ? 'bg-green-50'
                        : isNext
                        ? 'bg-[#FF6B35]/5 border border-[#FF6B35]/30'
                        : 'bg-gray-50'
                    }`}
                  >
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                        isCompleted
                          ? 'bg-green-500 text-white'
                          : isNext
                          ? 'bg-[#FF6B35]/50 text-white'
                          : 'bg-gray-200 text-gray-500'
                      }`}
                    >
                      {isCompleted ? (
                        <CheckCircle className="w-4 h-4" />
                      ) : (
                        <span className="text-xs font-bold">{step.order}</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p
                        className={`text-xs font-medium truncate ${
                          isCompleted
                            ? 'text-green-700 line-through'
                            : isNext
                            ? 'text-[#FF6B35]'
                            : 'text-gray-600'
                        }`}
                      >
                        {step.title}
                      </p>
                    </div>
                    {isNext && (
                      <ChevronRight className="w-4 h-4 text-[#FF6B35]/60 flex-shrink-0" />
                    )}
                  </div>
                );
              })}
            </div>

            {/* Footer with goal */}
            <div className="px-3 py-2 bg-yellow-50 border-t border-yellow-100">
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-yellow-600" />
                <p className="text-xs text-yellow-800 font-medium truncate">
                  {selectedPath.moneyPath}
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Toggle button component for the header
interface MiniMapToggleProps {
  isVisible: boolean;
  onToggle: () => void;
  hasPath: boolean;
}

export function MiniMapToggle({ isVisible, onToggle, hasPath }: MiniMapToggleProps) {
  if (!hasPath) return null;

  return (
    <button
      onClick={onToggle}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
        isVisible
          ? 'bg-[#FF6B35]/10 text-[#FF6B35]'
          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
      }`}
    >
      <Map className="w-4 h-4" />
      <span className="hidden sm:inline">Path Map</span>
    </button>
  );
}
