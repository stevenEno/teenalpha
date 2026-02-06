'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, X, Sparkles } from 'lucide-react';
import { ONBOARDING_ALPHA } from '@/lib/incentives';

interface OnboardingAlphaToastProps {
  onboardingInterest: string | null;
  alphaAwarded: boolean;
}

export function OnboardingAlphaToast({ onboardingInterest, alphaAwarded }: OnboardingAlphaToastProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [hasBeenShown, setHasBeenShown] = useState(false);

  useEffect(() => {
    // Only show if user came from explore flow (has interest) and Alpha was awarded
    // Also check if we haven't already shown this toast this session
    if (onboardingInterest && alphaAwarded && !hasBeenShown) {
      // Check if we've shown this toast before (using sessionStorage)
      const shownKey = 'ta_onboarding_toast_shown';
      if (typeof window !== 'undefined' && !sessionStorage.getItem(shownKey)) {
        setIsVisible(true);
        sessionStorage.setItem(shownKey, 'true');
        setHasBeenShown(true);

        // Auto-hide after 6 seconds
        const timer = setTimeout(() => {
          setIsVisible(false);
        }, 6000);

        return () => clearTimeout(timer);
      }
    }
  }, [onboardingInterest, alphaAwarded, hasBeenShown]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className="fixed top-4 right-4 z-50 max-w-sm"
          initial={{ opacity: 0, y: -20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        >
          <div className="bg-gradient-to-r from-yellow-400 to-amber-500 rounded-2xl p-4 shadow-xl">
            <button
              onClick={() => setIsVisible(false)}
              className="absolute top-2 right-2 w-6 h-6 bg-white/20 rounded-full flex items-center justify-center text-white hover:bg-white/30 transition-colors"
            >
              <X className="w-3 h-3" />
            </button>

            <div className="flex items-start gap-3">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-white font-bold text-lg">+{ONBOARDING_ALPHA} Alpha!</span>
                  <Sparkles className="w-4 h-4 text-white/80" />
                </div>
                <p className="text-white/90 text-sm">
                  Welcome bonus for starting your "{onboardingInterest}" journey!
                </p>
              </div>
            </div>

            {/* Animated sparkles */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-2xl">
              {[...Array(5)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-1 h-1 bg-white rounded-full"
                  initial={{
                    x: Math.random() * 300,
                    y: Math.random() * 100,
                    opacity: 0,
                  }}
                  animate={{
                    y: [null, -20],
                    opacity: [0, 1, 0],
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    delay: i * 0.3,
                  }}
                />
              ))}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
