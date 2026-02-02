'use client';

import { useRef, useEffect, useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, MoreVertical, Flag, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { ChatBubble } from '@/components/messaging/ChatBubble';
import { ChatInput } from '@/components/messaging/ChatInput';
import { StreakDisplay } from '@/components/messaging/StreakDisplay';
import { useMessages, useChats } from '@/hooks';

interface ChatViewProps {
  chatId: string;
  userId: string;
  userName: string | null;
}

export function ChatView({ chatId, userId, userName }: ChatViewProps) {
  const router = useRouter();
  const { messages, chat, participants, streak, loading, sendMessage, markViewed, saveMessage } = useMessages(chatId);
  const { reportChat } = useChats();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [showMenu, setShowMenu] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reporting, setReporting] = useState(false);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  // Get display name for the chat
  const chatDisplayName = (() => {
    if (chat?.name) return chat.name;
    if (chat?.chat_type === 'one-on-one') {
      const other = participants.find(p => p.user_id !== userId);
      return other?.profiles?.full_name || 'Chat';
    }
    const names = participants
      .filter(p => p.user_id !== userId)
      .map(p => p.profiles?.full_name?.split(' ')[0] || 'Unknown')
      .slice(0, 3);
    return names.join(', ') || 'Group Chat';
  })();

  const otherAvatar = (() => {
    if (chat?.chat_type === 'one-on-one') {
      const other = participants.find(p => p.user_id !== userId);
      return other?.profiles?.avatar_url || null;
    }
    return null;
  })();

  // Build a lookup map for sender info
  const participantMap = new Map(
    participants.map(p => [p.user_id, { name: p.profiles?.full_name || 'Unknown', avatar: p.profiles?.avatar_url || null }])
  );

  const handleSendText = useCallback(async (content: string) => {
    await sendMessage(content, 'text');
  }, [sendMessage]);

  const handleSendSticker = useCallback(async (stickerKey: string) => {
    await sendMessage(stickerKey, 'sticker', undefined, stickerKey);
  }, [sendMessage]);

  const handleReport = useCallback(async () => {
    if (!reportReason.trim()) return;
    setReporting(true);
    try {
      await reportChat(chatId, reportReason.trim());
      setShowReport(false);
      setReportReason('');
    } catch {
      // Error handled by hook
    } finally {
      setReporting(false);
    }
  }, [chatId, reportReason, reportChat]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3 flex-shrink-0">
        <Button variant="ghost" size="icon-sm" onClick={() => router.push('/messages')}>
          <ArrowLeft className="w-5 h-5" />
        </Button>

        {/* Avatar */}
        <div className="w-9 h-9 rounded-full bg-gray-200 overflow-hidden flex-shrink-0">
          {otherAvatar ? (
            <img src={otherAvatar} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              {chat?.chat_type === 'group' ? (
                <Users className="w-4 h-4 text-gray-400" />
              ) : (
                <span className="text-sm font-medium text-gray-400">
                  {chatDisplayName[0]?.toUpperCase()}
                </span>
              )}
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <h2 className="font-semibold text-sm truncate">{chatDisplayName}</h2>
          {participants.length > 2 && (
            <p className="text-xs text-gray-400">{participants.length} members</p>
          )}
        </div>

        {/* Streak */}
        {streak && streak.streak_count > 0 && (
          <StreakDisplay streak={streak} compact />
        )}

        {/* Menu */}
        <div className="relative">
          <Button variant="ghost" size="icon-sm" onClick={() => setShowMenu(!showMenu)}>
            <MoreVertical className="w-5 h-5" />
          </Button>
          <AnimatePresence>
            {showMenu && (
              <motion.div
                className="absolute right-0 top-full mt-1 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20 min-w-[160px]"
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
              >
                <button
                  onClick={() => { setShowMenu(false); setShowReport(true); }}
                  className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                >
                  <Flag className="w-4 h-4" />
                  Report Chat
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Streak banner */}
      {streak && streak.streak_count > 0 && (
        <div className="px-4 pt-3">
          <StreakDisplay streak={streak} />
        </div>
      )}

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-16 h-16 rounded-full bg-indigo-50 flex items-center justify-center mb-4">
              <span className="text-3xl">👋</span>
            </div>
            <p className="text-gray-500 font-medium">Start the conversation!</p>
            <p className="text-sm text-gray-400 mt-1">Messages disappear after 24 hours unless saved.</p>
          </div>
        ) : (
          <div className="space-y-1">
            {messages.map((msg) => {
              const sender = participantMap.get(msg.sender_id);
              return (
                <ChatBubble
                  key={msg.id}
                  message={msg}
                  isOwn={msg.sender_id === userId}
                  senderName={chat?.chat_type === 'group' ? sender?.name : undefined}
                  senderAvatar={sender?.avatar}
                  onSave={saveMessage}
                  onView={markViewed}
                />
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input */}
      <ChatInput
        onSendText={handleSendText}
        onSendSticker={handleSendSticker}
      />

      {/* Report Dialog */}
      <Dialog open={showReport} onOpenChange={setShowReport}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <Flag className="w-5 h-5" />
              Report Chat
            </DialogTitle>
            <DialogDescription>
              Reports are reviewed by our safety team. Please describe the issue.
            </DialogDescription>
          </DialogHeader>
          <div className="py-2">
            <textarea
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
              placeholder="Describe what happened..."
              rows={4}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-indigo-300 resize-none"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowReport(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleReport}
              disabled={!reportReason.trim() || reporting}
            >
              {reporting ? 'Submitting...' : 'Submit Report'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
