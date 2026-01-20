'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface Mentor {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
}

interface Teen {
  id: string;
  full_name: string | null;
}

interface BookSessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  mentor: Mentor;
  teen: Teen;
  availableHours: number;
  onSessionBooked?: () => void;
}

export function BookSessionModal({
  isOpen,
  onClose,
  mentor,
  teen,
  availableHours,
  onSessionBooked,
}: BookSessionModalProps) {
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [duration, setDuration] = useState('1');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const maxDuration = Math.min(availableHours, 4); // Max 4 hours per session

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!date || !time) {
      setError('Please select a date and time');
      return;
    }

    const durationNum = parseFloat(duration);
    if (durationNum > availableHours) {
      setError(`You only have ${availableHours} hours available`);
      return;
    }

    const scheduledAt = new Date(`${date}T${time}`);
    if (scheduledAt <= new Date()) {
      setError('Please select a future date and time');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mentor_id: mentor.id,
          teen_id: teen.id,
          scheduled_at: scheduledAt.toISOString(),
          duration_hours: durationNum,
          notes: notes || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to book session');
      }

      onSessionBooked?.();
      onClose();

      // Reset form
      setDate('');
      setTime('');
      setDuration('1');
      setNotes('');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  // Get minimum date (tomorrow)
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split('T')[0];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Book a Session</DialogTitle>
          <DialogDescription>
            Schedule a mentoring session with {mentor.full_name || 'mentor'} for{' '}
            {teen.full_name || 'your teen'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
            <p className="text-blue-700 text-sm">
              <span className="font-medium">Available balance:</span> {availableHours} hour
              {availableHours !== 1 ? 's' : ''}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                min={minDate}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="time">Time</Label>
              <Input
                id="time"
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="duration">Duration (hours)</Label>
            <select
              id="duration"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              className="w-full border rounded-md px-3 py-2"
              disabled={maxDuration < 1}
            >
              {maxDuration >= 0.5 && <option value="0.5">30 minutes</option>}
              {maxDuration >= 1 && <option value="1">1 hour</option>}
              {maxDuration >= 1.5 && <option value="1.5">1.5 hours</option>}
              {maxDuration >= 2 && <option value="2">2 hours</option>}
              {maxDuration >= 3 && <option value="3">3 hours</option>}
              {maxDuration >= 4 && <option value="4">4 hours</option>}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes for Mentor (optional)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any specific topics or goals for this session..."
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || maxDuration < 0.5}>
              {loading ? 'Booking...' : 'Book Session'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
