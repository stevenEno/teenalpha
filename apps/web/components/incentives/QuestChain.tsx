'use client';

import { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { QuestCard } from './QuestCard';
import { StreakFlame } from './StreakFlame';
import { AlphaBar } from './AlphaBar';
import { RewardModal } from './RewardModal';
import type { Quest, UserQuestProgress } from '@teen-alpha/database';
import { convertToAlpha, getAlphaRank, calculateAlphaLevel } from '@/lib/incentives';
import { showAlphaEarned } from '@/lib/alpha-toast';
import { useAlpha } from '@/hooks/useAlpha';

export function QuestChain() {
  const [quests, setQuests] = useState<Quest[]>([]);
  const [progress, setProgress] = useState<UserQuestProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rewardModal, setRewardModal] = useState<{
    open: boolean;
    alpha: number;
    levelUp?: { newLevel: number; newRank: string };
  }>({ open: false, alpha: 0 });
  const { refetch: refetchAlpha } = useAlpha();

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

    const result = await response.json();
    const alphaEarned = convertToAlpha('quest', result.pointsEarned || 10);
    showAlphaEarned(alphaEarned, 'Quest');

    // Check for chain completion
    const prevCompleted = quests.filter((q) => q.status === 'completed').length;
    await fetchQuests();
    await refetchAlpha();

    const newCompleted = quests.filter((q) => q.status === 'completed').length + 1;
    if (newCompleted === quests.length && quests.length > 0) {
      const totalAlpha = convertToAlpha('quest', progress?.total_points ?? 0);
      const { level } = calculateAlphaLevel(totalAlpha);
      setRewardModal({
        open: true,
        alpha: alphaEarned,
        levelUp: prevCompleted === 0 ? { newLevel: level, newRank: getAlphaRank(level) } : undefined,
      });
    }
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
  const totalAlpha = convertToAlpha('quest', progress?.total_points ?? 0);

  return (
    <div className="space-y-6">
      <RewardModal
        open={rewardModal.open}
        onClose={() => setRewardModal({ ...rewardModal, open: false })}
        alphaEarned={rewardModal.alpha}
        levelUp={rewardModal.levelUp}
        message="Quest chain completed!"
      />

      {/* Header with stats */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">Today&apos;s Quest Chain</h2>
          <p className="text-sm text-gray-500">
            {completedCount}/{quests.length} completed
          </p>
        </div>
        <div className="flex items-center gap-3">
          <StreakFlame streak={progress?.current_streak || 0} />
          <div className="text-right">
            <p className="text-sm font-semibold">{totalAlpha} Alpha</p>
            <p className="text-xs text-gray-500">Level {progress?.level || 1}</p>
          </div>
        </div>
      </div>

      {/* Alpha progress bar */}
      <AlphaBar compact />

      {/* Quest chain */}
      <div className="space-y-3">
        <AnimatePresence>
          {quests.map((quest, index) => (
            <motion.div
              key={quest.id}
              className="relative"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.08 }}
            >
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
            </motion.div>
          ))}
        </AnimatePresence>
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
