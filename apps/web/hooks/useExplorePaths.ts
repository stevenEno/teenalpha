'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import type { ExplorePath, ExploreStep } from '@teen-alpha/database';
import { trackExploreEvent } from '@/lib/ab-testing';
import { useGuestOnboarding } from './useGuestOnboarding';

// Path summary (what we get initially - fast)
interface PathSummary {
  id: string;
  name: string;
  icon: string;
  tagline: string;
  connection: string;
  moneyPath: string;
  // These are undefined until details are loaded
  steps?: ExploreStep[];
  skills?: string[];
  tools?: string[];
}

interface UseExplorePathsReturn {
  // State
  paths: PathSummary[] | null;
  interest: string | null;
  selectedPathIndex: number | null;
  isGenerating: boolean;
  isLoadingDetails: number | null; // Index of path currently loading details
  isSyncing: boolean;
  error: string | null;

  // Actions
  generatePaths: (interest: string) => Promise<boolean>;
  loadPathDetails: (index: number) => Promise<boolean>;
  selectPath: (index: number) => void;
  syncToAccount: () => Promise<{ projectId: string; alphaAwarded: number } | null>;
  reset: () => void;

  // Helpers
  getSelectedPath: () => PathSummary | null;
  hasSelectedPath: boolean;
  hasPathDetails: (index: number) => boolean;
}

export function useExplorePaths(): UseExplorePathsReturn {
  const router = useRouter();
  const guest = useGuestOnboarding();
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoadingDetails, setIsLoadingDetails] = useState<number | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generatePaths = useCallback(async (interest: string): Promise<boolean> => {
    setIsGenerating(true);
    setError(null);

    try {
      // Track interest submission
      trackExploreEvent('interest_submitted', { interest });

      // Save interest to guest storage
      guest.setInterest(interest);

      const response = await fetch('/api/explore/generate-paths', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          interest,
          visitorId: guest.visitorId,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to generate paths');
      }

      // Save path summaries to guest storage
      guest.setPaths(result.paths);

      // Track paths generated
      trackExploreEvent('paths_generated', {
        interest,
        pathCount: result.paths.length,
        pathNames: result.paths.map((p: PathSummary) => p.name),
      });

      return true;
    } catch (err: any) {
      setError(err.message);
      return false;
    } finally {
      setIsGenerating(false);
    }
  }, [guest]);

  // Load detailed steps/skills/tools for a specific path (on-demand)
  const loadPathDetails = useCallback(async (index: number): Promise<boolean> => {
    const paths = guest.paths;
    if (!paths || !paths[index] || !guest.interest) {
      return false;
    }

    const path = paths[index];

    // Already has details loaded
    if (path.steps && path.steps.length > 0) {
      return true;
    }

    setIsLoadingDetails(index);
    setError(null);

    try {
      const response = await fetch('/api/explore/generate-path-details', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          interest: guest.interest,
          pathName: path.name,
          pathTagline: path.tagline,
          pathConnection: path.connection,
          moneyPath: path.moneyPath,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to load path details');
      }

      // Update the path with details
      const updatedPaths = [...paths];
      updatedPaths[index] = {
        ...path,
        steps: result.details.steps,
        skills: result.details.skills,
        tools: result.details.tools,
      };

      // Save updated paths to guest storage
      guest.setPaths(updatedPaths as ExplorePath[]);

      return true;
    } catch (err: any) {
      setError(err.message);
      return false;
    } finally {
      setIsLoadingDetails(null);
    }
  }, [guest]);

  const selectPath = useCallback((index: number) => {
    guest.setSelectedPath(index);

    const path = guest.paths?.[index];
    if (path) {
      trackExploreEvent('path_selected', {
        pathIndex: index,
        pathName: path.name,
      });
    }
  }, [guest]);

  const syncToAccount = useCallback(async (): Promise<{ projectId: string; alphaAwarded: number } | null> => {
    if (!guest.interest || !guest.paths || guest.selectedPathIndex === null) {
      setError('Missing explore data to sync');
      return null;
    }

    setIsSyncing(true);
    setError(null);

    try {
      const response = await fetch('/api/explore/sync-guest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          interest: guest.interest,
          selectedPathIndex: guest.selectedPathIndex,
          paths: guest.paths,
          visitorId: guest.visitorId,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to sync data');
      }

      // Track sync completion
      trackExploreEvent('explore_signup_completed', {
        projectId: result.projectId,
        alphaAwarded: result.alphaAwarded,
      });

      if (result.alphaAwarded > 0) {
        trackExploreEvent('alpha_awarded', {
          amount: result.alphaAwarded,
          source: 'explore_onboarding',
        });
      }

      // Clear guest data after successful sync
      guest.clearData();

      return {
        projectId: result.projectId,
        alphaAwarded: result.alphaAwarded,
      };
    } catch (err: any) {
      setError(err.message);
      return null;
    } finally {
      setIsSyncing(false);
    }
  }, [guest]);

  const reset = useCallback(() => {
    guest.clearData();
    setError(null);
  }, [guest]);

  const getSelectedPath = useCallback((): PathSummary | null => {
    return guest.getSelectedPath() as PathSummary | null;
  }, [guest]);

  const hasPathDetails = useCallback((index: number): boolean => {
    const path = guest.paths?.[index];
    return !!(path?.steps && path.steps.length > 0);
  }, [guest.paths]);

  return {
    // State from guest storage
    paths: guest.paths as PathSummary[] | null,
    interest: guest.interest,
    selectedPathIndex: guest.selectedPathIndex,
    isGenerating,
    isLoadingDetails,
    isSyncing,
    error,

    // Actions
    generatePaths,
    loadPathDetails,
    selectPath,
    syncToAccount,
    reset,

    // Helpers
    getSelectedPath,
    hasSelectedPath: guest.selectedPathIndex !== null,
    hasPathDetails,
  };
}
