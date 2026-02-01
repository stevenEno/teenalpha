'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AmbitionMeter } from './AmbitionMeter';
import { DiscomfortRating } from './DiscomfortRating';
import type { AmbitionGoal, DailyTrack } from '@teen-alpha/database';

export function AmbitionView() {
  const [goal, setGoal] = useState<AmbitionGoal | null>(null);
  const [tracks, setTracks] = useState<DailyTrack[]>([]);
  const [todayTrack, setTodayTrack] = useState<DailyTrack | null>(null);
  const [dayNumber, setDayNumber] = useState(1);
  const [stats, setStats] = useState({ totalStars: 0, completedCount: 0, consecutiveDays: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Completion form state
  const [evidence, setEvidence] = useState('');
  const [effort, setEffort] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  const fetchData = async () => {
    try {
      const response = await fetch('/api/ambition/today');
      if (!response.ok) throw new Error('Failed to fetch data');
      const data = await response.json();
      setGoal(data.goal);
      setTracks(data.tracks || []);
      setTodayTrack(data.todayTrack);
      setDayNumber(data.dayNumber || 1);
      setStats(data.stats || { totalStars: 0, completedCount: 0, consecutiveDays: 0 });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleLog = async () => {
    if (!todayTrack || !evidence.trim() || effort === 0) return;
    setSubmitting(true);

    try {
      const response = await fetch('/api/ambition/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trackId: todayTrack.id, evidence, rating: effort }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to log effort');
      }

      await fetchData();
      setEvidence('');
      setEffort(0);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-12 bg-gray-100 rounded-xl animate-pulse" />
        <div className="h-8 bg-gray-100 rounded-xl animate-pulse" />
        <div className="h-32 bg-gray-100 rounded-xl animate-pulse" />
      </div>
    );
  }

  if (error) {
    return (
      <Card className="p-6 border-red-200 bg-red-50">
        <p className="text-red-700">{error}</p>
      </Card>
    );
  }

  if (!goal) {
    return null;
  }

  const todayCompleted = todayTrack?.status === 'completed';
  const goalCompleted = goal.status === 'completed';

  const rewardHints: Record<number, string> = {
    3: 'Halfway point! Keep pushing.',
    5: 'Unlock: Mentor session preview!',
    7: 'Final day! Finish strong.',
  };

  return (
    <div className="space-y-6">
      {/* Goal header */}
      <div>
        <h2 className="text-xl font-bold">Weekly Ambition</h2>
        <p className="text-sm text-gray-600 mt-1">&ldquo;{goal.goal_text}&rdquo;</p>
      </div>

      {/* Star counter */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
          <span className="text-lg font-bold">{stats.totalStars} stars</span>
        </div>
        {stats.consecutiveDays >= 2 && (
          <span className="text-xs text-indigo-600 font-medium">
            {stats.consecutiveDays}-day streak (1.25x bonus!)
          </span>
        )}
      </div>

      {/* Ambition meter */}
      <AmbitionMeter tracks={tracks} currentDay={dayNumber} />

      {/* Reward hint */}
      {rewardHints[dayNumber] && !todayCompleted && (
        <p className="text-xs text-indigo-500 text-center font-medium">
          {rewardHints[dayNumber]}
        </p>
      )}

      {/* Today's task */}
      {goalCompleted ? (
        <Card className="p-6 bg-gradient-to-r from-yellow-50 to-amber-50 border-yellow-200 text-center">
          <p className="text-lg font-bold text-yellow-800">Goal Completed!</p>
          <p className="text-sm text-yellow-600">You earned {stats.totalStars} stars this week.</p>
        </Card>
      ) : todayTrack ? (
        <Card className={`p-4 ${todayCompleted ? 'border-green-300 bg-green-50' : 'border-indigo-300 bg-indigo-50'}`}>
          <div className="flex items-center gap-2 mb-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
              todayCompleted ? 'bg-green-500 text-white' : 'bg-indigo-500 text-white'
            }`}>
              {dayNumber}
            </div>
            <div>
              <h4 className="font-semibold text-sm">Day {dayNumber}</h4>
              <div className="flex items-center gap-0.5">
                {Array.from({ length: todayTrack.difficulty }).map((_, i) => (
                  <div key={i} className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                ))}
              </div>
            </div>
          </div>

          <p className="text-sm text-gray-700 mb-3">{todayTrack.task_description}</p>

          {todayCompleted ? (
            <div className="flex items-center gap-2 text-green-600">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-sm font-medium">
                Completed — earned {todayTrack.stars_earned} stars
              </span>
            </div>
          ) : (
            <div className="space-y-3">
              <textarea
                className="w-full border rounded-lg p-3 text-sm resize-none"
                rows={2}
                placeholder="What did you do today?"
                value={evidence}
                onChange={(e) => setEvidence(e.target.value)}
              />

              <div>
                <label className="text-xs text-gray-500 mb-1 block">How much effort did this take?</label>
                <DiscomfortRating value={effort} onChange={setEffort} label="effort" />
              </div>

              <Button
                className="w-full"
                disabled={!evidence.trim() || effort === 0 || submitting}
                onClick={handleLog}
              >
                {submitting ? 'Logging...' : 'Log Today'}
              </Button>
            </div>
          )}
        </Card>
      ) : (
        <Card className="p-4 text-center text-gray-500">
          <p className="text-sm">No task for today. Come back tomorrow!</p>
        </Card>
      )}

      {/* Weekly progress circles */}
      <div>
        <h4 className="text-sm font-semibold mb-2">This Week</h4>
        <div className="flex items-center justify-between">
          {tracks.map((track) => (
            <div key={track.id} className="flex flex-col items-center gap-1">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                  track.status === 'completed'
                    ? 'bg-green-500 text-white'
                    : track.day_number === dayNumber
                    ? 'bg-indigo-100 text-indigo-600 ring-2 ring-indigo-400'
                    : 'bg-gray-100 text-gray-400'
                }`}
              >
                {track.status === 'completed' ? (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  track.day_number
                )}
              </div>
              {track.stars_earned > 0 && (
                <span className="text-[10px] text-yellow-600">{track.stars_earned}</span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
