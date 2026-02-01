'use client';

import { useState, useEffect, useCallback } from 'react';
import type { ProfileCustomization, ProfileUnlock } from '@teen-alpha/database';

export function useProfileCustomization() {
  const [customization, setCustomization] = useState<ProfileCustomization | null>(null);
  const [unlocks, setUnlocks] = useState<ProfileUnlock[]>([]);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    try {
      const res = await fetch('/api/profile/customization');
      if (res.ok) {
        const data = await res.json();
        setCustomization(data.customization);
        setUnlocks(data.unlocks || []);
      }
    } catch (error) {
      console.error('Failed to fetch profile customization:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refetch();
  }, [refetch]);

  const update = useCallback(async (partial: Partial<ProfileCustomization>) => {
    try {
      const res = await fetch('/api/profile/customization', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(partial),
      });
      if (res.ok) {
        const data = await res.json();
        setCustomization(data.customization);
        return data.customization;
      }
      const err = await res.json();
      throw new Error(err.error || 'Failed to update');
    } catch (error) {
      console.error('Failed to update profile customization:', error);
      throw error;
    }
  }, []);

  const unlock = useCallback(async (unlock_type: string, unlock_key: string) => {
    try {
      const res = await fetch('/api/profile/unlock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ unlock_type, unlock_key }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to unlock');
      }
      await refetch();
      return data;
    } catch (error) {
      console.error('Failed to unlock:', error);
      throw error;
    }
  }, [refetch]);

  const hasUnlock = useCallback((type: string, key: string) => {
    return unlocks.some(u => u.unlock_type === type && u.unlock_key === key);
  }, [unlocks]);

  return { customization, unlocks, loading, update, unlock, hasUnlock, refetch };
}
