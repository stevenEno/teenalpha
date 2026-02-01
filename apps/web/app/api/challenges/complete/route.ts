import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { calculateTokens } from '@/lib/incentives';

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
    const { challengeId, proof, discomfort } = body;

    if (!challengeId || !proof || !discomfort) {
      return NextResponse.json({ error: 'Missing required fields: challengeId, proof, discomfort' }, { status: 400 });
    }

    // Get the challenge
    const { data: challenge } = await supabase
      .from('challenges')
      .select('*')
      .eq('id', challengeId)
      .single();

    if (!challenge) {
      return NextResponse.json({ error: 'Challenge not found' }, { status: 404 });
    }

    // Check not already completed by this user
    const { data: existing } = await supabase
      .from('challenge_completions')
      .select('id')
      .eq('challenge_id', challengeId)
      .eq('user_id', user.id)
      .single();

    if (existing) {
      return NextResponse.json({ error: 'Already completed this challenge' }, { status: 400 });
    }

    // Calculate tokens
    const tokens = calculateTokens(challenge.difficulty as 'normal' | 'hard', discomfort);

    // Insert completion
    const { error: insertError } = await supabase
      .from('challenge_completions')
      .insert({
        challenge_id: challengeId,
        user_id: user.id,
        proof_text: proof,
        discomfort_rating: discomfort,
        tokens_earned: tokens,
      });

    if (insertError) {
      console.error('Insert completion error:', insertError);
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    // Update member tokens
    const { data: membership } = await supabase
      .from('ladder_members')
      .select('tokens')
      .eq('ladder_id', challenge.ladder_id)
      .eq('user_id', user.id)
      .single();

    await supabase
      .from('ladder_members')
      .update({ tokens: (membership?.tokens || 0) + tokens })
      .eq('ladder_id', challenge.ladder_id)
      .eq('user_id', user.id);

    // Check if >=80% of members completed — advance day
    const { count: memberCount } = await supabase
      .from('ladder_members')
      .select('*', { count: 'exact', head: true })
      .eq('ladder_id', challenge.ladder_id);

    const { count: completionCount } = await supabase
      .from('challenge_completions')
      .select('*', { count: 'exact', head: true })
      .eq('challenge_id', challengeId);

    const threshold = Math.ceil((memberCount || 1) * 0.8);
    let dayAdvanced = false;

    if ((completionCount || 0) >= threshold) {
      // Mark challenge as completed
      await supabase
        .from('challenges')
        .update({ status: 'completed' })
        .eq('id', challengeId);

      // Advance ladder day
      const { data: ladder } = await supabase
        .from('ladders')
        .select('current_day')
        .eq('id', challenge.ladder_id)
        .single();

      const nextDay = (ladder?.current_day || 1) + 1;
      if (nextDay > 5) {
        await supabase
          .from('ladders')
          .update({ status: 'completed', current_day: 5 })
          .eq('id', challenge.ladder_id);
      } else {
        await supabase
          .from('ladders')
          .update({ current_day: nextDay })
          .eq('id', challenge.ladder_id);
      }
      dayAdvanced = true;
    }

    // Log event
    await supabase.from('incentive_events').insert({
      user_id: user.id,
      system: 'ladder',
      event_type: 'challenge_completed',
      metadata: { challengeId, tokens, discomfort, dayAdvanced },
    });

    return NextResponse.json({ success: true, tokens, dayAdvanced });
  } catch (error: any) {
    console.error('Complete challenge error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
