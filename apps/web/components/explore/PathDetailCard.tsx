'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, DollarSign, Clock, Wrench, Lightbulb, ArrowRight, Loader2 } from 'lucide-react';
import type { ExplorePathSummary, ExploreStep } from '@teen-alpha/database';

interface PathDetailCardProps {
  path: ExplorePathSummary | null;
  isOpen: boolean;
  isLoadingDetails: boolean;
  onClose: () => void;
  onSelect: () => void;
  pathIndex: number;
}

// Colors matching PathNode colors
const pathColors = [
  { gradient: 'from-emerald-500 to-teal-600', accent: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200' },
  { gradient: 'from-amber-500 to-orange-600', accent: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200' },
  { gradient: 'from-pink-500 to-rose-600', accent: 'text-pink-600', bg: 'bg-pink-50', border: 'border-pink-200' },
  { gradient: 'from-cyan-500 to-blue-600', accent: 'text-cyan-600', bg: 'bg-cyan-50', border: 'border-cyan-200' },
  { gradient: 'from-violet-500 to-purple-600', accent: 'text-violet-600', bg: 'bg-violet-50', border: 'border-violet-200' },
];

// Loading skeleton for steps
function StepsSkeleton({ colors }: { colors: typeof pathColors[0] }) {
  return (
    <div className="space-y-3">
      {[1, 2, 3, 4, 5].map((i) => (
        <div
          key={i}
          className={`flex gap-3 p-3 ${colors.bg} ${colors.border} border rounded-xl animate-pulse`}
        >
          <div className={`w-7 h-7 rounded-full bg-white/50 flex-shrink-0`} />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-white/50 rounded w-3/4" />
            <div className="h-3 bg-white/30 rounded w-full" />
            <div className="h-3 bg-white/20 rounded w-1/4" />
          </div>
        </div>
      ))}
    </div>
  );
}

// Loading skeleton for skills/tools
function TagsSkeleton() {
  return (
    <div className="flex flex-wrap gap-1">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="h-5 w-16 bg-gray-200 rounded-full animate-pulse"
        />
      ))}
    </div>
  );
}

export function PathDetailCard({ path, isOpen, isLoadingDetails, onClose, onSelect, pathIndex }: PathDetailCardProps) {
  const colors = pathColors[pathIndex % pathColors.length];
  const hasDetails = path?.steps && path.steps.length > 0;

  return (
    <AnimatePresence>
      {isOpen && path && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 bg-black/50 z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Card - slides up on mobile, centered modal on desktop */}
          <motion.div
            className="fixed inset-x-0 bottom-0 sm:inset-0 sm:flex sm:items-center sm:justify-center z-50 p-0 sm:p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-white rounded-t-3xl sm:rounded-2xl w-full sm:max-w-lg max-h-[85vh] overflow-hidden shadow-2xl"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            >
              {/* Header */}
              <div className={`bg-gradient-to-r ${colors.gradient} p-6 relative`}>
                <button
                  onClick={onClose}
                  className="absolute top-4 right-4 w-8 h-8 bg-white/20 rounded-full flex items-center justify-center text-white hover:bg-white/30 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>

                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center text-3xl">
                    {path.icon}
                  </div>
                  <div className="flex-1">
                    <h2 className="text-xl font-bold text-white mb-1">{path.name}</h2>
                    <p className="text-white/80 text-sm">{path.tagline}</p>
                  </div>
                </div>

                {/* Money path badge */}
                <div className="mt-4 flex items-center gap-2 bg-white/20 rounded-full px-4 py-2 w-fit">
                  <DollarSign className="w-4 h-4 text-yellow-300" />
                  <span className="text-white text-sm font-medium">{path.moneyPath}</span>
                </div>
              </div>

              {/* Content */}
              <div className="p-6 overflow-y-auto max-h-[50vh]">
                {/* Connection */}
                <div className="mb-6">
                  <p className="text-gray-600">{path.connection}</p>
                </div>

                {/* Steps */}
                <div className="mb-6">
                  <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <span className={`w-6 h-6 rounded-full ${colors.bg} ${colors.accent} flex items-center justify-center text-xs font-bold`}>
                      5
                    </span>
                    Steps to Your First Dollar
                    {isLoadingDetails && (
                      <Loader2 className="w-4 h-4 animate-spin text-gray-400 ml-2" />
                    )}
                  </h3>

                  {isLoadingDetails || !hasDetails ? (
                    <StepsSkeleton colors={colors} />
                  ) : (
                    <div className="space-y-3">
                      {path.steps!.map((step) => (
                        <motion.div
                          key={step.order}
                          className={`flex gap-3 p-3 ${colors.bg} ${colors.border} border rounded-xl`}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: step.order * 0.05 }}
                        >
                          <div className={`w-7 h-7 rounded-full bg-white ${colors.accent} flex items-center justify-center text-sm font-bold flex-shrink-0`}>
                            {step.order}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-900 text-sm">{step.title}</p>
                            <p className="text-gray-600 text-xs mt-0.5 line-clamp-2">{step.description}</p>
                            <div className="flex items-center gap-1 mt-1 text-gray-400">
                              <Clock className="w-3 h-3" />
                              <span className="text-xs">{step.timeEstimate}</span>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Skills & Tools */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1">
                      <Lightbulb className="w-3 h-3" />
                      Skills You'll Build
                    </h4>
                    {isLoadingDetails || !path.skills ? (
                      <TagsSkeleton />
                    ) : (
                      <div className="flex flex-wrap gap-1">
                        {path.skills.map((skill) => (
                          <motion.span
                            key={skill}
                            className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full text-xs"
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                          >
                            {skill}
                          </motion.span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1">
                      <Wrench className="w-3 h-3" />
                      Free Tools
                    </h4>
                    {isLoadingDetails || !path.tools ? (
                      <TagsSkeleton />
                    ) : (
                      <div className="flex flex-wrap gap-1">
                        {path.tools.map((tool) => (
                          <motion.span
                            key={tool}
                            className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full text-xs"
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                          >
                            {tool}
                          </motion.span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Footer CTA */}
              <div className="p-4 border-t border-gray-100 bg-gray-50">
                <button
                  onClick={onSelect}
                  disabled={isLoadingDetails}
                  className={`w-full bg-gradient-to-r ${colors.gradient} text-white font-semibold py-3 px-6 rounded-xl flex items-center justify-center gap-2 hover:shadow-lg transition-shadow disabled:opacity-70 disabled:cursor-not-allowed`}
                >
                  {isLoadingDetails ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Loading details...
                    </>
                  ) : (
                    <>
                      Choose This Path
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
