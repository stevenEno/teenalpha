'use client';

import { useEffect, useState } from 'react';
import { DollarSign, Trophy } from 'lucide-react';

interface TrackerProps {
  userId: string;
}

export function FirstDollarTracker({ userId }: TrackerProps) {
  const [earned, setEarned] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/profile/social-data')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.profile?.first_dollar_earned_at) setEarned(true);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [userId]);

  if (loading) return null;

  if (earned) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center">
          <Trophy className="w-5 h-5 text-white" />
        </div>
        <div>
          <p className="text-sm font-bold text-green-900">First dollar earned</p>
          <p className="text-xs text-green-700">You did what most adults never do — you made money from something you built.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200 rounded-xl p-4">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-full bg-[#FF6B35] flex items-center justify-center">
          <DollarSign className="w-5 h-5 text-white" />
        </div>
        <div>
          <p className="text-sm font-bold text-gray-900">First Dollar Goal</p>
          <p className="text-xs text-gray-600">Complete a project, sell it, earn your first real dollar.</p>
        </div>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
        <div className="bg-[#FF6B35] h-2 rounded-full" style={{ width: '0%' }} />
      </div>
      <p className="text-[10px] text-gray-500 mt-1 text-right">$0 / $1</p>
    </div>
  );
}
