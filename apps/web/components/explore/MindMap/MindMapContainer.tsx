'use client';

import { motion } from 'framer-motion';
import { ReactFlowProvider } from '@xyflow/react';
import type { ExplorePathSummary } from '@teen-alpha/database';
import { Sparkles } from 'lucide-react';
import { FlowMindMap } from './FlowMindMap';

interface MindMapContainerProps {
  interest: string;
  paths: ExplorePathSummary[];
  selectedPathIndex: number | null;
  onSelectPath: (index: number) => void;
  isGenerating?: boolean;
}

export function MindMapContainer({
  interest,
  paths,
  selectedPathIndex,
  onSelectPath,
  isGenerating = false,
}: MindMapContainerProps) {
  if (paths.length === 0) {
    return (
      <div
        className="relative w-full bg-gradient-to-br from-slate-50 to-indigo-50 rounded-2xl overflow-hidden"
        style={{ height: 500 }}
      >
        <div className="absolute inset-0 flex items-center justify-center">
          {isGenerating ? (
            <motion.div
              className="flex flex-col items-center gap-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <motion.div
                className="relative"
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-full blur-xl opacity-50 scale-125" />
                <div className="relative w-32 h-32 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex flex-col items-center justify-center shadow-2xl border-4 border-white">
                  <Sparkles className="w-6 h-6 text-white/80 mb-1" />
                  <span className="text-white font-bold text-sm text-center px-3 leading-tight">
                    {interest.length > 20 ? interest.slice(0, 20) + '...' : interest}
                  </span>
                </div>
              </motion.div>
              <motion.p
                className="text-gray-600 font-medium"
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                Discovering your paths...
              </motion.p>
            </motion.div>
          ) : (
            <p className="text-gray-500">Enter your interest to generate paths</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full bg-gradient-to-br from-slate-50 to-indigo-50 rounded-2xl relative" style={{ height: '70vh', minHeight: 500 }}>
      {/* Dot pattern background */}
      <div className="absolute inset-0 opacity-30 rounded-2xl overflow-hidden pointer-events-none z-0">
        <div
          className="w-full h-full"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, rgba(99, 102, 241, 0.15) 1px, transparent 0)`,
            backgroundSize: '24px 24px',
          }}
        />
      </div>

      <ReactFlowProvider>
        <FlowMindMap
          interest={interest}
          paths={paths}
          selectedPathIndex={selectedPathIndex}
          onSelectPath={onSelectPath}
        />
      </ReactFlowProvider>
    </div>
  );
}
