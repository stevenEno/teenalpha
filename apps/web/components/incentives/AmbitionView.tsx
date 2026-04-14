'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Zap } from 'lucide-react';
import { AmbitionMeter } from './AmbitionMeter';
import { DiscomfortRating } from './DiscomfortRating';
import { StreakFlame } from './StreakFlame';
import { CalendarHeatmap } from './CalendarHeatmap';
import { RewardModal } from './RewardModal';
import type { AmbitionGoal, DailyTrack } from '@teen-alpha/database';
import { convertToAlpha, getAlphaRank, calculateAlphaLevel } from '@/lib/incentives';
import { showAlphaEarned } from '@/lib/alpha-toast';
import { useAlpha } from '@/hooks/useAlpha';

export function AmbitionView() {
  const [goal, setGoal] = useState<AmbitionGoal | null>(null);
  const [tracks, setTracks] = useState<DailyTrack[]>([]);
  const [todayTrack, setTodayTrack] = useState<DailyTrack | null>(null);
  const [dayNumber, setDayNumber] = useState(1);
  const [stats, setStats] = useState({ totalStars: 0, completedCount: 0, consecutiveDays: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [heatmapData, setHeatmapData] = useState<Array<{ date: string; alpha: number }>>([]);
  const [rewardModal, setRewardModal] = useState<{
    open: boolean;
    alpha: number;
    message?: string;
  }>({ open: false, alpha: 0 });

  // Completion form state
  const [evidence, setEvidence] = useState('');
  const [effort, setEffort] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const { refetch: refetchAlpha } = useAlpha();

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

  const fetchHeatmap = async () => {
    try {
      const res = await fetch('/api/alpha/history');
      if (res.ok) {
        const data = await res.json();
        setHeatmapData(data);
      }
    } catch {
      // non-critical
    }
  };

  useEffect(() => {
    fetchData();
    fetchHeatmap();
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

      const result = await response.json();
      const starsEarned = result.starsEarned ?? todayTrack.difficulty * 2;
      const alphaEarned = convertToAlpha('tracker', starsEarned);
      showAlphaEarned(alphaEarned, 'Ambition Tracker');

      await fetchData();
      await refetchAlpha();
      await fetchHeatmap();
      setEvidence('');
      setEffort(0);

      // Week completion check
      if (dayNumber === 7) {
        const totalAlpha = convertToAlpha('tracker', stats.totalStars + starsEarned);
        const { level } = calculateAlphaLevel(totalAlpha);
        setRewardModal({
          open: true,
          alpha: totalAlpha,
          message: `Week complete! ${getAlphaRank(level)} status`,
        });
      }
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
  const totalAlpha = convertToAlpha('tracker', stats.totalStars);

  const rewardHints: Record<number, string> = {
    3: 'Halfway point! Keep pushing.',
    5: 'Unlock: Mentor session preview!',
    7: 'Final day! Finish strong.',
  };

  return (
    <div className="space-y-6">
      <RewardModal
        open={rewardModal.open}
        onClose={() => setRewardModal({ ...rewardModal, open: false })}
        alphaEarned={rewardModal.alpha}
        message={rewardModal.message}
      />

      {/* Goal header */}
      <div>
        <h2 className="text-xl font-bold">Weekly Ambition</h2>
        <p className="text-sm text-gray-600 mt-1">&ldquo;{goal.goal_text}&rdquo;</p>
      </div>

      {/* Alpha + Streak display */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Zap className="w-5 h-5" style={{ color: 'var(--alpha-primary)' }} />
          <span className="text-lg font-bold">{totalAlpha} Alpha</span>
        </div>
        <div className="flex items-center gap-2">
          <StreakFlame streak={stats.consecutiveDays} size="sm" />
          {stats.consecutiveDays >= 2 && (
            <span className="text-xs text-[#FF6B35] font-medium">
              1.25x bonus!
            </span>
          )}
        </div>
      </div>

      {/* Ambition meter */}
      <AmbitionMeter tracks={tracks} currentDay={dayNumber} />

      {/* Calendar heatmap */}
      {heatmapData.length > 0 && (
        <CalendarHeatmap data={heatmapData} />
      )}

      {/* Reward hint */}
      {rewardHints[dayNumber] && !todayCompleted && (
        <p className="text-xs text-[#FF6B35] text-center font-medium">
          {rewardHints[dayNumber]}
        </p>
      )}

      {/* Today's task */}
      {goalCompleted ? (
        <Card className="p-6 bg-gradient-to-r from-yellow-50 to-amber-50 border-yellow-200 text-center">
          <p className="text-lg font-bold text-yellow-800">Goal Completed!</p>
          <p className="text-sm text-yellow-600">You earned {totalAlpha} Alpha this week.</p>
        </Card>
      ) : todayTrack ? (
        <Card className={`p-4 ${todayCompleted ? 'border-green-300 bg-green-50' : 'border-[#FF6B35]/40 bg-[#FF6B35]/5'}`}>
          <div className="flex items-center gap-2 mb-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
              todayCompleted ? 'bg-green-500 text-white' : 'bg-[#FF6B35]/50 text-white'
            }`}>
              {dayNumber}
            </div>
            <div>
              <h4 className="font-semibold text-sm">Day {dayNumber}</h4>
              <div className="flex items-center gap-0.5">
                {Array.from({ length: todayTrack.difficulty }).map((_, i) => (
                  <div key={i} className="w-1.5 h-1.5 rounded-full bg-[#FF6B35]/60" />
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
                Completed — earned {convertToAlpha('tracker', todayTrack.stars_earned)} Alpha
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
    </div>
  );
}
