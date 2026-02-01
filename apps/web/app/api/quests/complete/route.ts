import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { calculatePoints, checkLevelUp } from '@/lib/incentives';

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
    const { questId, proof, discomfort } = body;

    if (!questId || !proof || !discomfort) {
      return NextResponse.json({ error: 'Missing required fields: questId, proof, discomfort' }, { status: 400 });
    }

    // Verify quest belongs to user
    const { data: quest } = await supabase
      .from('quests')
      .select('*')
      .eq('id', questId)
      .eq('user_id', user.id)
      .single();

    if (!quest) {
      return NextResponse.json({ error: 'Quest not found' }, { status: 404 });
    }

    if (quest.status === 'completed') {
      return NextResponse.json({ error: 'Quest already completed' }, { status: 400 });
    }

    // Calculate points
    const points = calculatePoints(quest.difficulty, discomfort);

    // Update quest
    const { error: updateError } = await supabase
      .from('quests')
      .update({
        status: 'completed',
        proof_text: proof,
        discomfort_rating: discomfort,
        points_earned: points,
        completed_at: new Date().toISOString(),
      })
      .eq('id', questId);

    if (updateError) {
      console.error('Update quest error:', updateError);
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    // Update progress
    const today = new Date().toISOString().split('T')[0];
    const { data: progress } = await supabase
      .from('user_quest_progress')
      .select('*')
      .eq('user_id', user.id)
      .single();

    let newStreak = 1;
    let longestStreak = progress?.longest_streak || 0;

    if (progress?.last_completed_date) {
      const lastDate = new Date(progress.last_completed_date);
      const todayDate = new Date(today);
      const diffDays = Math.floor((todayDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));

      if (diffDays === 1) {
        newStreak = (progress.current_streak || 0) + 1;
      } else if (diffDays === 0) {
        newStreak = progress.current_streak || 1;
      }
    }

    longestStreak = Math.max(longestStreak, newStreak);
    const newTotalPoints = (progress?.total_points || 0) + points;
    const levelInfo = checkLevelUp(newTotalPoints);

    const { error: progressError } = await supabase
      .from('user_quest_progress')
      .upsert({
        user_id: user.id,
        current_streak: newStreak,
        longest_streak: longestStreak,
        total_points: newTotalPoints,
        level: levelInfo.level,
        last_completed_date: today,
        updated_at: new Date().toISOString(),
      });

    if (progressError) {
      console.error('Update progress error:', progressError);
    }

    // Log event
    await supabase.from('incentive_events').insert({
      user_id: user.id,
      system: 'quest',
      event_type: 'quest_completed',
      metadata: { questId, points, discomfort, streak: newStreak },
    });

    const result: any = {
      success: true,
      points,
      totalPoints: newTotalPoints,
      streak: newStreak,
      level: levelInfo.level,
      pointsToNext: levelInfo.pointsToNext,
    };

    if (levelInfo.leveledUp) {
      result.levelUp = true;
      result.newLevel = levelInfo.level;
    }

    if (newStreak === 7) {
      result.badge = 'week-streak';
    }

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Complete quest error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
