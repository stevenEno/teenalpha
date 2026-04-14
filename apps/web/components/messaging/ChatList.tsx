'use client';

import { motion } from 'framer-motion';
import { Users } from 'lucide-react';
import { StreakDisplay } from './StreakDisplay';
import type { ChatWithPreview } from '@teen-alpha/database';

interface ChatListProps {
  chats: ChatWithPreview[];
  currentUserId: string;
  onSelect: (chatId: string) => void;
  selectedChatId?: string;
}

function formatLastMessageTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Now';
  if (diffMins < 60) return `${diffMins}m`;
  if (diffHours < 24) return `${diffHours}h`;
  if (diffDays < 7) return `${diffDays}d`;
  return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

function getChatDisplayName(chat: ChatWithPreview, currentUserId: string): string {
  if (chat.name) return chat.name;
  if (chat.chat_type === 'one-on-one') {
    const other = chat.participants.find(p => p.user_id !== currentUserId);
    return other?.profile?.full_name || 'Unknown';
  }
  const names = chat.participants
    .filter(p => p.user_id !== currentUserId)
    .map(p => p.profile?.full_name?.split(' ')[0] || 'Unknown')
    .slice(0, 3);
  return names.join(', ') + (chat.participants.length > 4 ? '...' : '');
}

function getChatAvatar(chat: ChatWithPreview, currentUserId: string): string | null {
  if (chat.chat_type === 'one-on-one') {
    const other = chat.participants.find(p => p.user_id !== currentUserId);
    return other?.profile?.avatar_url || null;
  }
  return null;
}

function getLastMessagePreview(msg: ChatWithPreview['last_message'], currentUserId: string): string {
  if (!msg) return 'No messages yet';
  const prefix = msg.sender_id === currentUserId ? 'You: ' : '';
  switch (msg.message_type) {
    case 'sticker': return `${prefix}Sent a sticker`;
    case 'image': return `${prefix}Sent a photo`;
    case 'voice': return `${prefix}Voice message`;
    case 'video': return `${prefix}Sent a video`;
    default: {
      const text = msg.content || '';
      return `${prefix}${text.length > 40 ? text.slice(0, 40) + '...' : text}`;
    }
  }
}

export function ChatList({ chats, currentUserId, onSelect, selectedChatId }: ChatListProps) {
  if (chats.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
        <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
          <Users className="w-8 h-8 text-gray-400" />
        </div>
        <p className="text-gray-500 font-medium mb-1">No conversations yet</p>
        <p className="text-sm text-gray-400">Start a chat with another teen!</p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-gray-100">
      {chats.map((chat, index) => {
        const displayName = getChatDisplayName(chat, currentUserId);
        const avatar = getChatAvatar(chat, currentUserId);
        const preview = getLastMessagePreview(chat.last_message, currentUserId);
        const isSelected = selectedChatId === chat.id;

        return (
          <motion.button
            key={chat.id}
            onClick={() => onSelect(chat.id)}
            className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
              isSelected ? 'bg-[#FF6B35]/5' : 'hover:bg-gray-50'
            }`}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.03 }}
          >
            {/* Avatar */}
            <div className="relative flex-shrink-0">
              <div className="w-12 h-12 rounded-full bg-gray-200 overflow-hidden">
                {avatar ? (
                  <img src={avatar} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    {chat.chat_type === 'group' ? (
                      <Users className="w-5 h-5 text-gray-400" />
                    ) : (
                      <span className="text-lg font-medium text-gray-400">
                        {displayName[0]?.toUpperCase()}
                      </span>
                    )}
                  </div>
                )}
              </div>
              {/* Unread badge */}
              {chat.unread_count > 0 && (
                <div className="absolute -top-1 -right-1 min-w-[18px] h-[18px] rounded-full bg-[#FF6B35]/50 text-white text-[10px] font-bold flex items-center justify-center px-1">
                  {chat.unread_count > 99 ? '99+' : chat.unread_count}
                </div>
              )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <span className={`font-medium text-sm truncate ${chat.unread_count > 0 ? 'text-gray-900' : 'text-gray-700'}`}>
                  {displayName}
                </span>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  {chat.streak && chat.streak.streak_count > 0 && (
                    <StreakDisplay streak={chat.streak} compact />
                  )}
                  {chat.last_message && (
                    <span className="text-[10px] text-gray-400">
                      {formatLastMessageTime(chat.last_message.created_at)}
                    </span>
                  )}
                </div>
              </div>
              <p className={`text-xs truncate mt-0.5 ${chat.unread_count > 0 ? 'text-gray-600 font-medium' : 'text-gray-400'}`}>
                {preview}
              </p>
            </div>
          </motion.button>
        );
      })}
    </div>
  );
}
