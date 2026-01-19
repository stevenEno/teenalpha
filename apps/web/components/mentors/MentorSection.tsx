'use client';

import { useEffect, useState } from 'react';
import { MentorCard } from './MentorCard';
import { Card } from '@/components/ui/card';

interface Mentor {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  expertise: string[] | null;
  is_default_mentor: boolean | null;
  mentorship_id: string;
  mentorship_status: 'pending' | 'active' | 'completed' | 'declined';
  mentorship_message: string | null;
}

interface MentorsResponse {
  role: string;
  connections: Mentor[];
  count: number;
}

export function MentorSection() {
  const [mentors, setMentors] = useState<Mentor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchMentors() {
      try {
        const response = await fetch('/api/mentors');
        if (!response.ok) {
          throw new Error('Failed to fetch mentors');
        }
        const data: MentorsResponse = await response.json();
        setMentors(data.connections);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchMentors();
  }, []);

  if (loading) {
    return (
      <Card className="p-6 animate-pulse">
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 rounded-full bg-gray-200" />
          <div className="flex-1 space-y-2">
            <div className="h-5 bg-gray-200 rounded w-1/3" />
            <div className="h-4 bg-gray-200 rounded w-2/3" />
            <div className="h-4 bg-gray-200 rounded w-1/2" />
          </div>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-6 border-red-200 bg-red-50">
        <p className="text-red-600 text-sm">Failed to load mentors: {error}</p>
      </Card>
    );
  }

  if (mentors.length === 0) {
    return (
      <Card className="p-6 border-dashed border-2 border-gray-200 bg-gray-50">
        <div className="text-center">
          <p className="text-gray-500">No mentors assigned yet.</p>
          <p className="text-sm text-gray-400 mt-1">
            A mentor will be assigned to you automatically.
          </p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-lg">Your Mentors</h3>
        <span className="text-sm text-gray-500">{mentors.length} mentor{mentors.length !== 1 ? 's' : ''}</span>
      </div>
      <div className="space-y-3">
        {mentors.map((mentor) => (
          <MentorCard
            key={mentor.mentorship_id}
            mentor={mentor}
            mentorshipStatus={mentor.mentorship_status}
            mentorshipMessage={mentor.mentorship_message}
          />
        ))}
      </div>
    </div>
  );
}
