'use client';

import { useState, useEffect, useCallback } from 'react';
import type { ChatWithPreview } from '@teen-alpha/database';

export function useChats() {
  const [chats, setChats] = useState<ChatWithPreview[]>([]);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    try {
      const res = await fetch('/api/chats');
      if (res.ok) {
        const data = await res.json();
        setChats(data.chats || []);
      }
    } catch (error) {
      console.error('Failed to fetch chats:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refetch();
  }, [refetch]);

  const startChat = useCallback(async (
    type: 'one-on-one' | 'group',
    participants: string[],
    name?: string
  ) => {
    const res = await fetch('/api/chats/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, participants, name }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to start chat');
    await refetch();
    return data;
  }, [refetch]);

  const reportChat = useCallback(async (chatId: string, reason: string) => {
    const res = await fetch('/api/chats/report', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chatId, reason }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to report chat');
    return data;
  }, []);

  const totalUnread = chats.reduce((sum, c) => sum + c.unread_count, 0);

  return { chats, loading, refetch, startChat, reportChat, totalUnread };
}
