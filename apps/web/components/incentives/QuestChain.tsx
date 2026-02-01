'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { QuestCard } from './QuestCard';
import { StreakBadge } from './StreakBadge';
import type { Quest, UserQuestProgress } from '@teen-alpha/database';

export function QuestChain() {
  const [quests, setQuests] = useState<Quest[]>([]);
  const [progress, setProgress] = useState<UserQuestProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchQuests = async () => {
    try {
      const response = await fetch('/api/quests/today');
      if (!response.ok) throw new Error('Failed to fetch quests');
      const data = await response.json();
      setQuests(data.quests || []);
      setProgress(data.progress || null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuests();
  }, []);

  const handleComplete = async (questId: string, proof: string, discomfort: number) => {
    const response = await fetch('/api/quests/complete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ questId, proof, discomfort }),
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || 'Failed to complete quest');
    }

    // Refresh quests and progress
    await fetchQuests();
  };

  // Find the first non-completed quest as the active one
  const activeIndex = quests.findIndex((q) => q.status !== 'completed' && q.status !== 'skipped');

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-16 bg-gray-100 rounded-xl animate-pulse" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-20 bg-gray-100 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Card className="p-6 border-red-200 bg-red-50">
        <p className="text-red-700">Failed to load quests: {error}</p>
      </Card>
    );
  }

  const completedCount = quests.filter((q) => q.status === 'completed').length;
  const pointsToNext = progress ? 100 - (progress.total_points % 100) : 100;

  return (
    <div className="space-y-6">
      {/* Header with stats */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">Today&apos;s Quest Chain</h2>
          <p className="text-sm text-gray-500">
            {completedCount}/{quests.length} completed
          </p>
        </div>
        <div className="flex items-center gap-3">
          <StreakBadge streak={progress?.current_streak || 0} />
          <div className="text-right">
            <p className="text-sm font-semibold">Level {progress?.level || 1}</p>
            <p className="text-xs text-gray-500">{progress?.total_points || 0} pts</p>
          </div>
        </div>
      </div>

      {/* Level progress bar */}
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className="bg-indigo-500 h-2 rounded-full transition-all"
          style={{ width: `${((100 - pointsToNext) / 100) * 100}%` }}
        />
      </div>
      <p className="text-xs text-gray-400 -mt-4">{pointsToNext} pts to next level</p>

      {/* Quest chain */}
      <div className="space-y-3">
        {quests.map((quest, index) => (
          <div key={quest.id} className="relative">
            {/* Connector line */}
            {index < quests.length - 1 && (
              <div
                className={`absolute left-[19px] top-[40px] w-0.5 h-6 ${
                  quest.status === 'completed' ? 'bg-green-300' : 'bg-gray-200'
                }`}
              />
            )}
            <QuestCard
              quest={quest}
              isActive={index === activeIndex}
              onComplete={handleComplete}
            />
          </div>
        ))}
      </div>

      {completedCount === quests.length && quests.length > 0 && (
        <Card className="p-6 bg-gradient-to-r from-green-50 to-emerald-50 border-green-200 text-center">
          <p className="text-lg font-bold text-green-800">All quests completed!</p>
          <p className="text-sm text-green-600">Come back tomorrow for a new chain.</p>
        </Card>
      )}
    </div>
  );
}
