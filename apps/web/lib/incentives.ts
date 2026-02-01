// Shared utilities for incentive systems

export type IncentiveSystem = 'quest' | 'ladder' | 'tracker';

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
