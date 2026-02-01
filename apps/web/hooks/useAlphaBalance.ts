'use client';

import { useState, useEffect, useCallback } from 'react';

interface AlphaBalance {
  total: number;
  spent: number;
  available: number;
  level: number;
  rank: string;
}

export function useAlphaBalance() {
  const [balance, setBalance] = useState<AlphaBalance | null>(null);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    try {
      const res = await fetch('/api/profile/alpha-balance');
      if (res.ok) {
        const data = await res.json();
        setBalance(data);
      }
    } catch (error) {
      console.error('Failed to fetch alpha balance:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return {
    total: balance?.total ?? 0,
    spent: balance?.spent ?? 0,
    available: balance?.available ?? 0,
    level: balance?.level ?? 1,
    rank: balance?.rank ?? 'Newcomer',
    loading,
    refetch,
  };
}
