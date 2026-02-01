import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { buildAlphaScore, getAlphaRank } from '@/lib/incentives';

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

    // Compute total Alpha (same aggregation as /api/alpha/total)
    const { data: questProgress } = await supabase
      .from('user_quest_progress')
      .select('total_points, current_streak')
      .eq('user_id', user.id)
      .single();

    const { data: ladderMembers } = await supabase
      .from('ladder_members')
      .select('tokens')
      .eq('user_id', user.id);

    const totalTokens = ladderMembers?.reduce((sum, m) => sum + (m.tokens || 0), 0) ?? 0;

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

    // Sum existing unlock costs
    const { data: unlocks } = await supabase
      .from('profile_unlocks')
      .select('alpha_cost')
      .eq('user_id', user.id);

    const spent = unlocks?.reduce((sum, u) => sum + u.alpha_cost, 0) ?? 0;

    return NextResponse.json({
      total: alpha.total,
      spent,
      available: alpha.total - spent,
      level: alpha.level,
      rank: getAlphaRank(alpha.level),
    });
  } catch (error: any) {
    console.error('Alpha balance error:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch balance' }, { status: 500 });
  }
}
