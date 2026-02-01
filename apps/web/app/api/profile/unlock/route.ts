import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { buildAlphaScore, UNLOCK_COSTS } from '@/lib/incentives';

export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const { unlock_type, unlock_key } = body;

    if (!unlock_type || !unlock_key) {
      return NextResponse.json({ error: 'Missing unlock_type or unlock_key' }, { status: 400 });
    }

    const cost = UNLOCK_COSTS[unlock_type];
    if (cost === undefined) {
      return NextResponse.json({ error: 'Invalid unlock type' }, { status: 400 });
    }

    // Check if already unlocked
    const { data: existing } = await supabase
      .from('profile_unlocks')
      .select('id')
      .eq('user_id', user.id)
      .eq('unlock_type', unlock_type)
      .eq('unlock_key', unlock_key)
      .single();

    if (existing) {
      return NextResponse.json({ error: 'Already unlocked' }, { status: 400 });
    }

    // Compute total Alpha (same as /api/alpha/total)
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
    const { data: existingUnlocks } = await supabase
      .from('profile_unlocks')
      .select('alpha_cost')
      .eq('user_id', user.id);

    const totalSpent = existingUnlocks?.reduce((sum, u) => sum + u.alpha_cost, 0) ?? 0;
    const available = alpha.total - totalSpent;

    if (available < cost) {
      return NextResponse.json({
        error: 'Not enough Alpha',
        available,
        cost,
      }, { status: 400 });
    }

    // Insert unlock
    const { data: unlock, error } = await supabase
      .from('profile_unlocks')
      .insert({
        user_id: user.id,
        unlock_type,
        unlock_key,
        alpha_cost: cost,
      })
      .select()
      .single();

    if (error) {
      console.error('Profile unlock error:', error);
      return NextResponse.json({ error: 'Failed to unlock' }, { status: 500 });
    }

    return NextResponse.json({
      unlock,
      balance: {
        total: alpha.total,
        spent: totalSpent + cost,
        available: available - cost,
      },
    });
  } catch (error: any) {
    console.error('Profile unlock error:', error);
    return NextResponse.json({ error: error.message || 'Failed to process unlock' }, { status: 500 });
  }
}
