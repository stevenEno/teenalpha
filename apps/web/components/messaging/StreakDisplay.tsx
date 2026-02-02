'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { CHAT_STREAK_MILESTONES } from '@/lib/incentives';
import type { ChatStreak } from '@teen-alpha/database';

interface StreakDisplayProps {
  streak: ChatStreak | null;
  compact?: boolean;
}

function getFlameColor(count: number): string {
  if (count >= 30) return '#9333ea';
  if (count >= 14) return '#dc2626';
  if (count >= 7) return '#f97316';
  if (count >= 3) return '#3b82f6';
  if (count >= 1) return '#facc15';
  return '#9ca3af';
}

function getNextMilestone(count: number): { days: number; bonus: number } | null {
  const milestones = Object.entries(CHAT_STREAK_MILESTONES)
    .map(([days, bonus]) => ({ days: Number(days), bonus }))
    .sort((a, b) => a.days - b.days);

  for (const m of milestones) {
    if (count < m.days) return m;
  }
  return null;
}

export function StreakDisplay({ streak, compact = false }: StreakDisplayProps) {
  const count = streak?.streak_count ?? 0;
  const longest = streak?.longest_streak ?? 0;
  const color = getFlameColor(count);
  const next = getNextMilestone(count);

  if (compact) {
    return (
      <div className="flex items-center gap-1">
        <div className={count > 0 ? 'animate-flame' : ''} style={{ transformOrigin: 'bottom center' }}>
          <svg width={16} height={16} viewBox="0 0 24 24" fill="none">
            <path
              d="M12 2C12 2 5 9 5 14a7 7 0 0 0 14 0C19 9 12 2 12 2z"
              fill={color}
              opacity={count === 0 ? 0.3 : 1}
            />
            {count >= 7 && (
              <path
                d="M12 10c0 0-3 3-3 5.5a3 3 0 0 0 6 0c0-2.5-3-5.5-3-5.5z"
                fill={count >= 14 ? '#fbbf24' : '#fb923c'}
              />
            )}
          </svg>
        </div>
        <AnimatePresence mode="wait">
          <motion.span
            key={count}
            className="font-bold text-xs tabular-nums"
            style={{ color }}
            initial={{ y: -6, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 6, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {count}
          </motion.span>
        </AnimatePresence>
      </div>
    );
  }

  return (
    <motion.div
      className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-100"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: 'spring', stiffness: 200, damping: 20 }}
    >
      {/* Flame icon */}
      <div className={count > 0 ? 'animate-flame' : ''} style={{ transformOrigin: 'bottom center' }}>
        <svg width={32} height={32} viewBox="0 0 24 24" fill="none">
          <path
            d="M12 2C12 2 5 9 5 14a7 7 0 0 0 14 0C19 9 12 2 12 2z"
            fill={color}
            opacity={count === 0 ? 0.3 : 1}
          />
          {count >= 7 && (
            <path
              d="M12 10c0 0-3 3-3 5.5a3 3 0 0 0 6 0c0-2.5-3-5.5-3-5.5z"
              fill={count >= 14 ? '#fbbf24' : '#fb923c'}
            />
          )}
        </svg>
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2">
          <AnimatePresence mode="wait">
            <motion.span
              key={count}
              className="text-lg font-bold tabular-nums"
              style={{ color }}
              initial={{ y: -8, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 8, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              {count} day{count !== 1 ? 's' : ''}
            </motion.span>
          </AnimatePresence>
          {longest > count && (
            <span className="text-xs text-gray-400">Best: {longest}</span>
          )}
        </div>

        {/* Next milestone progress */}
        {next && count > 0 && (
          <div className="mt-1">
            <div className="flex justify-between text-[10px] text-gray-500 mb-0.5">
              <span>{next.days}-day bonus</span>
              <span>+{next.bonus} Alpha</span>
            </div>
            <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                style={{ background: color }}
                initial={{ width: 0 }}
                animate={{ width: `${Math.min((count / next.days) * 100, 100)}%` }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
              />
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
