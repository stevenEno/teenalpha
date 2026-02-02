'use client';

import { Sparkles, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TeenCard } from './TeenCard';
import type { DiscoveredTeen } from '@teen-alpha/database';

interface TeenDiscoverListProps {
  teens: DiscoveredTeen[];
  loading: boolean;
  hasMore: boolean;
  isFallback: boolean;
  onLoadMore: () => void;
  onStartChat: (teenId: string) => void;
  onOpenChat: (chatId: string) => void;
}

function SkeletonCard() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 animate-pulse">
      <div className="flex items-start gap-3">
        <div className="w-12 h-12 rounded-full bg-gray-200 flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-gray-200 rounded w-1/3" />
          <div className="h-3 bg-gray-100 rounded w-1/4" />
          <div className="flex gap-1 mt-2">
            <div className="h-5 bg-gray-100 rounded-full w-20" />
            <div className="h-5 bg-gray-100 rounded-full w-16" />
          </div>
          <div className="h-7 bg-gray-200 rounded w-24 mt-2" />
        </div>
      </div>
    </div>
  );
}

export function TeenDiscoverList({
  teens,
  loading,
  hasMore,
  isFallback,
  onLoadMore,
  onStartChat,
  onOpenChat,
}: TeenDiscoverListProps) {
  if (loading) {
    return (
      <div className="space-y-3">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
    );
  }

  if (teens.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
        <div className="w-16 h-16 rounded-full bg-indigo-50 flex items-center justify-center mb-4">
          <UserPlus className="w-8 h-8 text-indigo-400" />
        </div>
        <p className="text-gray-600 font-medium mb-1">No matches yet</p>
        <p className="text-sm text-gray-400 max-w-xs">
          Connect your interests in your profile to find teens with similar vibes.
        </p>
        <Button
          variant="outline"
          size="sm"
          className="mt-4"
          onClick={() => window.location.href = '/profile'}
        >
          Set up your profile
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {isFallback && (
        <div className="flex items-center gap-2 px-1 py-2">
          <Sparkles className="w-4 h-4 text-amber-500" />
          <p className="text-xs text-gray-500">
            New on Teen Alpha &mdash; add interests to your profile for personalized matches
          </p>
        </div>
      )}

      {teens.map((teen, index) => (
        <TeenCard
          key={teen.id}
          teen={teen}
          index={index}
          onStartChat={onStartChat}
          onOpenChat={onOpenChat}
        />
      ))}

      {hasMore && (
        <div className="flex justify-center pt-2 pb-4">
          <Button
            variant="outline"
            size="sm"
            onClick={onLoadMore}
          >
            Load more
          </Button>
        </div>
      )}
    </div>
  );
}
