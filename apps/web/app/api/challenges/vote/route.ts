import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

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
    const { challengeId } = body;

    if (!challengeId) {
      return NextResponse.json({ error: 'challengeId is required' }, { status: 400 });
    }

    // Get the challenge
    const { data: challenge } = await supabase
      .from('challenges')
      .select('*, ladders!inner(id)')
      .eq('id', challengeId)
      .single();

    if (!challenge) {
      return NextResponse.json({ error: 'Challenge not found' }, { status: 404 });
    }

    // Verify user is a member of the ladder
    const { data: membership } = await supabase
      .from('ladder_members')
      .select('*')
      .eq('ladder_id', challenge.ladder_id)
      .eq('user_id', user.id)
      .single();

    if (!membership) {
      return NextResponse.json({ error: 'Not a member of this ladder' }, { status: 403 });
    }

    // Add vote (if not already voted)
    const currentVotes: string[] = Array.isArray(challenge.votes) ? challenge.votes : [];
    if (currentVotes.includes(user.id)) {
      return NextResponse.json({ error: 'Already voted' }, { status: 400 });
    }

    const newVotes = [...currentVotes, user.id];

    await supabase
      .from('challenges')
      .update({ votes: newVotes })
      .eq('id', challengeId);

    // Check if majority reached
    const { count: memberCount } = await supabase
      .from('ladder_members')
      .select('*', { count: 'exact', head: true })
      .eq('ladder_id', challenge.ladder_id);

    const majority = Math.ceil((memberCount || 1) / 2);
    if (newVotes.length >= majority) {
      // Mark this challenge as selected/active
      await supabase
        .from('challenges')
        .update({ is_selected: true, status: 'active' })
        .eq('id', challengeId);
    }

    return NextResponse.json({ success: true, votes: newVotes.length, majority });
  } catch (error: any) {
    console.error('Vote on challenge error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
