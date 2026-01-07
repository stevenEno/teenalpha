import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

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

    console.log('🔍 Looking for gaming data for user:', user.id);

    // Get profile and gaming analysis
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    console.log('👤 Profile:', profile?.full_name, 'Steam ID:', profile?.steam_id);

    const { data: analysis, error: analysisError } = await supabase
      .from('gaming_analysis')
      .select('*')
      .eq('profile_id', user.id)
      .eq('platform', 'steam')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    console.log('📊 Gaming analysis found?', !!analysis);
    console.log('❌ Analysis error:', analysisError);

    if (!analysis) {
      console.log('🚫 No gaming data - returning error');
      return NextResponse.json(
        { error: 'No gaming data found. Please reconnect your Steam account.' },
        { status: 404 }
      );
    }

    console.log('✅ Found analysis with', analysis.top_games?.length, 'games');

    // ... rest of the function

    const topGames = analysis.top_games || [];
    const genres = analysis.suggested_skills || [];
    const totalHours = analysis.analysis?.totalHours || 0;

    // Create AI prompt
    const prompt = `You are analyzing a ${profile.grade ? `grade ${profile.grade}` : 'high school'} student's gaming profile to recommend coding/tech projects they'd be excited to build.

GAMING PROFILE:
- Total Gaming Hours: ${totalHours}
- Top Games: ${topGames.map((g: any) => `${g.name} (${g.hours}h)`).join(', ')}
- Favorite Genres: ${genres.join(', ')}

Based on their gaming interests, recommend 3 project ideas that:
1. Connect to games they love
2. Are achievable for a motivated high school student
3. Teach real programming/tech skills
4. Feel exciting and relevant to them

For each project, identify the SPECIFIC game or gaming experience that inspired it.

Respond ONLY with valid JSON (no markdown, no code blocks):
{
  "projects": [
    {
      "title": "Project title (5-8 words)",
      "description": "2-3 sentences explaining what they'll build and why it's cool",
      "category": "Coding & Software" or "Robotics & Hardware" or "Art & Design",
      "inspirationGame": "Which specific game from their library inspired this",
      "skillsLearned": ["skill1", "skill2", "skill3"],
      "difficulty": "beginner" or "intermediate" or "advanced",
      "estimatedHours": 20
    }
  ]
}

Make the titles and descriptions EXCITING. Reference their actual games. Make them feel like you understand what they love.`;

    // Call Claude
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      temperature: 1,
      messages: [{ role: 'user', content: prompt }],
    });

    const responseText = message.content
      .filter((block) => block.type === 'text')
      .map((block) => (block as any).text)
      .join('');

    let recommendations;
    try {
      recommendations = JSON.parse(responseText);
    } catch (parseError) {
      console.error('Failed to parse AI response:', responseText);
      return NextResponse.json(
        { error: 'AI generated invalid response' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      recommendations: recommendations.projects,
      gamingProfile: {
        totalHours,
        topGames,
        genres,
      },
    });
  } catch (error: any) {
    console.error('Recommendation error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate recommendations' },
      { status: 500 }
    );
  }
}