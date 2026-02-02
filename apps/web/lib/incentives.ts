// Shared utilities for incentive systems

import type { AlphaScore } from '@teen-alpha/database';

export type IncentiveSystem = 'quest' | 'ladder' | 'tracker';

// Alpha conversion rates
const ALPHA_RATES: Record<IncentiveSystem, number> = {
  quest: 1,
  ladder: 5,
  tracker: 3,
};

/**
 * Convert system-specific points/tokens/stars to Alpha.
 */
export function convertToAlpha(source: IncentiveSystem, amount: number): number {
  return Math.round(amount * ALPHA_RATES[source]);
}

/**
 * Calculate Alpha level from total Alpha points.
 * Scaling thresholds: 100, 150, 200, 250, ...
 */
export function calculateAlphaLevel(totalAlpha: number): { level: number; progress: number; toNext: number } {
  let alpha = totalAlpha;
  let level = 1;
  let threshold = 100;

  while (alpha >= threshold) {
    alpha -= threshold;
    level++;
    threshold = 100 + (level - 1) * 50;
  }

  const progress = threshold > 0 ? alpha / threshold : 0;
  return { level, progress, toNext: threshold - alpha };
}

/**
 * Get rank title based on Alpha level.
 */
export function getAlphaRank(level: number): string {
  if (level >= 20) return 'Legendary';
  if (level >= 12) return 'Champion';
  if (level >= 6) return 'Trailblazer';
  if (level >= 3) return 'Rising Star';
  return 'Newcomer';
}

/**
 * Build a full AlphaScore from raw values.
 */
export function buildAlphaScore(
  questPoints: number,
  ladderTokens: number,
  trackerStars: number,
  streak: number,
): AlphaScore {
  const fromQuests = convertToAlpha('quest', questPoints);
  const fromLadders = convertToAlpha('ladder', ladderTokens);
  const fromTracker = convertToAlpha('tracker', trackerStars);
  const total = fromQuests + fromLadders + fromTracker;
  const { level, progress } = calculateAlphaLevel(total);
  return { total, fromQuests, fromLadders, fromTracker, level, levelProgress: progress, streak };
}

/**
 * Calculate quest points based on difficulty and discomfort rating.
 * Base: difficulty * 10, with +50% bonus for discomfort ratings of 4-5.
 */
export function calculatePoints(baseDifficulty: number, discomfortRating: number): number {
  const base = baseDifficulty * 10;
  const bonus = getDiscomfortBonus(discomfortRating);
  return Math.round(base * bonus);
}

/**
 * Calculate stars for ambition tracker.
 * Base from difficulty, multiplied by effort rating and streak bonus.
 */
export function calculateStars(
  difficulty: number,
  effortRating: number,
  consecutiveCompletedDays: number
): number {
  const base = difficulty * 2;
  const effortMultiplier = effortRating >= 4 ? 1.5 : 1;
  const streakBonus = consecutiveCompletedDays >= 3 ? 1.25 : 1;
  return Math.round(base * effortMultiplier * streakBonus);
}

/**
 * Calculate tokens for challenge ladder completions.
 * Base 10 tokens, doubled for hard-mode challenges.
 */
export function calculateTokens(difficulty: 'normal' | 'hard', discomfortRating: number): number {
  const base = difficulty === 'hard' ? 20 : 10;
  const bonus = getDiscomfortBonus(discomfortRating);
  return Math.round(base * bonus);
}

/**
 * Check if a user has leveled up. Every 100 points = new level.
 */
export function checkLevelUp(totalPoints: number): { level: number; leveledUp: boolean; pointsToNext: number } {
  const level = Math.floor(totalPoints / 100) + 1;
  const pointsToNext = 100 - (totalPoints % 100);
  return { level, leveledUp: totalPoints > 0 && totalPoints % 100 === 0, pointsToNext };
}

/**
 * Get discomfort bonus multiplier. Ratings of 4-5 get +50%.
 */
export function getDiscomfortBonus(rating: number): number {
  return rating >= 4 ? 1.5 : 1;
}

// Chat streak Alpha rewards
export const CHAT_STREAK_ALPHA = 10; // Alpha per streak day
export const CHAT_STREAK_MILESTONES: Record<number, number> = {
  7: 50,   // 7-day streak bonus
  14: 100, // 14-day streak bonus
  30: 250, // 30-day streak bonus
};

// Profile unlock costs (in Alpha)
export const UNLOCK_COSTS: Record<string, number> = {
  badge_slot: 50,
  widget_slot: 150,
  effect: 300,
  premium_music: 500,
  font: 100,
  bg_overlay: 200,
  premium_preset: 75,
};

/**
 * Log an incentive event via the events API.
 */
export async function logIncentiveEvent(
  system: IncentiveSystem,
  eventType: string,
  metadata?: Record<string, unknown>
): Promise<void> {
  try {
    await fetch('/api/incentive/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ system, eventType, metadata: metadata || {} }),
    });
  } catch (error) {
    console.error('Failed to log incentive event:', error);
  }
}
