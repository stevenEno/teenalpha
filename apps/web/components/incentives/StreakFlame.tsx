'use client';

import { AnimatePresence, motion } from 'framer-motion';

interface StreakFlameProps {
  streak: number;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

function getFlameColor(streak: number): string {
  if (streak >= 14) return '#9333ea'; // purple/gold
  if (streak >= 7) return '#dc2626';  // red
  if (streak >= 3) return '#f97316';  // orange
  if (streak >= 1) return '#3b82f6';  // blue
  return '#9ca3af';                    // gray
}

const sizeMap = { sm: 16, md: 24, lg: 32 };

export function StreakFlame({ streak, size = 'md', showLabel = true }: StreakFlameProps) {
  const px = sizeMap[size];
  const color = getFlameColor(streak);

  return (
    <div className="flex items-center gap-1">
      <div className={streak > 0 ? 'animate-flame' : ''} style={{ transformOrigin: 'bottom center' }}>
        <svg
          width={px}
          height={px}
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M12 2C12 2 5 9 5 14a7 7 0 0 0 14 0C19 9 12 2 12 2z"
            fill={color}
            opacity={streak === 0 ? 0.3 : 1}
          />
          {streak >= 7 && (
            <path
              d="M12 10c0 0-3 3-3 5.5a3 3 0 0 0 6 0c0-2.5-3-5.5-3-5.5z"
              fill={streak >= 14 ? '#fbbf24' : '#fb923c'}
            />
          )}
        </svg>
      </div>
      {showLabel && (
        <AnimatePresence mode="wait">
          <motion.span
            key={streak}
            className="font-bold text-sm tabular-nums"
            style={{ color }}
            initial={{ y: -8, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 8, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {streak}
          </motion.span>
        </AnimatePresence>
      )}
    </div>
  );
}
