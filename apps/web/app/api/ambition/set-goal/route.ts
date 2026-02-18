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
    const { goal } = body;

    if (!goal || typeof goal !== 'string') {
      return NextResponse.json({ error: 'Goal text is required' }, { status: 400 });
    }

    // Check for existing active goal
    const { data: existingGoal } = await supabase
      .from('ambition_goals')
      .select('id')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single();

    if (existingGoal) {
      return NextResponse.json({ error: 'You already have an active goal. Complete or abandon it first.' }, { status: 400 });
    }

    // Get user interests for context
    const { data: analysis } = await supabase
      .from('social_media_analysis')
      .select('interests')
      .eq('profile_id', user.id)
      .single();

    const interests = analysis?.interests?.join(', ') || 'general interests';

    const prompt = `Break this weekly ambition goal into 7 daily tasks with increasing difficulty (1-5 scale) for a teen interested in ${interests}.

Goal: "${goal}"

Each day should build on the previous. Day 1 should be easy (difficulty 1-2), days 6-7 should be challenging (difficulty 4-5).

Respond with valid JSON only (no markdown):
{
  "tasks": [
    {
      "day_number": 1,
      "task_description": "what to do today",
      "difficulty": 1
    }
  ]
}`;

    const responseText = await generateText({
      prompt,
      maxTokens: 2000,
      temperature: 1,
    });

    let tasksData;
    try {
      tasksData = JSON.parse(responseText);
    } catch {
      console.error('Failed to parse ambition AI response:', responseText);
      return NextResponse.json({ error: 'AI generated invalid response. Please try again.' }, { status: 500 });
    }

    if (!Array.isArray(tasksData.tasks) || tasksData.tasks.length !== 7) {
      return NextResponse.json({ error: 'AI did not generate exactly 7 tasks' }, { status: 500 });
    }

    // Create goal
    const today = new Date().toISOString().split('T')[0];
    const { data: newGoal, error: goalError } = await supabase
      .from('ambition_goals')
      .insert({
        user_id: user.id,
        goal_text: goal,
        week_start: today,
        status: 'active',
      })
      .select()
      .single();

    if (goalError || !newGoal) {
      console.error('Create goal error:', goalError);
      return NextResponse.json({ error: 'Failed to create goal' }, { status: 500 });
    }

    // Insert 7 daily tracks
    const trackRows = tasksData.tasks.map((t: any) => ({
      goal_id: newGoal.id,
      day_number: Math.min(7, Math.max(1, t.day_number)),
      task_description: t.task_description,
      difficulty: Math.min(5, Math.max(1, t.difficulty)),
      status: 'pending',
    }));

    const { data: tracks, error: tracksError } = await supabase
      .from('daily_tracks')
      .insert(trackRows)
      .select()
      .order('day_number', { ascending: true });

    if (tracksError) {
      console.error('Insert tracks error:', tracksError);
      return NextResponse.json({ error: tracksError.message }, { status: 500 });
    }

    // Log event
    await supabase.from('incentive_events').insert({
      user_id: user.id,
      system: 'tracker',
      event_type: 'goal_set',
      metadata: { goalId: newGoal.id, goal },
    });

    return NextResponse.json({ goal: newGoal, tracks });
  } catch (error: any) {
    console.error('Set ambition goal error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
