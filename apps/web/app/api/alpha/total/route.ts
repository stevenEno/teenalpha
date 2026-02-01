import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { buildAlphaScore } from '@/lib/incentives';

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

    // Fetch quest points
    const { data: questProgress } = await supabase
      .from('user_quest_progress')
      .select('total_points, current_streak')
      .eq('user_id', user.id)
      .single();

    // Fetch ladder tokens (sum across all ladders)
    const { data: ladderMembers } = await supabase
      .from('ladder_members')
      .select('tokens')
      .eq('user_id', user.id);

    const totalTokens = ladderMembers?.reduce((sum, m) => sum + (m.tokens || 0), 0) ?? 0;

    // Fetch tracker stars (sum across all goals)
    const { data: ambitionGoals } = await supabase
      .from('ambition_goals')
      .select('total_stars')
      .eq('user_id', user.id);

    const totalStars = ambitionGoals?.reduce((sum, g) => sum + (g.total_stars || 0), 0) ?? 0;

    const alpha = buildAlphaScore(
      questProgress?.total_points ?? 0,
      totalTokens,
      totalStars,
      questProgress?.current_streak ?? 0,
    );

    return NextResponse.json(alpha);
  } catch (error: any) {
    console.error('Alpha total error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
