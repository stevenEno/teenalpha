'use client';

import { useState, useEffect } from 'react';
import { LadderView } from '@/components/incentives/LadderView';
import { LadderJoinForm } from '@/components/incentives/LadderJoinForm';

export default function LaddersPage() {
  const [ladderId, setLadderId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user has an active ladder
    async function checkLadder() {
      try {
        const res = await fetch('/api/incentive/assign');
        const data = await res.json();
        if (!data.assignment || data.assignment.system !== 'ladder') {
          window.location.href = '/dashboard/incentives';
          return;
        }
        // The ladder ID isn't stored in assignment — we need to find the user's active ladder
        // For now, we check ladder_members. The LadderView component handles its own data.
        // We'll store the ladder ID when joining and pass it to the view.
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    }
    checkLadder();
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
      {ladderId ? (
        <LadderView ladderId={ladderId} />
      ) : (
        <LadderJoinForm onJoined={(id) => setLadderId(id)} />
      )}
    </main>
  );
}
