import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { generateText } from '@/lib/ai';

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
    const { interest } = body;

    if (!interest || typeof interest !== 'string') {
      return NextResponse.json({ error: 'Interest is required' }, { status: 400 });
    }

    // Check if user already in an active ladder
    const { data: existingMembership } = await supabase
      .from('ladder_members')
      .select('ladder_id, ladders!inner(status)')
      .eq('user_id', user.id)
      .in('ladders.status', ['forming', 'active'])
      .limit(1)
      .single();

    if (existingMembership) {
      return NextResponse.json({ error: 'Already in an active ladder', ladderId: existingMembership.ladder_id }, { status: 400 });
    }

    // Find a forming ladder with matching interest and room
    const { data: formingLadders } = await supabase
      .from('ladders')
      .select('id, interest, ladder_members(count)')
      .eq('status', 'forming')
      .ilike('interest', `%${interest}%`);

    let ladderId: string | null = null;

    if (formingLadders) {
      for (const ladder of formingLadders) {
        const memberCount = (ladder.ladder_members as any)?.[0]?.count || 0;
        if (memberCount < 6) {
          ladderId = ladder.id;
          break;
        }
      }
    }

    // Create new ladder if none found
    if (!ladderId) {
      const { data: newLadder, error: createError } = await supabase
        .from('ladders')
        .insert({ interest, status: 'forming' })
        .select()
        .single();

      if (createError || !newLadder) {
        return NextResponse.json({ error: 'Failed to create ladder' }, { status: 500 });
      }
      ladderId = newLadder.id;
    }

    // Join the ladder
    const { error: joinError } = await supabase
      .from('ladder_members')
      .insert({ ladder_id: ladderId, user_id: user.id });

    if (joinError) {
      console.error('Join ladder error:', joinError);
      return NextResponse.json({ error: joinError.message }, { status: 500 });
    }

    // Check member count — activate if >= 4
    const { count: memberCount } = await supabase
      .from('ladder_members')
      .select('*', { count: 'exact', head: true })
      .eq('ladder_id', ladderId);

    if ((memberCount || 0) >= 4) {
      // Activate ladder and generate first day challenges
      await supabase
        .from('ladders')
        .update({ status: 'active' })
        .eq('id', ladderId);

      // Generate challenges for day 1
      const prompt = `Generate 3 challenges for a group of teens interested in "${interest}" for day 1 of a 5-day challenge ladder.

Include 2 normal difficulty and 1 hard difficulty challenge. Each should take 15-45 minutes.

Respond with valid JSON only (no markdown):
{
  "challenges": [
    {
      "title": "short challenge title",
      "description": "what to do",
      "difficulty": "normal" or "hard"
    }
  ]
}`;

      const responseText = await generateText({
        prompt,
        maxTokens: 1500,
        temperature: 1,
      });

      try {
        const challengeData = JSON.parse(responseText);
        if (Array.isArray(challengeData.challenges)) {
          const rows = challengeData.challenges.map((c: any) => ({
            ladder_id: ladderId,
            day: 1,
            title: c.title,
            description: c.description,
            difficulty: c.difficulty === 'hard' ? 'hard' : 'normal',
            status: 'voting',
          }));
          await supabase.from('challenges').insert(rows);
        }
      } catch {
        console.error('Failed to parse challenge AI response');
      }
    }

    // Log event
    await supabase.from('incentive_events').insert({
      user_id: user.id,
      system: 'ladder',
      event_type: 'ladder_joined',
      metadata: { ladderId, interest },
    });

    return NextResponse.json({ success: true, ladderId });
  } catch (error: any) {
    console.error('Join ladder error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
