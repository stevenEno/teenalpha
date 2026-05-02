// Guest localStorage utilities for explore onboarding flow

import type { ExplorePath } from '@teen-alpha/database';

const KEYS = {
  INTEREST: 'ta_explore_interest',
  PATHS: 'ta_explore_paths',
  SELECTED: 'ta_explore_selected',
  VISITOR_ID: 'ta_visitor_id',
  VARIANT: 'ta_explore_variant',
} as const;

/**
 * Check if localStorage is available
 */
function isStorageAvailable(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const test = '__test__';
    localStorage.setItem(test, test);
    localStorage.removeItem(test);
    return true;
  } catch {
    return false;
  }
}

/**
 * Get or create a visitor ID for guest users
 */
export function getVisitorId(): string {
  if (!isStorageAvailable()) return '';

  let visitorId = localStorage.getItem(KEYS.VISITOR_ID);
  if (!visitorId) {
    visitorId = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
    localStorage.setItem(KEYS.VISITOR_ID, visitorId);
  }
  // Also set as a cookie so the server can read it after email verification
  // opens in a new tab (where localStorage is empty). Cookies are shared across tabs.
  try {
    document.cookie = `ta_visitor_id=${visitorId}; path=/; max-age=${60 * 60 * 24 * 30}; SameSite=Lax`;
  } catch {}
  return visitorId;
}

/**
 * Save the user's interest to localStorage
 */
export function saveGuestInterest(interest: string): void {
  if (!isStorageAvailable()) return;
  localStorage.setItem(KEYS.INTEREST, interest);
}

/**
 * Get the saved guest interest
 */
export function getGuestInterest(): string | null {
  if (!isStorageAvailable()) return null;
  return localStorage.getItem(KEYS.INTEREST);
}

/**
 * Save generated paths to localStorage
 */
export function saveGuestPaths(paths: ExplorePath[]): void {
  if (!isStorageAvailable()) return;
  localStorage.setItem(KEYS.PATHS, JSON.stringify(paths));
}

/**
 * Get saved guest paths
 */
export function getGuestPaths(): ExplorePath[] | null {
  if (!isStorageAvailable()) return null;
  const stored = localStorage.getItem(KEYS.PATHS);
  if (!stored) return null;
  try {
    return JSON.parse(stored) as ExplorePath[];
  } catch {
    return null;
  }
}

/**
 * Save the selected path index
 */
export function saveSelectedPathIndex(index: number): void {
  if (!isStorageAvailable()) return;
  localStorage.setItem(KEYS.SELECTED, String(index));
}

/**
 * Get the selected path index
 */
export function getSelectedPathIndex(): number | null {
  if (!isStorageAvailable()) return null;
  const stored = localStorage.getItem(KEYS.SELECTED);
  if (stored === null) return null;
  const index = parseInt(stored, 10);
  return isNaN(index) ? null : index;
}

/**
 * Save the A/B test variant
 */
export function saveExploreVariant(variant: 'mindmap' | 'list'): void {
  if (!isStorageAvailable()) return;
  localStorage.setItem(KEYS.VARIANT, variant);
}

/**
 * Get the A/B test variant
 */
export function getExploreVariant(): 'mindmap' | 'list' {
  if (!isStorageAvailable()) return 'mindmap';
  const variant = localStorage.getItem(KEYS.VARIANT);
  return variant === 'list' ? 'list' : 'mindmap';
}

/**
 * Get all guest explore data at once
 */
export function getGuestExploreData(): {
  interest: string | null;
  paths: ExplorePath[] | null;
  selectedPathIndex: number | null;
  visitorId: string;
  variant: 'mindmap' | 'list';
} {
  return {
    interest: getGuestInterest(),
    paths: getGuestPaths(),
    selectedPathIndex: getSelectedPathIndex(),
    visitorId: getVisitorId(),
    variant: getExploreVariant(),
  };
}

/**
 * Check if guest has completed the explore flow
 */
export function hasGuestExploreData(): boolean {
  const { interest, paths, selectedPathIndex } = getGuestExploreData();
  return !!interest && !!paths && selectedPathIndex !== null;
}

/**
 * Clear all guest explore data (after signup conversion)
 */
export function clearGuestExploreData(): void {
  if (!isStorageAvailable()) return;
  localStorage.removeItem(KEYS.INTEREST);
  localStorage.removeItem(KEYS.PATHS);
  localStorage.removeItem(KEYS.SELECTED);
  // Keep visitor ID and variant for analytics
}
