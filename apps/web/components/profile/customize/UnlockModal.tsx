'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Zap, Lock, AlertCircle } from 'lucide-react';
import confetti from 'canvas-confetti';
import { UNLOCK_COSTS } from '@/lib/incentives';

interface UnlockModalProps {
  open: boolean;
  onClose: () => void;
  unlockType: string;
  unlockKey: string;
  available: number;
  onUnlock: (type: string, key: string) => Promise<void>;
}

export function UnlockModal({ open, onClose, unlockType, unlockKey, available, onUnlock }: UnlockModalProps) {
  const [unlocking, setUnlocking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const cost = UNLOCK_COSTS[unlockType] || 0;
  const canAfford = available >= cost;

  useEffect(() => {
    setError(null);
  }, [open]);

  const handleUnlock = async () => {
    setUnlocking(true);
    setError(null);
    try {
      await onUnlock(unlockType, unlockKey);
      confetti({
        particleCount: 80,
        spread: 60,
        colors: ['#9333ea', '#fbbf24', '#3b82f6', '#f97316'],
      });
      setTimeout(onClose, 1500);
    } catch (err: any) {
      setError(err.message || 'Failed to unlock');
    } finally {
      setUnlocking(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lock className="w-5 h-5" /> Unlock Item
          </DialogTitle>
        </DialogHeader>

        <div className="py-4 space-y-4">
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-2">
              Unlock <span className="font-semibold">{unlockKey.replace(/_/g, ' ')}</span>
            </p>
            <div className="flex items-center justify-center gap-2 text-2xl font-bold text-indigo-600">
              <Zap className="w-6 h-6" />
              {cost} Alpha
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Your balance</span>
              <span className="font-medium">{available} Alpha</span>
            </div>
            <div className="flex justify-between text-sm mt-1">
              <span className="text-gray-600">Cost</span>
              <span className="font-medium text-red-500">-{cost} Alpha</span>
            </div>
            <div className="border-t mt-2 pt-2 flex justify-between text-sm">
              <span className="text-gray-600">Remaining</span>
              <span className={`font-medium ${canAfford ? 'text-green-600' : 'text-red-500'}`}>
                {available - cost} Alpha
              </span>
            </div>
          </div>

          {!canAfford && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-700 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                Not enough Alpha. Keep completing quests and challenges to earn more!
              </p>
            </div>
          )}

          {error && (
            <p className="text-sm text-red-500">{error}</p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleUnlock}
            disabled={!canAfford || unlocking}
          >
            {unlocking ? 'Unlocking...' : `Spend ${cost} Alpha`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
