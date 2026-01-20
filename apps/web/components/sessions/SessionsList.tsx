'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { SessionCard } from './SessionCard';
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

interface SessionsListProps {
  userRole: 'parent' | 'mentor' | 'teen';
  mentorId?: string;
  teenId?: string;
  statusFilter?: SessionStatus;
}

export function SessionsList({ userRole, mentorId, teenId, statusFilter }: SessionsListProps) {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchSessions();
  }, [mentorId, teenId, statusFilter]);

  async function fetchSessions() {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (mentorId) params.set('mentor_id', mentorId);
      if (teenId) params.set('teen_id', teenId);
      if (statusFilter) params.set('status', statusFilter);

      const response = await fetch(`/api/sessions?${params.toString()}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch sessions');
      }

      setSessions(data.sessions || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleUpdateSession(sessionId: string, status: SessionStatus) {
    setActionLoading(true);

    try {
      const response = await fetch(`/api/sessions/${sessionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update session');
      }

      // Refresh sessions list
      await fetchSessions();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  }

  async function handleCancelSession(sessionId: string) {
    const reason = prompt('Please provide a reason for cancellation (optional):');
    setActionLoading(true);

    try {
      const response = await fetch(`/api/sessions/${sessionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'cancelled', cancelled_reason: reason || undefined }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to cancel session');
      }

      await fetchSessions();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="p-4 animate-pulse">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-gray-200" />
              <div className="flex-1 space-y-2">
                <div className="h-5 bg-gray-200 rounded w-1/3" />
                <div className="h-4 bg-gray-200 rounded w-2/3" />
              </div>
            </div>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-3">
        <p className="text-red-600 text-sm">{error}</p>
      </div>
    );
  }

  // Group sessions by status
  const pendingSessions = sessions.filter((s) => s.status === 'pending');
  const confirmedSessions = sessions.filter((s) => s.status === 'confirmed');
  const completedSessions = sessions.filter((s) => s.status === 'completed');
  const cancelledSessions = sessions.filter((s) => s.status === 'cancelled');

  const upcomingSessions = [...pendingSessions, ...confirmedSessions].sort(
    (a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime()
  );

  if (sessions.length === 0) {
    return (
      <Card className="p-6 border-dashed border-2 border-gray-200 bg-gray-50">
        <p className="text-center text-gray-500">No sessions found.</p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Upcoming Sessions */}
      {upcomingSessions.length > 0 && (
        <div className="space-y-3">
          <h4 className="font-medium text-gray-700">
            Upcoming Sessions ({upcomingSessions.length})
          </h4>
          {upcomingSessions.map((session) => (
            <SessionCard
              key={session.id}
              session={session}
              userRole={userRole}
              onConfirm={
                userRole === 'mentor' ? (id) => handleUpdateSession(id, 'confirmed') : undefined
              }
              onComplete={
                userRole === 'mentor' ? (id) => handleUpdateSession(id, 'completed') : undefined
              }
              onCancel={handleCancelSession}
              loading={actionLoading}
            />
          ))}
        </div>
      )}

      {/* Completed Sessions */}
      {completedSessions.length > 0 && (
        <div className="space-y-3">
          <h4 className="font-medium text-gray-700">
            Completed Sessions ({completedSessions.length})
          </h4>
          {completedSessions.slice(0, 5).map((session) => (
            <SessionCard key={session.id} session={session} userRole={userRole} />
          ))}
          {completedSessions.length > 5 && (
            <p className="text-sm text-gray-500 text-center">
              And {completedSessions.length - 5} more completed sessions...
            </p>
          )}
        </div>
      )}

      {/* Cancelled Sessions */}
      {cancelledSessions.length > 0 && (
        <div className="space-y-3">
          <h4 className="font-medium text-gray-500">
            Cancelled Sessions ({cancelledSessions.length})
          </h4>
          {cancelledSessions.slice(0, 3).map((session) => (
            <SessionCard key={session.id} session={session} userRole={userRole} />
          ))}
        </div>
      )}
    </div>
  );
}
