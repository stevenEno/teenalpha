import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { generateText } from '@/lib/ai';

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

    const today = new Date().toISOString().split('T')[0];

    // Check for existing quests today
    const { data: existingQuests } = await supabase
      .from('quests')
      .select('*')
      .eq('user_id', user.id)
      .eq('chain_date', today)
      .order('order_index', { ascending: true });

    // Get progress
    let { data: progress } = await supabase
      .from('user_quest_progress')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (!progress) {
      const { data: newProgress } = await supabase
        .from('user_quest_progress')
        .insert({ user_id: user.id })
        .select()
        .single();
      progress = newProgress;
    }

    if (existingQuests && existingQuests.length > 0) {
      return NextResponse.json({ quests: existingQuests, progress });
    }

    // Generate quests via AI
    // Try to get user interests from social media analysis
    const { data: analysis } = await supabase
      .from('social_media_analysis')
      .select('interests, personality_traits')
      .eq('profile_id', user.id)
      .single();

    const interests = analysis?.interests?.join(', ') || 'general self-improvement, technology, creativity';

    const prompt = `Generate 3-5 connected daily quests for a teen interested in: ${interests}.

The quests should form a chain where each builds on the previous one, starting simple and increasing in discomfort/challenge level. Each quest should take 15-60 minutes.

Respond with valid JSON only (no markdown):
{
  "quests": [
    {
      "title": "short quest title",
      "description": "what to do and why it matters",
      "difficulty": 1-5,
      "estimated_minutes": 15-60,
      "proof_type": "text"
    }
  ]
}`;

    const responseText = await generateText({
      prompt,
      maxTokens: 2000,
      temperature: 1,
    });

    let questsData;
    try {
      questsData = JSON.parse(responseText);
    } catch {
      console.error('Failed to parse quest AI response:', responseText);
      return NextResponse.json({ error: 'AI generated invalid response. Please try again.' }, { status: 500 });
    }

    if (!Array.isArray(questsData.quests) || questsData.quests.length === 0) {
      return NextResponse.json({ error: 'No quests generated' }, { status: 500 });
    }

    // Insert generated quests
    const questRows = questsData.quests.map((q: any, index: number) => ({
      user_id: user.id,
      chain_date: today,
      title: q.title,
      description: q.description,
      difficulty: Math.min(5, Math.max(1, q.difficulty)),
      estimated_minutes: Math.min(60, Math.max(15, q.estimated_minutes)),
      proof_type: q.proof_type || 'text',
      order_index: index,
      status: 'pending',
    }));

    const { data: insertedQuests, error: insertError } = await supabase
      .from('quests')
      .insert(questRows)
      .select()
      .order('order_index', { ascending: true });

    if (insertError) {
      console.error('Insert quests error:', insertError);
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    return NextResponse.json({ quests: insertedQuests, progress });
  } catch (error: any) {
    console.error('Get today quests error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
