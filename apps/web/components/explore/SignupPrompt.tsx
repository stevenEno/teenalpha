'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, Zap, Check, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import type { ExplorePathSummary } from '@teen-alpha/database';
import { ONBOARDING_ALPHA } from '@/lib/incentives';

interface SignupPromptProps {
  isOpen: boolean;
  onClose: () => void;
  selectedPath: ExplorePathSummary | null;
  interest: string | null;
}

export function SignupPrompt({ isOpen, onClose, selectedPath, interest }: SignupPromptProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            className="fixed inset-0 flex items-center justify-center z-50 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl"
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close button */}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center transition-colors z-10"
              >
                <X className="w-4 h-4 text-gray-500" />
              </button>

              {/* Header with gradient */}
              <div className="bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 p-8 text-center relative overflow-hidden">
                {/* Decorative elements */}
                <div className="absolute inset-0 opacity-20">
                  {[...Array(8)].map((_, i) => (
                    <motion.div
                      key={i}
                      className="absolute w-24 h-24 border border-white/30 rounded-full"
                      style={{
                        left: `${Math.random() * 100}%`,
                        top: `${Math.random() * 100}%`,
                      }}
                      animate={{
                        scale: [1, 1.2, 1],
                        opacity: [0.2, 0.4, 0.2],
                      }}
                      transition={{
                        duration: 3 + Math.random() * 2,
                        repeat: Infinity,
                        delay: Math.random(),
                      }}
                    />
                  ))}
                </div>

                <motion.div
                  className="relative"
                  initial={{ y: 10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.1 }}
                >
                  <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Sparkles className="w-8 h-8 text-white" />
                  </div>
                  <h2 className="text-2xl font-bold text-white mb-2">
                    Unlock Your Path!
                  </h2>
                  <p className="text-white/80">
                    Create a free account to start your journey
                  </p>
                </motion.div>
              </div>

              {/* Content */}
              <div className="p-6">
                {/* Selected path preview */}
                {selectedPath && (
                  <motion.div
                    className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl mb-6"
                    initial={{ x: -10, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                  >
                    <div className="w-12 h-12 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-xl flex items-center justify-center text-2xl">
                      {selectedPath.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900">{selectedPath.name}</p>
                      <p className="text-sm text-gray-500 truncate">{selectedPath.tagline}</p>
                    </div>
                  </motion.div>
                )}

                {/* Benefits list */}
                <motion.div
                  className="space-y-3 mb-6"
                  initial={{ y: 10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  {[
                    { icon: Check, text: 'Your personalized project board' },
                    { icon: Check, text: 'Step-by-step guidance to first dollar' },
                    { icon: Zap, text: `+${ONBOARDING_ALPHA} Alpha bonus reward`, highlight: true },
                  ].map((item, index) => (
                    <div
                      key={index}
                      className={`flex items-center gap-3 ${
                        item.highlight ? 'bg-yellow-50 border border-yellow-200 rounded-lg p-3' : ''
                      }`}
                    >
                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center ${
                          item.highlight
                            ? 'bg-yellow-400 text-yellow-900'
                            : 'bg-green-100 text-green-600'
                        }`}
                      >
                        <item.icon className="w-4 h-4" />
                      </div>
                      <span className={item.highlight ? 'font-semibold text-yellow-900' : 'text-gray-700'}>
                        {item.text}
                      </span>
                    </div>
                  ))}
                </motion.div>

                {/* CTA Buttons */}
                <motion.div
                  className="space-y-3"
                  initial={{ y: 10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.4 }}
                >
                  <Link
                    href="/m/signup"
                    className="flex items-center justify-center gap-2 w-full bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-semibold py-3.5 px-6 rounded-xl hover:shadow-lg transition-shadow"
                  >
                    Create Free Account
                    <ArrowRight className="w-4 h-4" />
                  </Link>

                  <Link
                    href="/m/login"
                    className="flex items-center justify-center w-full bg-gray-100 text-gray-700 font-medium py-3 px-6 rounded-xl hover:bg-gray-200 transition-colors"
                  >
                    I already have an account
                  </Link>
                </motion.div>

                {/* Fine print */}
                <p className="text-center text-xs text-gray-400 mt-4">
                  Free forever. No credit card required.
                </p>
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
