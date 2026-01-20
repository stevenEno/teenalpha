'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

interface Session {
  id: string;
  status: string;
  scheduled_at: string;
  duration_hours: number;
  mentor: { full_name: string | null };
  teen: { full_name: string | null };
}

interface SessionsWidgetProps {
  userRole: 'parent' | 'mentor' | 'teen';
}

export function SessionsWidget({ userRole }: SessionsWidgetProps) {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSessions();
  }, []);

  async function fetchSessions() {
    try {
      const response = await fetch('/api/sessions');
      if (response.ok) {
        const data = await response.json();
        setSessions(data.sessions || []);
      }
    } catch (err) {
      console.error('Error fetching sessions:', err);
    } finally {
      setLoading(false);
    }
  }

  const upcomingSessions = sessions.filter(
    (s) => (s.status === 'pending' || s.status === 'confirmed') && new Date(s.scheduled_at) > new Date()
  );
  const pendingConfirmation = sessions.filter((s) => s.status === 'pending');

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <Card className="p-4 animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-1/2 mb-2" />
        <div className="h-16 bg-gray-200 rounded" />
      </Card>
    );
  }

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold">Sessions</h3>
        <Link href="/dashboard/sessions">
          <Button size="sm" variant="outline">View All</Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-2 mb-3">
        <div className="bg-blue-50 rounded p-2 text-center">
          <p className="text-lg font-bold text-blue-600">{upcomingSessions.length}</p>
          <p className="text-xs text-blue-700">Upcoming</p>
        </div>
        <div className="bg-yellow-50 rounded p-2 text-center">
          <p className="text-lg font-bold text-yellow-600">{pendingConfirmation.length}</p>
          <p className="text-xs text-yellow-700">
            {userRole === 'mentor' ? 'Needs Confirmation' : 'Pending'}
          </p>
        </div>
      </div>

      {/* Next Session Preview */}
      {upcomingSessions.length > 0 ? (
        <div className="border rounded p-2 bg-gray-50">
          <p className="text-xs text-gray-500 mb-1">Next Session</p>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-sm">
                {userRole === 'mentor'
                  ? upcomingSessions[0].teen.full_name
                  : upcomingSessions[0].mentor.full_name}
              </p>
              <p className="text-xs text-gray-500">{formatDate(upcomingSessions[0].scheduled_at)}</p>
            </div>
            <Badge
              className={
                upcomingSessions[0].status === 'confirmed'
                  ? 'bg-blue-100 text-blue-800'
                  : 'bg-yellow-100 text-yellow-800'
              }
            >
              {upcomingSessions[0].status}
            </Badge>
          </div>
        </div>
      ) : (
        <div className="text-center py-2">
          <p className="text-sm text-gray-500">No upcoming sessions</p>
          {userRole === 'parent' && (
            <Link href="/dashboard/sessions">
              <Button size="sm" variant="outline" className="mt-2">
                Book a Session
              </Button>
            </Link>
          )}
        </div>
      )}
    </Card>
  );
}
