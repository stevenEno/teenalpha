import type { SupabaseClient } from '@supabase/supabase-js';

interface StreakRow {
  user_id: string;
  current_streak: number;
  longest_streak: number;
  last_active_date: string | null;
  timezone: string;
}

/**
 * Record a qualifying action for the streak. Lazy evaluation:
 * - Same day → no-op (changed: false)
 * - Yesterday → increment (changed: true)
 * - Older → reset to 1 (changed: true)
 * Returns the updated streak count and whether the streak changed.
 *
 * TODO: Uses UTC dates — fine for v1 (US Pacific users), but should
 * use the stored `timezone` column for accurate day boundaries.
 */
export async function recordStreakAction(
  supabase: SupabaseClient,
  userId: string
): Promise<{ streak: number; changed: boolean }> {
  const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

  const { data: existing } = await supabase
    .from('streaks')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (!existing) {
    await supabase.from('streaks').insert({
      user_id: userId,
      current_streak: 1,
      longest_streak: 1,
      last_active_date: today,
    });
    return { streak: 1, changed: true };
  }

  const row = existing as StreakRow;
  if (row.last_active_date === today) return { streak: row.current_streak, changed: false };

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().slice(0, 10);

  let newStreak: number;
  if (row.last_active_date === yesterdayStr) {
    newStreak = row.current_streak + 1;
  } else {
    newStreak = 1;
  }

  const newLongest = Math.max(newStreak, row.longest_streak);

  await supabase
    .from('streaks')
    .update({
      current_streak: newStreak,
      longest_streak: newLongest,
      last_active_date: today,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId);

  return { streak: newStreak, changed: true };
}

/**
 * Read the current streak, recalculating if the stored date is stale.
 * Used by the StreakBadge component to show an accurate count without
 * waiting for the teen's next action.
 */
export async function getAccurateStreak(
  supabase: SupabaseClient,
  userId: string
): Promise<{ current: number; longest: number }> {
  const { data } = await supabase
    .from('streaks')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (!data) return { current: 0, longest: 0 };

  const row = data as StreakRow;
  const today = new Date().toISOString().slice(0, 10);
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().slice(0, 10);

  if (row.last_active_date === today || row.last_active_date === yesterdayStr) {
    return { current: row.current_streak, longest: row.longest_streak };
  }

  // Streak is broken (last active > 1 day ago). Don't write — just report 0.
  return { current: 0, longest: row.longest_streak };
}

const MILESTONES = [7, 14, 30, 100];

export function checkMilestone(streak: number): number | null {
  return MILESTONES.includes(streak) ? streak : null;
}
