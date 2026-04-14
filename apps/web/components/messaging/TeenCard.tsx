'use client';

import { motion } from 'framer-motion';
import { MessageSquare, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { DiscoveredTeen, MatchReason } from '@teen-alpha/database';

interface TeenCardProps {
  teen: DiscoveredTeen;
  onStartChat: (teenId: string) => void;
  onOpenChat: (chatId: string) => void;
  index?: number;
}

const REASON_COLORS: Record<MatchReason['type'], string> = {
  interest: 'bg-[#FF6B35]/10 text-[#FF6B35]',
  ladder: 'bg-[#FF6B35]/10 text-[#FF6B35]',
  gaming: 'bg-[#FF6B35]/10 text-[#FF6B35]',
  social: 'bg-[#2EC4B6]/15 text-[#2EC4B6]',
  grade: 'bg-green-100 text-green-700',
  school: 'bg-blue-100 text-blue-700',
  pathway: 'bg-amber-100 text-amber-700',
  goal: 'bg-teal-100 text-teal-700',
  skill: 'bg-orange-100 text-orange-700',
};

function getInitials(name: string | null): string {
  if (!name) return '?';
  return name
    .split(' ')
    .map(w => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function TeenCard({ teen, onStartChat, onOpenChat, index = 0 }: TeenCardProps) {
  const subtitle = [teen.grade ? `Grade ${teen.grade}` : null, teen.school]
    .filter(Boolean)
    .join(' · ');

  return (
    <motion.div
      className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
    >
      <div className="flex items-start gap-3 p-4">
        {/* Avatar */}
        <div className="flex-shrink-0">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br bg-[#FF6B35]/10 overflow-hidden flex items-center justify-center">
            {teen.avatar_url ? (
              <img src={teen.avatar_url} alt="" className="w-full h-full object-cover" />
            ) : (
              <span className="text-sm font-semibold text-[#FF6B35]">
                {getInitials(teen.full_name)}
              </span>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h3 className="font-semibold text-sm text-gray-900 truncate">
              {teen.full_name || 'Teen Alpha User'}
            </h3>
            {teen.matchScore > 0 && (
              <span className="text-[10px] font-medium text-gray-400 flex-shrink-0">
                {teen.matchScore} pts
              </span>
            )}
          </div>

          {subtitle && (
            <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>
          )}

          {teen.bio && (
            <p className="text-xs text-gray-600 mt-1.5 line-clamp-2">{teen.bio}</p>
          )}

          {/* Match reason badges */}
          {teen.matchReasons.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {teen.matchReasons.map((reason, i) => (
                <span
                  key={i}
                  className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${REASON_COLORS[reason.type]}`}
                >
                  {reason.label}
                </span>
              ))}
            </div>
          )}

          {/* Interest tags (full visibility only) */}
          {teen.interests.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {teen.interests.slice(0, 5).map((interest) => (
                <span
                  key={interest}
                  className="inline-flex items-center px-1.5 py-0.5 rounded bg-gray-100 text-[10px] text-gray-500"
                >
                  {interest}
                </span>
              ))}
              {teen.interests.length > 5 && (
                <span className="text-[10px] text-gray-400">
                  +{teen.interests.length - 5}
                </span>
              )}
            </div>
          )}

          {/* Action */}
          <div className="mt-3">
            {teen.hasExistingChat && teen.existingChatId ? (
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-xs"
                onClick={() => onOpenChat(teen.existingChatId!)}
              >
                <MessageSquare className="w-3 h-3 mr-1" />
                Open Chat
              </Button>
            ) : (
              <Button
                size="sm"
                className="h-7 text-xs bg-[#FF6B35]/50 hover:bg-[#FF6B35]"
                onClick={() => onStartChat(teen.id)}
              >
                <ArrowRight className="w-3 h-3 mr-1" />
                Start Chat
              </Button>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
