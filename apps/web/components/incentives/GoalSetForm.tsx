'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import type { AmbitionGoal, DailyTrack } from '@teen-alpha/database';

interface GoalSetFormProps {
  onGoalSet: (goal: AmbitionGoal, tracks: DailyTrack[]) => void;
}

export function GoalSetForm({ onGoalSet }: GoalSetFormProps) {
  const [goal, setGoal] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<{ goal: AmbitionGoal; tracks: DailyTrack[] } | null>(null);

  const handleGenerate = async () => {
    if (!goal.trim()) return;
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/ambition/set-goal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ goal }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to set goal');
      }

      setPreview({ goal: data.goal, tracks: data.tracks });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = () => {
    if (preview) {
      onGoalSet(preview.goal, preview.tracks);
    }
  };

  if (preview) {
    return (
      <Card className="p-6 max-w-lg mx-auto">
        <h3 className="text-lg font-bold mb-2">Your 7-Day Plan</h3>
        <p className="text-sm text-gray-600 mb-4">&ldquo;{preview.goal.goal_text}&rdquo;</p>

        <div className="space-y-2 mb-4">
          {preview.tracks.map((track) => (
            <div
              key={track.id}
              className="flex items-center gap-3 p-2 rounded-lg bg-gray-50"
            >
              <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-sm font-bold text-indigo-600">
                {track.day_number}
              </div>
              <div className="flex-1">
                <p className="text-sm">{track.task_description}</p>
                <div className="flex items-center gap-1 mt-0.5">
                  {Array.from({ length: track.difficulty }).map((_, i) => (
                    <div key={i} className="w-2 h-2 rounded-full bg-indigo-400" />
                  ))}
                  {Array.from({ length: 5 - track.difficulty }).map((_, i) => (
                    <div key={i} className="w-2 h-2 rounded-full bg-gray-200" />
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        <Button className="w-full" onClick={handleConfirm}>
          Start This Week
        </Button>
      </Card>
    );
  }

  return (
    <Card className="p-6 max-w-lg mx-auto">
      <h3 className="text-lg font-bold mb-2">Set Your Weekly Ambition</h3>
      <p className="text-sm text-gray-600 mb-4">
        What do you want to accomplish this week? AI will break it into 7 daily tasks.
      </p>

      <textarea
        className="w-full border rounded-lg p-3 text-sm resize-none mb-3"
        rows={3}
        placeholder="e.g. Learn the basics of 3D modeling, Build a simple website, Start a morning workout routine..."
        value={goal}
        onChange={(e) => setGoal(e.target.value)}
      />

      {error && <p className="text-sm text-red-600 mb-3">{error}</p>}

      <Button
        className="w-full"
        disabled={!goal.trim() || loading}
        onClick={handleGenerate}
      >
        {loading ? 'Breaking it down with AI...' : 'Break It Down with AI'}
      </Button>
    </Card>
  );
}
