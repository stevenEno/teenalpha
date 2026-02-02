'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Clock, Bookmark, Eye, Image as ImageIcon, Mic, Video, Check } from 'lucide-react';
import type { Message } from '@teen-alpha/database';

interface ChatBubbleProps {
  message: Message;
  isOwn: boolean;
  senderName?: string;
  senderAvatar?: string | null;
  onSave?: (messageId: string) => void;
  onView?: (messageId: string) => void;
}

function formatTimeLeft(expiresAt: string): string {
  const diff = new Date(expiresAt).getTime() - Date.now();
  if (diff <= 0) return 'Expired';
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  if (hours > 0) return `${hours}h ${mins}m`;
  return `${mins}m`;
}

const STICKER_MAP: Record<string, string> = {
  fire: '🔥', rocket: '🚀', star: '⭐', brain: '🧠',
  heart: '❤️', laugh: '😂', cool: '😎', flex: '💪',
  trophy: '🏆', sparkle: '✨', wave: '👋', clap: '👏',
  thinking: '🤔', check: '✅', party: '🎉', lightning: '⚡',
};

export function ChatBubble({ message, isOwn, senderName, senderAvatar, onSave, onView }: ChatBubbleProps) {
  const [timeLeft, setTimeLeft] = useState<string | null>(null);

  // Ephemeral countdown timer
  useEffect(() => {
    if (!message.expires_at || message.saved) return;
    const update = () => setTimeLeft(formatTimeLeft(message.expires_at!));
    update();
    const interval = setInterval(update, 60000);
    return () => clearInterval(interval);
  }, [message.expires_at, message.saved]);

  // Trigger view callback when message renders
  useEffect(() => {
    if (!isOwn && !message.viewed_at && onView) {
      onView(message.id);
    }
  }, [isOwn, message.viewed_at, message.id, onView]);

  const renderContent = () => {
    switch (message.message_type) {
      case 'sticker':
        return (
          <span className="text-5xl block text-center">
            {STICKER_MAP[message.content || ''] || message.content || '❓'}
          </span>
        );
      case 'image':
        return (
          <div className="space-y-1">
            {message.media_url ? (
              <img
                src={message.media_url}
                alt="Shared image"
                className="rounded-lg max-w-[240px] max-h-[240px] object-cover"
              />
            ) : (
              <div className="flex items-center gap-2 text-sm opacity-70">
                <ImageIcon className="w-4 h-4" /> Image
              </div>
            )}
            {message.content && <p className="text-sm">{message.content}</p>}
          </div>
        );
      case 'voice':
        return (
          <div className="flex items-center gap-2">
            <Mic className="w-4 h-4 flex-shrink-0" />
            <div className="flex-1">
              {message.media_url ? (
                <audio controls className="w-full max-w-[200px] h-8" src={message.media_url} />
              ) : (
                <span className="text-sm opacity-70">Voice message</span>
              )}
            </div>
          </div>
        );
      case 'video':
        return (
          <div className="space-y-1">
            {message.media_url ? (
              <video
                controls
                className="rounded-lg max-w-[240px] max-h-[180px]"
                src={message.media_url}
              />
            ) : (
              <div className="flex items-center gap-2 text-sm opacity-70">
                <Video className="w-4 h-4" /> Video
              </div>
            )}
            {message.content && <p className="text-sm">{message.content}</p>}
          </div>
        );
      default:
        return <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>;
    }
  };

  return (
    <motion.div
      className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-2`}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.15 }}
    >
      <div className={`flex gap-2 max-w-[75%] ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
        {/* Avatar */}
        {!isOwn && (
          <div className="flex-shrink-0 w-7 h-7 rounded-full bg-gray-200 overflow-hidden mt-1">
            {senderAvatar ? (
              <img src={senderAvatar} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-xs font-medium text-gray-500">
                {senderName?.[0]?.toUpperCase() || '?'}
              </div>
            )}
          </div>
        )}

        <div className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'}`}>
          {/* Sender name for group chats */}
          {!isOwn && senderName && (
            <span className="text-xs text-gray-500 mb-0.5 px-1">{senderName}</span>
          )}

          {/* Bubble */}
          <div
            className={`rounded-2xl px-3 py-2 ${
              message.message_type === 'sticker'
                ? 'bg-transparent'
                : isOwn
                  ? 'bg-indigo-500 text-white'
                  : 'bg-gray-100 text-gray-900'
            }`}
          >
            {renderContent()}
          </div>

          {/* Meta row: time, ephemeral timer, save, viewed */}
          <div className={`flex items-center gap-1.5 mt-0.5 px-1 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
            <span className="text-[10px] text-gray-400">
              {new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>

            {/* Ephemeral timer */}
            {timeLeft && !message.saved && (
              <span className="flex items-center gap-0.5 text-[10px] text-orange-500">
                <Clock className="w-3 h-3" />
                {timeLeft}
              </span>
            )}

            {/* Save button for ephemeral messages */}
            {!isOwn && message.expires_at && !message.saved && onSave && (
              <button
                onClick={() => onSave(message.id)}
                className="text-gray-400 hover:text-indigo-500 transition-colors"
                title="Save message"
              >
                <Bookmark className="w-3 h-3" />
              </button>
            )}

            {/* Saved indicator */}
            {message.saved && (
              <span className="text-[10px] text-indigo-500 flex items-center gap-0.5">
                <Bookmark className="w-3 h-3 fill-current" />
              </span>
            )}

            {/* Read receipt for own messages */}
            {isOwn && (
              <span className={`flex items-center ${message.viewed_at ? 'text-indigo-400' : 'text-gray-300'}`}>
                {message.viewed_at ? (
                  <Eye className="w-3 h-3" />
                ) : (
                  <Check className="w-3 h-3" />
                )}
              </span>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
