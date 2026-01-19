'use client';

import { useEffect, useState } from 'react';
import { MenteeCard } from './MenteeCard';
import { Card } from '@/components/ui/card';

interface Mentee {
  id: string;
  full_name: string | null;
  email: string | null;
  avatar_url: string | null;
  grade: number | null;
  school: string | null;
  bio: string | null;
  mentorship_id: string;
  mentorship_status: 'pending' | 'active' | 'completed' | 'declined';
  mentorship_message: string | null;
  mentorship_created_at: string;
  mentorship_accepted_at: string | null;
}

interface MenteesResponse {
  role: string;
  connections: Mentee[];
  count: number;
}

interface MenteesSectionProps {
  maxMentees?: number;
}

export function MenteesSection({ maxMentees = 5 }: MenteesSectionProps) {
  const [mentees, setMentees] = useState<Mentee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchMentees() {
      try {
        const response = await fetch('/api/mentors');
        if (!response.ok) {
          throw new Error('Failed to fetch mentees');
        }
        const data: MenteesResponse = await response.json();
        setMentees(data.connections);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchMentees();
  }, []);

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="p-4 animate-pulse">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-full bg-gray-200" />
              <div className="flex-1 space-y-2">
                <div className="h-5 bg-gray-200 rounded w-1/3" />
                <div className="h-4 bg-gray-200 rounded w-2/3" />
                <div className="h-4 bg-gray-200 rounded w-1/2" />
              </div>
            </div>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Card className="p-6 border-red-200 bg-red-50">
        <p className="text-red-600 text-sm">Failed to load mentees: {error}</p>
      </Card>
    );
  }

  const activeMentees = mentees.filter((m) => m.mentorship_status === 'active');
  const pendingMentees = mentees.filter((m) => m.mentorship_status === 'pending');

  return (
    <div className="space-y-6">
      {/* Stats Header */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="p-4">
          <h4 className="text-sm font-medium text-gray-500 mb-1">Active Mentees</h4>
          <p className="text-3xl font-bold text-blue-600">
            {activeMentees.length}
            <span className="text-lg text-gray-400 font-normal">
              {maxMentees < 999999 ? ` / ${maxMentees}` : ''}
            </span>
          </p>
        </Card>
        <Card className="p-4">
          <h4 className="text-sm font-medium text-gray-500 mb-1">Pending Invitations</h4>
          <p className="text-3xl font-bold text-yellow-600">{pendingMentees.length}</p>
        </Card>
      </div>

      {/* Mentees List */}
      {mentees.length === 0 ? (
        <Card className="p-6 border-dashed border-2 border-gray-200 bg-gray-50">
          <div className="text-center">
            <p className="text-gray-500">No mentees yet.</p>
            <p className="text-sm text-gray-400 mt-1">
              New students will be automatically assigned to you.
            </p>
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          <h3 className="font-semibold text-lg">Your Mentees</h3>
          <div className="space-y-3">
            {mentees.map((mentee) => (
              <MenteeCard
                key={mentee.mentorship_id}
                mentee={mentee}
                mentorshipStatus={mentee.mentorship_status}
                mentorshipCreatedAt={mentee.mentorship_created_at}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
