'use client';

import Image from 'next/image';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface MentorCardProps {
  mentor: {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
    bio: string | null;
    expertise: string[] | null;
    is_default_mentor: boolean | null;
  };
  mentorshipStatus?: 'pending' | 'active' | 'completed' | 'declined';
  mentorshipMessage?: string | null;
  showActions?: boolean;
}

export function MentorCard({
  mentor,
  mentorshipStatus = 'active',
  mentorshipMessage,
  showActions = false,
}: MentorCardProps) {
  return (
    <Card className="overflow-hidden">
      <div className="flex items-start gap-4 p-4">
        {/* Avatar */}
        <div className="relative flex-shrink-0">
          <div className="w-16 h-16 rounded-full overflow-hidden bg-gradient-to-br from-purple-100 to-blue-100 border-2 border-purple-200">
            {mentor.avatar_url ? (
              <Image
                src={mentor.avatar_url}
                alt={mentor.full_name || 'Mentor'}
                width={64}
                height={64}
                className="object-cover w-full h-full"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-2xl font-bold text-purple-600">
                {mentor.full_name?.charAt(0) || 'M'}
              </div>
            )}
          </div>
          {mentor.is_default_mentor && (
            <div className="absolute -bottom-1 -right-1 bg-yellow-400 rounded-full p-1 border-2 border-white">
              <span className="text-xs">⭐</span>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-lg truncate">{mentor.full_name || 'Mentor'}</h3>
            {mentor.is_default_mentor && (
              <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 text-xs">
                Founding Mentor
              </Badge>
            )}
          </div>

          {/* Status Badge */}
          <div className="mb-2">
            {mentorshipStatus === 'active' && (
              <Badge className="bg-green-100 text-green-800">Active Mentor</Badge>
            )}
            {mentorshipStatus === 'pending' && (
              <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>
            )}
          </div>

          {/* Bio */}
          {mentor.bio && (
            <p className="text-sm text-gray-600 mb-2 line-clamp-2">{mentor.bio}</p>
          )}

          {/* Expertise */}
          {mentor.expertise && mentor.expertise.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-2">
              {mentor.expertise.slice(0, 4).map((skill, index) => (
                <Badge
                  key={index}
                  variant="outline"
                  className="text-xs bg-purple-50 border-purple-200 text-purple-700"
                >
                  {skill}
                </Badge>
              ))}
              {mentor.expertise.length > 4 && (
                <Badge variant="outline" className="text-xs">
                  +{mentor.expertise.length - 4} more
                </Badge>
              )}
            </div>
          )}

          {/* Welcome Message */}
          {mentorshipMessage && (
            <div className="bg-blue-50 border border-blue-100 rounded-md p-2 mt-2">
              <p className="text-xs text-blue-800">{mentorshipMessage}</p>
            </div>
          )}

          {/* Actions */}
          {showActions && (
            <div className="flex gap-2 mt-3">
              <Button size="sm" variant="outline">
                View Profile
              </Button>
              <Button size="sm" variant="outline">
                Message
              </Button>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
