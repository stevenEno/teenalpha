'use client';

import { useEffect, useState } from 'react';
import { Flame } from 'lucide-react';

interface StreakBadgeProps {
  userId: string;
  compact?: boolean;
}

export function StreakBadge({ userId, compact }: StreakBadgeProps) {
  const [streak, setStreak] = useState<{ current: number; longest: number } | null>(null);

  useEffect(() => {
    fetch(`/api/streaks?user_id=${userId}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d) setStreak({ current: d.current, longest: d.longest });
      })
      .catch(() => {});
  }, [userId]);

  if (!streak || streak.current === 0) return null;

  const fire = streak.current >= 30
    ? 'text-orange-500'
    : streak.current >= 14
    ? 'text-amber-500'
    : streak.current >= 7
    ? 'text-yellow-500'
    : 'text-gray-400';

  if (compact) {
    return (
      <span className={`inline-flex items-center gap-1 text-sm font-bold ${fire}`}>
        <Flame className="w-4 h-4" />
        {streak.current}
      </span>
    );
  }

  return (
    <div className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 bg-gray-50 border border-gray-200 ${fire}`}>
      <Flame className="w-4 h-4" />
      <span className="text-sm font-bold">{streak.current} day streak</span>
    </div>
  );
}
