'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { hasGuestExploreData, getGuestExploreData, clearGuestExploreData } from '@/lib/guest-storage';
import { trackExploreEvent } from '@/lib/ab-testing';

/**
 * Client component that syncs guest explore data after authentication.
 * Renders nothing — runs once on mount and redirects to /dashboard on success.
 */
export function GuestDataSyncer() {
  const router = useRouter();
  const hasSynced = useRef(false);

  useEffect(() => {
    if (hasSynced.current) return;
    if (!hasGuestExploreData()) return;

    hasSynced.current = true;

    const sync = async () => {
      try {
        const { interest, paths, selectedPathIndex, visitorId } = getGuestExploreData();

        if (!interest || !paths || selectedPathIndex === null) return;

        const response = await fetch('/api/explore/sync-guest', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            interest,
            selectedPathIndex,
            paths,
            visitorId,
          }),
        });

        const result = await response.json();

        if (response.ok && result.success) {
          trackExploreEvent('explore_signup_completed', {
            projectId: result.projectId,
            alphaAwarded: result.alphaAwarded,
          });

          clearGuestExploreData();
          router.push('/dashboard');
        }
        // On failure, keep data in localStorage for retry on next page load
      } catch (error) {
        console.error('GuestDataSyncer: failed to sync', error);
        // Keep data for retry
      }
    };

    sync();
  }, [router]);

  return null;
}
