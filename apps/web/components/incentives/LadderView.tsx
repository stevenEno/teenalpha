'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Zap } from 'lucide-react';
import { ChallengeCard } from './ChallengeCard';
import { RewardModal } from './RewardModal';
import type { Ladder, Challenge } from '@teen-alpha/database';
import { convertToAlpha, getAlphaRank, calculateAlphaLevel } from '@/lib/incentives';
import { showAlphaEarned } from '@/lib/alpha-toast';
import { useAlpha } from '@/hooks/useAlpha';

interface LadderViewProps {
  ladderId: string;
}

interface MemberData {
  user_id: string;
  tokens: number;
  profiles: { full_name: string; avatar_url: string | null };
}

export function LadderView({ ladderId }: LadderViewProps) {
  const [ladder, setLadder] = useState<Ladder | null>(null);
  const [members, setMembers] = useState<MemberData[]>([]);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [completions, setCompletions] = useState<any[]>([]);
  const [myTokens, setMyTokens] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [rewardModal, setRewardModal] = useState<{
    open: boolean;
    alpha: number;
    message?: string;
  }>({ open: false, alpha: 0 });
  const { refetch: refetchAlpha } = useAlpha();

  const fetchStatus = useCallback(async () => {
    try {
      const response = await fetch(`/api/ladders/${ladderId}/status`);
      if (!response.ok) throw new Error('Failed to fetch ladder status');
      const data = await response.json();
      setLadder(data.ladder);
      setMembers(data.members || []);
      setChallenges(data.challenges || []);
      setCompletions(data.completions || []);
      setMyTokens(data.myTokens || 0);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [ladderId]);

  useEffect(() => {
    fetchStatus();
    // Get current user ID from a quick auth check
    fetch('/api/incentive/assign')
      .then((r) => r.json())
      .then((d) => {
        if (d.assignment) setUserId(d.assignment.user_id);
      })
      .catch(() => {});

    // Poll every 30s for group updates
    const interval = setInterval(fetchStatus, 30000);
    return () => clearInterval(interval);
  }, [fetchStatus]);

  const handleVote = async (challengeId: string) => {
    const response = await fetch('/api/challenges/vote', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ challengeId }),
    });
    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || 'Vote failed');
    }
    await fetchStatus();
  };

  const handleComplete = async (challengeId: string, proof: string, discomfort: number) => {
    const response = await fetch('/api/challenges/complete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ challengeId, proof, discomfort }),
    });
    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || 'Completion failed');
    }

    const result = await response.json();
    const tokensEarned = result.tokensEarned ?? 10;
    const alphaEarned = convertToAlpha('ladder', tokensEarned);
    showAlphaEarned(alphaEarned, 'Challenge Ladder');
    await fetchStatus();
    await refetchAlpha();
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-16 bg-gray-100 rounded-xl animate-pulse" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-24 bg-gray-100 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  if (error || !ladder) {
    return (
      <Card className="p-6 border-red-200 bg-red-50">
        <p className="text-red-700">{error || 'Ladder not found'}</p>
      </Card>
    );
  }

  const completedMembers = completions.length;
  const progressPercent = members.length > 0 ? (completedMembers / members.length) * 100 : 0;
  const myAlpha = convertToAlpha('ladder', myTokens);

  return (
    <div className="space-y-6">
      <RewardModal
        open={rewardModal.open}
        onClose={() => setRewardModal({ ...rewardModal, open: false })}
        alphaEarned={rewardModal.alpha}
        message={rewardModal.message}
      />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">{ladder.interest}</h2>
          <p className="text-sm text-gray-500">
            Day {ladder.current_day}/5 &middot; {members.length} members
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge className="bg-[#FF6B35]/10 text-foreground flex items-center gap-1">
            <Zap className="w-3 h-3" />
            {myAlpha} Alpha
          </Badge>
          {ladder.status === 'forming' && (
            <Badge className="bg-gray-100 text-gray-600">Forming</Badge>
          )}
        </div>
      </div>

      {/* Member avatars with stagger */}
      <div className="flex items-center gap-2">
        {members.map((m, i) => (
          <motion.div
            key={m.user_id}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.1 }}
            className="w-8 h-8 rounded-full bg-[#FF6B35]/10 flex items-center justify-center text-xs font-semibold text-[#FF6B35]"
            title={m.profiles?.full_name || 'Member'}
          >
            {m.profiles?.full_name?.charAt(0) || '?'}
          </motion.div>
        ))}
      </div>

      {/* Group progress */}
      {challenges.length > 0 && (
        <div>
          <div className="flex items-center justify-between text-sm mb-1">
            <span className="text-gray-600">Group Progress</span>
            <span className="text-gray-500">
              {completedMembers}/{members.length} completed today
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-[#FF6B35]/50 h-2 rounded-full transition-all"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      )}

      {/* Challenges */}
      {ladder.status === 'forming' ? (
        <Card className="p-6 text-center bg-yellow-50 border-yellow-200">
          <p className="text-yellow-800 font-medium">
            Waiting for more members to join...
          </p>
          <p className="text-sm text-yellow-600 mt-1">
            {members.length}/4 members needed to start
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          <h3 className="font-semibold">
            Day {ladder.current_day} Challenges
          </h3>
          {challenges.map((challenge) => {
            const challengeCompletions = completions.filter(
              (c: any) => c.challenge_id === challenge.id
            );
            const hasVoted = Array.isArray(challenge.votes) && userId
              ? challenge.votes.includes(userId)
              : false;
            const hasCompleted = userId
              ? challengeCompletions.some((c: any) => c.user_id === userId)
              : false;

            return (
              <ChallengeCard
                key={challenge.id}
                challenge={challenge}
                memberCount={members.length}
                completions={challengeCompletions}
                hasVoted={hasVoted}
                hasCompleted={hasCompleted}
                onVote={handleVote}
                onComplete={handleComplete}
              />
            );
          })}
        </div>
      )}

      {ladder.status === 'completed' && (
        <Card className="p-6 bg-[#FF6B35]/5 border-[#FF6B35]/30 text-center">
          <p className="text-lg font-bold text-foreground">Ladder Complete!</p>
          <p className="text-sm text-[#FF6B35]">You earned {myAlpha} Alpha total.</p>
        </Card>
      )}
    </div>
  );
}
