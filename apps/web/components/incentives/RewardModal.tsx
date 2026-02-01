'use client';

import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Zap } from 'lucide-react';

interface RewardModalProps {
  open: boolean;
  onClose: () => void;
  alphaEarned: number;
  levelUp?: { newLevel: number; newRank: string };
  streakMilestone?: number;
  message?: string;
}

export function RewardModal({
  open,
  onClose,
  alphaEarned,
  levelUp,
  streakMilestone,
  message,
}: RewardModalProps) {
  const timerRef = useRef<ReturnType<typeof setTimeout>>(null);

  useEffect(() => {
    if (open) {
      // Fire confetti
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#9333ea', '#fbbf24', '#3b82f6', '#f97316'],
      });

      // Auto-close after 5s
      timerRef.current = setTimeout(onClose, 5000);
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [open, onClose]);

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <AnimatePresence>
          {open && (
            <motion.div
              className="flex flex-col items-center text-center py-4"
              initial={{ scale: 0.8, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 200, damping: 20 }}
            >
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center mb-4 animate-alpha-pulse"
                style={{ background: 'linear-gradient(135deg, var(--alpha-primary), var(--alpha-secondary))' }}
              >
                <Zap className="w-8 h-8 text-white" />
              </div>

              <motion.div
                className="text-3xl font-bold mb-1"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: 'spring', stiffness: 300 }}
              >
                +{alphaEarned} Alpha
              </motion.div>

              {message && (
                <p className="text-muted-foreground text-sm mb-3">{message}</p>
              )}

              {levelUp && (
                <motion.div
                  className="rounded-lg px-4 py-2 mb-2 text-sm font-semibold text-white"
                  style={{ background: 'var(--alpha-primary)' }}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.4, type: 'spring' }}
                >
                  Level Up! Level {levelUp.newLevel} — {levelUp.newRank}
                </motion.div>
              )}

              {streakMilestone && (
                <motion.div
                  className="text-sm font-medium"
                  style={{ color: 'var(--alpha-streak)' }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6 }}
                >
                  {streakMilestone}-day streak!
                </motion.div>
              )}

              {/* Auto-close progress indicator */}
              <motion.div
                className="w-full h-1 rounded-full mt-4 overflow-hidden bg-gray-200"
              >
                <motion.div
                  className="h-full rounded-full"
                  style={{ background: 'var(--alpha-primary)' }}
                  initial={{ width: '100%' }}
                  animate={{ width: '0%' }}
                  transition={{ duration: 5, ease: 'linear' }}
                />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}
