'use client';

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface MenteeCardProps {
  mentee: {
    id: string;
    full_name: string | null;
    email: string | null;
    avatar_url: string | null;
    grade: number | null;
    school: string | null;
    bio: string | null;
  };
  mentorshipStatus?: 'pending' | 'active' | 'completed' | 'declined';
  mentorshipCreatedAt?: string;
  showActions?: boolean;
}

export function MenteeCard({
  mentee,
  mentorshipStatus = 'active',
  mentorshipCreatedAt,
  showActions = true,
}: MenteeCardProps) {
  const initials = mentee.full_name
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'T';

  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow">
      <div className="flex items-start gap-4 p-4">
        {/* Avatar */}
        <div className="relative flex-shrink-0">
          <div className="w-14 h-14 rounded-full overflow-hidden bg-[#FF6B35]/10 border-2 border-blue-200 flex items-center justify-center">
            {mentee.avatar_url ? (
              <img
                src={mentee.avatar_url}
                alt={mentee.full_name || 'Mentee'}
                className="object-cover w-full h-full"
              />
            ) : (
              <span className="text-lg font-bold text-blue-600">{initials}</span>
            )}
          </div>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-base truncate">
              {mentee.full_name || 'Teen'}
            </h3>
            {mentorshipStatus === 'active' && (
              <Badge className="bg-green-100 text-green-800 text-xs">Active</Badge>
            )}
            {mentorshipStatus === 'pending' && (
              <Badge className="bg-yellow-100 text-yellow-800 text-xs">Pending</Badge>
            )}
          </div>

          {/* Details */}
          <div className="space-y-1 text-sm text-gray-600">
            {mentee.grade && (
              <p>Grade {mentee.grade}{mentee.school ? ` at ${mentee.school}` : ''}</p>
            )}
            {mentee.bio && (
              <p className="line-clamp-2 text-gray-500">{mentee.bio}</p>
            )}
            {mentorshipCreatedAt && (
              <p className="text-xs text-gray-400">
                Mentee since {new Date(mentorshipCreatedAt).toLocaleDateString()}
              </p>
            )}
          </div>

          {/* Actions */}
          {showActions && (
            <div className="flex gap-2 mt-3">
              <Link href={`/mentees/${mentee.id}`}>
                <Button size="sm" variant="outline">
                  View Progress
                </Button>
              </Link>
              <Button size="sm" variant="ghost">
                Message
              </Button>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
