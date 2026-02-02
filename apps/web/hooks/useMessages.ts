'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import type { Message, Chat, ChatParticipant, ChatStreak } from '@teen-alpha/database';

interface UseMessagesReturn {
  messages: Message[];
  chat: Chat | null;
  participants: (ChatParticipant & { profiles?: { full_name: string | null; avatar_url: string | null } })[];
  streak: ChatStreak | null;
  loading: boolean;
  sendMessage: (content: string, type?: string, mediaUrl?: string, stickerKey?: string) => Promise<{ alphaEarned: number }>;
  markViewed: (messageId: string) => Promise<void>;
  saveMessage: (messageId: string) => Promise<void>;
  refetch: () => Promise<void>;
}

export function useMessages(chatId: string): UseMessagesReturn {
  const [messages, setMessages] = useState<Message[]>([]);
  const [chat, setChat] = useState<Chat | null>(null);
  const [participants, setParticipants] = useState<any[]>([]);
  const [streak, setStreak] = useState<ChatStreak | null>(null);
  const [loading, setLoading] = useState(true);
  const supabaseRef = useRef<ReturnType<typeof createBrowserClient> | null>(null);

  const refetch = useCallback(async () => {
    try {
      const res = await fetch(`/api/messages/${chatId}`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages || []);
        setChat(data.chat || null);
        setParticipants(data.participants || []);
        setStreak(data.streak || null);
      }
    } catch (error) {
      console.error('Failed to fetch messages:', error);
    } finally {
      setLoading(false);
    }
  }, [chatId]);

  // Initial fetch
  useEffect(() => {
    refetch();
  }, [refetch]);

  // Realtime subscription
  useEffect(() => {
    if (!chatId) return;

    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    );
    supabaseRef.current = supabase;

    const channel = supabase
      .channel(`chat:${chatId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `chat_id=eq.${chatId}`,
        },
        (payload) => {
          const newMessage = payload.new as Message;
          setMessages(prev => {
            if (prev.some(m => m.id === newMessage.id)) return prev;
            return [...prev, newMessage];
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `chat_id=eq.${chatId}`,
        },
        (payload) => {
          const updated = payload.new as Message;
          setMessages(prev => prev.map(m => m.id === updated.id ? updated : m));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [chatId]);

  const sendMessage = useCallback(async (
    content: string,
    type = 'text',
    mediaUrl?: string,
    stickerKey?: string
  ) => {
    const res = await fetch('/api/messages/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chatId, content, type, mediaUrl, stickerKey }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to send');

    if (data.streak) {
      setStreak(data.streak);
    }

    return { alphaEarned: data.alphaEarned || 0 };
  }, [chatId]);

  const markViewed = useCallback(async (messageId: string) => {
    await fetch('/api/messages/view', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messageId }),
    });
  }, []);

  const saveMessage = useCallback(async (messageId: string) => {
    // Save a message to prevent ephemeral deletion
    setMessages(prev =>
      prev.map(m => m.id === messageId ? { ...m, saved: true } : m)
    );
  }, []);

  return { messages, chat, participants, streak, loading, sendMessage, markViewed, saveMessage, refetch };
}
