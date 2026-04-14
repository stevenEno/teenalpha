'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DiscomfortRating } from './DiscomfortRating';
import type { Challenge } from '@teen-alpha/database';

interface ChallengeCardProps {
  challenge: Challenge;
  memberCount: number;
  completions: { user_id: string; profiles: { full_name: string; avatar_url: string | null } }[];
  hasVoted: boolean;
  hasCompleted: boolean;
  onVote: (challengeId: string) => Promise<void>;
  onComplete: (challengeId: string, proof: string, discomfort: number) => Promise<void>;
}

export function ChallengeCard({
  challenge,
  memberCount,
  completions,
  hasVoted,
  hasCompleted,
  onVote,
  onComplete,
}: ChallengeCardProps) {
  const [proof, setProof] = useState('');
  const [discomfort, setDiscomfort] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  const voteCount = Array.isArray(challenge.votes) ? challenge.votes.length : 0;
  const isActive = challenge.status === 'active' || challenge.is_selected;
  const isVoting = challenge.status === 'voting';

  const handleVote = async () => {
    setSubmitting(true);
    try {
      await onVote(challenge.id);
    } finally {
      setSubmitting(false);
    }
  };

  const handleComplete = async () => {
    if (!proof.trim() || discomfort === 0) return;
    setSubmitting(true);
    try {
      await onComplete(challenge.id, proof, discomfort);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card className={`p-4 ${isActive ? 'border-[#FF6B35]/40 bg-[#FF6B35]/5' : ''}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-semibold text-sm">{challenge.title}</h4>
            <Badge
              className={
                challenge.difficulty === 'hard'
                  ? 'bg-red-100 text-red-800'
                  : 'bg-blue-100 text-blue-800'
              }
            >
              {challenge.difficulty === 'hard' ? 'Hard (2x tokens)' : 'Normal'}
            </Badge>
          </div>
          <p className="text-sm text-gray-600">{challenge.description}</p>
        </div>
      </div>

      {/* Voting state */}
      {isVoting && !isActive && (
        <div className="mt-3 flex items-center justify-between">
          <span className="text-xs text-gray-500">
            {voteCount}/{Math.ceil(memberCount / 2)} votes needed
          </span>
          <Button
            size="sm"
            variant={hasVoted ? 'outline' : 'default'}
            disabled={hasVoted || submitting}
            onClick={handleVote}
          >
            {hasVoted ? 'Voted' : 'Vote'}
          </Button>
        </div>
      )}

      {/* Active challenge — completion form */}
      {isActive && !hasCompleted && (
        <div className="mt-3 pt-3 border-t space-y-3">
          <textarea
            className="w-full border rounded-lg p-3 text-sm resize-none"
            rows={2}
            placeholder="What did you do?"
            value={proof}
            onChange={(e) => setProof(e.target.value)}
          />
          <DiscomfortRating value={discomfort} onChange={setDiscomfort} />
          <Button
            className="w-full"
            size="sm"
            disabled={!proof.trim() || discomfort === 0 || submitting}
            onClick={handleComplete}
          >
            {submitting ? 'Submitting...' : 'Complete Challenge'}
          </Button>
        </div>
      )}

      {/* Completed state */}
      {hasCompleted && (
        <div className="mt-2 text-sm text-green-600 font-medium">Completed!</div>
      )}

      {/* Completion avatars */}
      {completions.length > 0 && (
        <div className="mt-2 flex items-center gap-1">
          <span className="text-xs text-gray-400">{completions.length} completed:</span>
          {completions.map((c, i) => (
            <span key={i} className="text-xs text-gray-600">{c.profiles?.full_name?.split(' ')[0]}</span>
          ))}
        </div>
      )}
    </Card>
  );
}
