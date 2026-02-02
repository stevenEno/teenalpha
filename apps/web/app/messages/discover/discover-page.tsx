'use client';

import { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, RefreshCw, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TeenDiscoverList } from '@/components/messaging/TeenDiscoverList';
import { useTeenDiscover, useChats } from '@/hooks';
import { toast } from 'sonner';

interface DiscoverPageProps {
  userId: string;
  userName: string | null;
}

export function DiscoverPage({ userId, userName }: DiscoverPageProps) {
  const router = useRouter();
  const { teens, loading, hasMore, total, isFallback, loadMore, refresh } = useTeenDiscover();
  const { startChat } = useChats();

  const handleStartChat = useCallback(async (teenId: string) => {
    try {
      const result = await startChat('one-on-one', [teenId]);
      const chatId = result.chat_id || result.chatId;
      if (chatId) {
        router.push(`/messages/${chatId}`);
      }
    } catch (err: any) {
      toast.error('Could not start chat', {
        description: err.message || 'Something went wrong',
      });
    }
  }, [startChat, router]);

  const handleOpenChat = useCallback((chatId: string) => {
    router.push(`/messages/${chatId}`);
  }, [router]);

  return (
    <main className="container mx-auto px-4 py-6 max-w-2xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon-sm" onClick={() => router.push('/messages')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-xl font-bold">Discover Teens</h1>
            <p className="text-sm text-gray-500">
              {loading ? 'Finding matches...' : `${total} teen${total !== 1 ? 's' : ''} found`}
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={refresh}
          disabled={loading}
          className="rounded-full"
        >
          <RefreshCw className={`w-4 h-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Discovery list */}
      <TeenDiscoverList
        teens={teens}
        loading={loading}
        hasMore={hasMore}
        isFallback={isFallback}
        onLoadMore={loadMore}
        onStartChat={handleStartChat}
        onOpenChat={handleOpenChat}
      />
    </main>
  );
}
