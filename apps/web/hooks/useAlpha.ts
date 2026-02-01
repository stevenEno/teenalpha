'use client';

import { useState, useEffect, useCallback } from 'react';
import type { AlphaScore } from '@teen-alpha/database';

export function useAlpha() {
  const [alpha, setAlpha] = useState<AlphaScore | null>(null);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/alpha/total');
      if (res.ok) {
        const data = await res.json();
        setAlpha(data);
      }
    } catch (error) {
      console.error('Failed to fetch alpha:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { alpha, loading, refetch };
}
