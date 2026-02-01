import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: ladderId } = await params;
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

    // Verify user is a member
    const { data: membership } = await supabase
      .from('ladder_members')
      .select('*')
      .eq('ladder_id', ladderId)
      .eq('user_id', user.id)
      .single();

    if (!membership) {
      return NextResponse.json({ error: 'Not a member of this ladder' }, { status: 403 });
    }

    // Get ladder info
    const { data: ladder } = await supabase
      .from('ladders')
      .select('*')
      .eq('id', ladderId)
      .single();

    if (!ladder) {
      return NextResponse.json({ error: 'Ladder not found' }, { status: 404 });
    }

    // Get members with profiles
    const { data: members } = await supabase
      .from('ladder_members')
      .select('*, profiles:user_id(full_name, avatar_url)')
      .eq('ladder_id', ladderId);

    // Get current day challenges
    const { data: challenges } = await supabase
      .from('challenges')
      .select('*')
      .eq('ladder_id', ladderId)
      .eq('day', ladder.current_day)
      .order('created_at', { ascending: true });

    // Get completions for current day challenges
    const challengeIds = (challenges || []).map((c: any) => c.id);
    let completions: any[] = [];
    if (challengeIds.length > 0) {
      const { data: comp } = await supabase
        .from('challenge_completions')
        .select('*, profiles:user_id(full_name, avatar_url)')
        .in('challenge_id', challengeIds);
      completions = comp || [];
    }

    return NextResponse.json({
      ladder,
      members: members || [],
      challenges: challenges || [],
      completions,
      myTokens: membership.tokens,
    });
  } catch (error: any) {
    console.error('Get ladder status error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
