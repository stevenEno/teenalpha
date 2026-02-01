'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { RewardModal } from '@/components/incentives/RewardModal';
import { convertToAlpha } from '@/lib/incentives';

interface CompletionCelebrationProps {
  projectTitle: string;
  totalTasks: number;
}

export function CompletionCelebration({
  projectTitle,
  totalTasks,
}: CompletionCelebrationProps) {
  const [showReward, setShowReward] = useState(true);
  const alphaEarned = convertToAlpha('quest', totalTasks * 10);

  return (
    <>
      <RewardModal
        open={showReward}
        onClose={() => setShowReward(false)}
        alphaEarned={alphaEarned}
        message={`Completed "${projectTitle}" with all ${totalTasks} tasks!`}
      />

      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-2xl p-8 max-w-md w-full text-center animate-in zoom-in duration-300">
          <div className="text-6xl mb-4">🎉</div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Congratulations!
          </h2>
          <p className="text-lg text-gray-700 mb-2">
            You&apos;ve completed <strong>{projectTitle}</strong> with all {totalTasks}{' '}
            tasks done!
          </p>
          <p className="text-sm font-semibold mb-6" style={{ color: 'var(--alpha-primary)' }}>
            +{alphaEarned} Alpha earned
          </p>
          <div className="space-y-3">
            <Link href="/projects">
              <Button className="w-full" size="lg">
                View All Projects
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
