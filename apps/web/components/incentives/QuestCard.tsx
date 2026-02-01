'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DiscomfortRating } from './DiscomfortRating';
import type { Quest } from '@teen-alpha/database';

interface QuestCardProps {
  quest: Quest;
  isActive: boolean;
  onComplete: (questId: string, proof: string, discomfort: number) => Promise<void>;
}

export function QuestCard({ quest, isActive, onComplete }: QuestCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [proof, setProof] = useState('');
  const [discomfort, setDiscomfort] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  const difficultyColors: Record<number, string> = {
    1: 'bg-green-100 text-green-800',
    2: 'bg-blue-100 text-blue-800',
    3: 'bg-yellow-100 text-yellow-800',
    4: 'bg-orange-100 text-orange-800',
    5: 'bg-red-100 text-red-800',
  };

  const handleSubmit = async () => {
    if (!proof.trim() || discomfort === 0) return;
    setSubmitting(true);
    try {
      await onComplete(quest.id, proof, discomfort);
    } finally {
      setSubmitting(false);
    }
  };

  const isCompleted = quest.status === 'completed';

  return (
    <Card
      className={`p-4 transition-all cursor-pointer ${
        isCompleted
          ? 'border-green-300 bg-green-50'
          : isActive
          ? 'border-indigo-300 bg-indigo-50 shadow-md'
          : 'opacity-60'
      }`}
      onClick={() => isActive && setExpanded(!expanded)}
    >
      <div className="flex items-center gap-3">
        {/* Status indicator */}
        <div
          className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
            isCompleted
              ? 'bg-green-500 text-white'
              : isActive
              ? 'bg-indigo-500 text-white'
              : 'bg-gray-200 text-gray-500'
          }`}
        >
          {isCompleted ? (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            <span className="text-sm font-bold">{quest.order_index + 1}</span>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="font-semibold text-sm truncate">{quest.title}</h4>
            <Badge className={`text-xs ${difficultyColors[quest.difficulty] || ''}`}>
              Lv {quest.difficulty}
            </Badge>
          </div>
          <p className="text-xs text-gray-500">{quest.estimated_minutes} min</p>
        </div>

        {isCompleted && quest.points_earned > 0 && (
          <span className="text-sm font-bold text-green-600">+{quest.points_earned}pts</span>
        )}
      </div>

      {expanded && isActive && !isCompleted && (
        <div className="mt-4 pt-4 border-t" onClick={(e) => e.stopPropagation()}>
          <p className="text-sm text-gray-700 mb-4">{quest.description}</p>

          <textarea
            className="w-full border rounded-lg p-3 text-sm resize-none"
            rows={3}
            placeholder="Describe what you did..."
            value={proof}
            onChange={(e) => setProof(e.target.value)}
          />

          <div className="mt-3">
            <DiscomfortRating value={discomfort} onChange={setDiscomfort} />
          </div>

          <Button
            className="w-full mt-3"
            disabled={!proof.trim() || discomfort === 0 || submitting}
            onClick={handleSubmit}
          >
            {submitting ? 'Submitting...' : 'Complete Quest'}
          </Button>
        </div>
      )}
    </Card>
  );
}
