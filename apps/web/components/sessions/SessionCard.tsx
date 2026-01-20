'use client';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { SessionStatus } from '@/types/payments.types';

interface Session {
  id: string;
  mentor_id: string;
  teen_id: string;
  family_id: string;
  status: SessionStatus;
  scheduled_at: string;
  duration_hours: number;
  notes: string | null;
  mentor_notes: string | null;
  cancelled_reason: string | null;
  created_at: string;
  confirmed_at: string | null;
  completed_at: string | null;
  cancelled_at: string | null;
  mentor: {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
  };
  teen: {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
  };
}

interface SessionCardProps {
  session: Session;
  userRole: 'parent' | 'mentor' | 'teen';
  onConfirm?: (sessionId: string) => void;
  onComplete?: (sessionId: string) => void;
  onCancel?: (sessionId: string) => void;
  loading?: boolean;
}

const statusConfig: Record<SessionStatus, { label: string; className: string }> = {
  pending: { label: 'Pending', className: 'bg-yellow-100 text-yellow-800' },
  confirmed: { label: 'Confirmed', className: 'bg-blue-100 text-blue-800' },
  completed: { label: 'Completed', className: 'bg-green-100 text-green-800' },
  cancelled: { label: 'Cancelled', className: 'bg-red-100 text-red-800' },
};

export function SessionCard({
  session,
  userRole,
  onConfirm,
  onComplete,
  onCancel,
  loading = false,
}: SessionCardProps) {
  const getInitials = (name: string | null) => {
    if (!name) return '?';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const isUpcoming = new Date(session.scheduled_at) > new Date();
  const statusInfo = statusConfig[session.status];

  return (
    <Card className={`p-4 ${session.status === 'cancelled' ? 'opacity-60' : ''}`}>
      <div className="flex items-start gap-4">
        {/* Avatar */}
        <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-medium flex-shrink-0">
          {userRole === 'mentor' ? (
            session.teen.avatar_url ? (
              <img
                src={session.teen.avatar_url}
                alt={session.teen.full_name || 'Teen'}
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              getInitials(session.teen.full_name)
            )
          ) : session.mentor.avatar_url ? (
            <img
              src={session.mentor.avatar_url}
              alt={session.mentor.full_name || 'Mentor'}
              className="w-full h-full rounded-full object-cover"
            />
          ) : (
            getInitials(session.mentor.full_name)
          )}
        </div>

        {/* Session Details */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-semibold">
              {userRole === 'mentor'
                ? session.teen.full_name || 'Teen'
                : session.mentor.full_name || 'Mentor'}
            </h4>
            <Badge className={statusInfo.className}>{statusInfo.label}</Badge>
          </div>

          <div className="space-y-1 text-sm text-gray-600">
            <p>
              <span className="font-medium">Date:</span> {formatDate(session.scheduled_at)}
            </p>
            <p>
              <span className="font-medium">Time:</span> {formatTime(session.scheduled_at)}
            </p>
            <p>
              <span className="font-medium">Duration:</span> {session.duration_hours} hour
              {session.duration_hours !== 1 ? 's' : ''}
            </p>
          </div>

          {session.notes && (
            <p className="text-sm text-gray-500 mt-2 italic">"{session.notes}"</p>
          )}

          {session.mentor_notes && userRole !== 'mentor' && (
            <p className="text-sm text-blue-600 mt-2">
              <span className="font-medium">Mentor notes:</span> {session.mentor_notes}
            </p>
          )}

          {session.cancelled_reason && (
            <p className="text-sm text-red-600 mt-2">
              <span className="font-medium">Reason:</span> {session.cancelled_reason}
            </p>
          )}

          {/* Actions */}
          <div className="flex gap-2 mt-3">
            {/* Mentor actions */}
            {userRole === 'mentor' && session.status === 'pending' && onConfirm && (
              <Button size="sm" onClick={() => onConfirm(session.id)} disabled={loading}>
                Confirm Session
              </Button>
            )}

            {userRole === 'mentor' && session.status === 'confirmed' && onComplete && (
              <Button size="sm" onClick={() => onComplete(session.id)} disabled={loading}>
                Mark Completed
              </Button>
            )}

            {/* Cancel action (mentor or parent, only for pending/confirmed) */}
            {(userRole === 'mentor' || userRole === 'parent') &&
              (session.status === 'pending' || session.status === 'confirmed') &&
              onCancel && (
                <Button
                  size="sm"
                  variant="outline"
                  className="text-red-600 hover:text-red-700"
                  onClick={() => onCancel(session.id)}
                  disabled={loading}
                >
                  Cancel
                </Button>
              )}
          </div>
        </div>

        {/* Time indicator */}
        {isUpcoming && (session.status === 'pending' || session.status === 'confirmed') && (
          <div className="text-right flex-shrink-0">
            <p className="text-xs text-gray-400">
              {Math.ceil(
                (new Date(session.scheduled_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
              )}{' '}
              days away
            </p>
          </div>
        )}
      </div>
    </Card>
  );
}
