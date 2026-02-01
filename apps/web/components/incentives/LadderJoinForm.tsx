'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface LadderJoinFormProps {
  onJoined: (ladderId: string) => void;
}

export function LadderJoinForm({ onJoined }: LadderJoinFormProps) {
  const [interest, setInterest] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!interest.trim()) return;
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/ladders/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ interest }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.ladderId) {
          onJoined(data.ladderId);
          return;
        }
        throw new Error(data.error || 'Failed to join ladder');
      }

      onJoined(data.ladderId);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="p-6 max-w-md mx-auto">
      <h3 className="text-lg font-bold mb-2">Join a Challenge Ladder</h3>
      <p className="text-sm text-gray-600 mb-4">
        Enter an interest to find a group. You&apos;ll be matched with 3-5 other teens for a 5-day challenge.
      </p>

      <input
        type="text"
        className="w-full border rounded-lg px-4 py-2 mb-3 text-sm"
        placeholder="e.g. coding, music, fitness, art..."
        value={interest}
        onChange={(e) => setInterest(e.target.value)}
      />

      {error && (
        <p className="text-sm text-red-600 mb-3">{error}</p>
      )}

      <Button
        className="w-full"
        disabled={!interest.trim() || loading}
        onClick={handleSubmit}
      >
        {loading ? 'Finding a group...' : 'Find a Group'}
      </Button>
    </Card>
  );
}
