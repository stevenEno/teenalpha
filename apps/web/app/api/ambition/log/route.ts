import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { calculateStars } from '@/lib/incentives';

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
    const { trackId, evidence, rating } = body;

    if (!trackId || !evidence || !rating) {
      return NextResponse.json({ error: 'Missing required fields: trackId, evidence, rating' }, { status: 400 });
    }

    // Get track and verify ownership
    const { data: track } = await supabase
      .from('daily_tracks')
      .select('*, ambition_goals!inner(user_id, id, total_stars)')
      .eq('id', trackId)
      .single();

    if (!track || (track.ambition_goals as any).user_id !== user.id) {
      return NextResponse.json({ error: 'Track not found' }, { status: 404 });
    }

    if (track.status === 'completed') {
      return NextResponse.json({ error: 'Already completed' }, { status: 400 });
    }

    // Calculate consecutive completed days for streak bonus
    const goalId = (track.ambition_goals as any).id;
    const { data: allTracks } = await supabase
      .from('daily_tracks')
      .select('day_number, status')
      .eq('goal_id', goalId)
      .order('day_number', { ascending: true });

    let consecutiveDays = 0;
    for (let d = track.day_number - 1; d >= 1; d--) {
      const prev = (allTracks || []).find((t: any) => t.day_number === d);
      if (prev?.status === 'completed') {
        consecutiveDays++;
      } else {
        break;
      }
    }

    const stars = calculateStars(track.difficulty, rating, consecutiveDays);

    // Update track
    const { error: updateError } = await supabase
      .from('daily_tracks')
      .update({
        status: 'completed',
        evidence_text: evidence,
        effort_rating: rating,
        stars_earned: stars,
        completed_at: new Date().toISOString(),
      })
      .eq('id', trackId);

    if (updateError) {
      console.error('Update track error:', updateError);
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    // Update goal total stars
    const currentStars = (track.ambition_goals as any).total_stars || 0;
    const newTotalStars = currentStars + stars;

    await supabase
      .from('ambition_goals')
      .update({ total_stars: newTotalStars })
      .eq('id', goalId);

    // Check if all 7 days done
    const completedCount = (allTracks || []).filter((t: any) => t.status === 'completed').length + 1;
    let goalCompleted = false;

    if (completedCount >= 7) {
      await supabase
        .from('ambition_goals')
        .update({ status: 'completed' })
        .eq('id', goalId);
      goalCompleted = true;
    }

    // Log event
    await supabase.from('incentive_events').insert({
      user_id: user.id,
      system: 'tracker',
      event_type: 'daily_logged',
      metadata: { trackId, stars, rating, dayNumber: track.day_number, goalCompleted },
    });

    return NextResponse.json({
      success: true,
      stars,
      totalStars: newTotalStars,
      goalCompleted,
    });
  } catch (error: any) {
    console.error('Log ambition effort error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
