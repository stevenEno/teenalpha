'use client';

import { useState, useEffect, useCallback } from 'react';
import type { ExplorePath } from '@teen-alpha/database';
import {
  getVisitorId,
  getGuestInterest,
  saveGuestInterest,
  getGuestPaths,
  saveGuestPaths,
  getSelectedPathIndex,
  saveSelectedPathIndex,
  getExploreVariant,
  clearGuestExploreData,
  hasGuestExploreData,
} from '@/lib/guest-storage';

interface GuestOnboardingState {
  visitorId: string;
  interest: string | null;
  paths: ExplorePath[] | null;
  selectedPathIndex: number | null;
  variant: 'mindmap' | 'list';
  hasData: boolean;
  isLoading: boolean;
}

export function useGuestOnboarding() {
  const [state, setState] = useState<GuestOnboardingState>({
    visitorId: '',
    interest: null,
    paths: null,
    selectedPathIndex: null,
    variant: 'mindmap',
    hasData: false,
    isLoading: true,
  });

  // Load initial state from localStorage
  useEffect(() => {
    setState({
      visitorId: getVisitorId(),
      interest: getGuestInterest(),
      paths: getGuestPaths(),
      selectedPathIndex: getSelectedPathIndex(),
      variant: getExploreVariant(),
      hasData: hasGuestExploreData(),
      isLoading: false,
    });
  }, []);

  const setInterest = useCallback((interest: string) => {
    saveGuestInterest(interest);
    setState((prev) => ({
      ...prev,
      interest,
    }));
  }, []);

  const setPaths = useCallback((paths: ExplorePath[]) => {
    saveGuestPaths(paths);
    setState((prev) => ({
      ...prev,
      paths,
    }));
  }, []);

  const setSelectedPath = useCallback((index: number) => {
    saveSelectedPathIndex(index);
    setState((prev) => ({
      ...prev,
      selectedPathIndex: index,
      hasData: !!prev.interest && !!prev.paths,
    }));
  }, []);

  const clearData = useCallback(() => {
    clearGuestExploreData();
    setState((prev) => ({
      ...prev,
      interest: null,
      paths: null,
      selectedPathIndex: null,
      hasData: false,
    }));
  }, []);

  const getSelectedPath = useCallback((): ExplorePath | null => {
    if (state.paths && state.selectedPathIndex !== null) {
      return state.paths[state.selectedPathIndex] || null;
    }
    return null;
  }, [state.paths, state.selectedPathIndex]);

  return {
    ...state,
    setInterest,
    setPaths,
    setSelectedPath,
    clearData,
    getSelectedPath,
  };
}
