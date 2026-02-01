'use client';

import { useState, useEffect } from 'react';
import { AmbitionView } from '@/components/incentives/AmbitionView';
import { GoalSetForm } from '@/components/incentives/GoalSetForm';

export default function TrackerPage() {
  const [hasGoal, setHasGoal] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function check() {
      try {
        // Check assignment
        const assignRes = await fetch('/api/incentive/assign');
        const assignData = await assignRes.json();
        if (!assignData.assignment || assignData.assignment.system !== 'tracker') {
          window.location.href = '/dashboard/incentives';
          return;
        }

        // Check for active goal
        const goalRes = await fetch('/api/ambition/today');
        const goalData = await goalRes.json();
        setHasGoal(!!goalData.goal);
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    }
    check();
  }, []);

  if (loading) {
    return (
      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="h-40 bg-gray-100 rounded-xl animate-pulse" />
      </main>
    );
  }

  return (
    <main className="container mx-auto px-4 py-8 max-w-2xl">
      {hasGoal ? (
        <AmbitionView />
      ) : (
        <GoalSetForm onGoalSet={() => setHasGoal(true)} />
      )}
    </main>
  );
}
