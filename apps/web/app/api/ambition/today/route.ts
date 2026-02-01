import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
        },
      }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get active goal
    const { data: goal } = await supabase
      .from('ambition_goals')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single();

    if (!goal) {
      return NextResponse.json({ goal: null, tracks: [], todayTrack: null });
    }

    // Get all tracks
    const { data: tracks } = await supabase
      .from('daily_tracks')
      .select('*')
      .eq('goal_id', goal.id)
      .order('day_number', { ascending: true });

    // Calculate today's day number
    const weekStart = new Date(goal.week_start);
    const today = new Date();
    const diffMs = today.getTime() - weekStart.getTime();
    const dayNumber = Math.min(7, Math.max(1, Math.floor(diffMs / (1000 * 60 * 60 * 24)) + 1));

    const todayTrack = (tracks || []).find((t: any) => t.day_number === dayNumber) || null;

    // Summary stats
    const completedTracks = (tracks || []).filter((t: any) => t.status === 'completed');
    const totalStars = goal.total_stars || 0;
    const completedCount = completedTracks.length;

    // Calculate consecutive completed days for streak
    let consecutiveDays = 0;
    for (let d = dayNumber - 1; d >= 1; d--) {
      const track = (tracks || []).find((t: any) => t.day_number === d);
      if (track?.status === 'completed') {
        consecutiveDays++;
      } else {
        break;
      }
    }

    return NextResponse.json({
      goal,
      tracks: tracks || [],
      todayTrack,
      dayNumber,
      stats: {
        totalStars,
        completedCount,
        consecutiveDays,
      },
    });
  } catch (error: any) {
    console.error('Get ambition today error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
