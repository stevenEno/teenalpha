'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { MessageSquare, Plus, UserPlus, ArrowLeft, Sparkles, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { ChatList } from '@/components/messaging/ChatList';
import { useChats, useTeenDiscover } from '@/hooks';
import { toast } from 'sonner';

interface MessagesInboxProps {
  userId: string;
  userName: string | null;
}

export function MessagesInbox({ userId, userName }: MessagesInboxProps) {
  const router = useRouter();
  const { chats, loading, startChat } = useChats();
  const { teens: previewTeens, loading: previewLoading } = useTeenDiscover();
  const [showNewChat, setShowNewChat] = useState(false);
  const [newChatEmail, setNewChatEmail] = useState('');
  const [newChatError, setNewChatError] = useState('');
  const [creating, setCreating] = useState(false);

  const handlePreviewStartChat = useCallback(async (teenId: string) => {
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

  const handleSelectChat = useCallback((chatId: string) => {
    router.push(`/messages/${chatId}`);
  }, [router]);

  const handleStartChat = useCallback(async () => {
    if (!newChatEmail.trim()) return;
    setCreating(true);
    setNewChatError('');
    try {
      // Look up user by email/name - the API will resolve this
      const result = await startChat('one-on-one', [newChatEmail.trim()]);
      setShowNewChat(false);
      setNewChatEmail('');
      if (result.chatId) {
        router.push(`/messages/${result.chatId}`);
      }
    } catch (err: any) {
      setNewChatError(err.message || 'Failed to start chat');
    } finally {
      setCreating(false);
    }
  }, [newChatEmail, startChat, router]);

  return (
    <main className="container mx-auto px-4 py-6 max-w-2xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon-sm" onClick={() => router.push('/dashboard')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-xl font-bold">Messages</h1>
            <p className="text-sm text-gray-500">Chat with other teens</p>
          </div>
        </div>
        <Button
          size="sm"
          onClick={() => router.push('/messages/discover')}
          className="rounded-full bg-[#FF6B35]/50 hover:bg-[#FF6B35]"
        >
          <Sparkles className="w-4 h-4 mr-1" />
          Discover
        </Button>
      </div>

      {/* Mini preview of recommended teens */}
      {!previewLoading && previewTeens.length > 0 && (
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Recommended for you</p>
            <button
              onClick={() => router.push('/messages/discover')}
              className="text-xs text-[#FF6B35] hover:text-[#FF6B35] font-medium"
            >
              See all
            </button>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {previewTeens.slice(0, 3).map((teen) => (
              <motion.button
                key={teen.id}
                onClick={() => teen.hasExistingChat && teen.existingChatId
                  ? router.push(`/messages/${teen.existingChatId}`)
                  : handlePreviewStartChat(teen.id)
                }
                className="flex-shrink-0 flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-2 hover:bg-gray-50 transition-colors"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
              >
                <div className="w-8 h-8 rounded-full bg-[#FF6B35]/10 overflow-hidden flex items-center justify-center flex-shrink-0">
                  {teen.avatar_url ? (
                    <img src={teen.avatar_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-[10px] font-semibold text-[#FF6B35]">
                      {teen.full_name?.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || '?'}
                    </span>
                  )}
                </div>
                <div className="text-left">
                  <p className="text-xs font-medium text-gray-900 truncate max-w-[100px]">
                    {teen.full_name?.split(' ')[0] || 'Teen'}
                  </p>
                  {teen.matchReasons[0] && (
                    <p className="text-[10px] text-gray-400 truncate max-w-[100px]">
                      {teen.matchReasons[0].label}
                    </p>
                  )}
                </div>
              </motion.button>
            ))}
          </div>
        </div>
      )}

      {/* Chat by ID - secondary option */}
      <div className="flex justify-end mb-2">
        <button
          onClick={() => setShowNewChat(true)}
          className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
        >
          Chat by ID
        </button>
      </div>

      {/* Chat list */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-2 border-[#FF6B35] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <ChatList
            chats={chats}
            currentUserId={userId}
            onSelect={handleSelectChat}
          />
        )}
      </div>

      {/* New Chat Dialog */}
      <Dialog open={showNewChat} onOpenChange={setShowNewChat}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="w-5 h-5" />
              Start a New Chat
            </DialogTitle>
            <DialogDescription>
              Enter the user ID of the teen you want to chat with.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">
                User ID
              </label>
              <Input
                value={newChatEmail}
                onChange={(e) => setNewChatEmail(e.target.value)}
                placeholder="Enter their user ID..."
                onKeyDown={(e) => e.key === 'Enter' && handleStartChat()}
              />
            </div>
            {newChatError && (
              <p className="text-sm text-red-500">{newChatError}</p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewChat(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleStartChat}
              disabled={!newChatEmail.trim() || creating}
              className="bg-[#FF6B35]/50 hover:bg-[#FF6B35]"
            >
              {creating ? 'Starting...' : 'Start Chat'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}
