'use client';

import { useState, useEffect, useCallback } from 'react';
import type { DiscoveredTeen } from '@teen-alpha/database';

const PAGE_SIZE = 20;

export function useTeenDiscover() {
  const [teens, setTeens] = useState<DiscoveredTeen[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(false);
  const [total, setTotal] = useState(0);
  const [isFallback, setIsFallback] = useState(false);
  const [offset, setOffset] = useState(0);

  const fetchTeens = useCallback(async (currentOffset: number, append: boolean) => {
    try {
      if (!append) setLoading(true);
      const res = await fetch(`/api/teens/discover?limit=${PAGE_SIZE}&offset=${currentOffset}`);
      if (res.ok) {
        const data = await res.json();
        const fetched: DiscoveredTeen[] = data.teens || [];
        setTeens(prev => append ? [...prev, ...fetched] : fetched);
        setTotal(data.total || 0);
        setHasMore(data.hasMore || false);
        setIsFallback(data.fallback || false);
      }
    } catch (error) {
      console.error('Failed to fetch teen recommendations:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTeens(0, false);
  }, [fetchTeens]);

  const loadMore = useCallback(() => {
    const nextOffset = offset + PAGE_SIZE;
    setOffset(nextOffset);
    fetchTeens(nextOffset, true);
  }, [offset, fetchTeens]);

  const refresh = useCallback(() => {
    setOffset(0);
    fetchTeens(0, false);
  }, [fetchTeens]);

  return { teens, loading, hasMore, total, isFallback, loadMore, refresh };
}
