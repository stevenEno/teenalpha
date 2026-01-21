import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import Anthropic from '@anthropic-ai/sdk';
import { fetchTBPNFeed, formatEpisodesForPrompt } from '@/lib/tbpn-parser';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

// GET: Fetch existing pathways for the user
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

    // Get existing pathways
    const { data: pathways, error } = await supabase
      .from('startup_pathways')
      .select('*')
      .eq('profile_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Database error:', error);
      return NextResponse.json({ error: 'Failed to fetch pathways' }, { status: 500 });
    }

    return NextResponse.json({
      pathways: pathways || null,
    });

  } catch (error: any) {
    console.error('Fetch pathways error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch pathways' },
      { status: 500 }
    );
  }
}

// POST: Generate new pathways
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

    console.log('Generating startup pathways for user:', user.id);

    // Get user's social media analysis (preferring Instagram, but fallback to others)
    const { data: socialAnalysis } = await supabase
      .from('social_media_analysis')
      .select('*')
      .eq('profile_id', user.id)
      .order('created_at', { ascending: false });

    if (!socialAnalysis || socialAnalysis.length === 0) {
      return NextResponse.json(
        { error: 'No social media data found. Please upload your Instagram, TikTok, or Snapchat data first.' },
        { status: 400 }
      );
    }

    // Use the most recent analysis
    const analysis = socialAnalysis[0];
    const aiAnalysis = analysis.analysis || {};
    const rawData = analysis.raw_data || {};

    console.log('Found analysis for platform:', analysis.platform);

    // Extract interests for the prompt
    const studentInterests = {
      topInterests: aiAnalysis.topInterests || [],
      contentThemes: aiAnalysis.contentThemes || [],
      categories: rawData.categories || {},
      suggestedSkills: aiAnalysis.suggestedSkills || [],
      personalityInsights: aiAnalysis.personalityInsights || '',
      platform: analysis.platform,
    };

    // Fetch TBPN podcast episodes
    console.log('Fetching TBPN podcast episodes...');
    let tbpnData;
    try {
      tbpnData = await fetchTBPNFeed(10);
      console.log(`Fetched ${tbpnData.episodes.length} TBPN episodes`);
    } catch (fetchError) {
      console.error('Failed to fetch TBPN feed:', fetchError);
      return NextResponse.json(
        { error: 'Failed to fetch podcast episodes. Please try again later.' },
        { status: 500 }
      );
    }

    // Build the AI prompt
    const topCategories = Object.entries(rawData.categories || {})
      .sort(([, a], [, b]) => (b as number) - (a as number))
      .slice(0, 10)
      .map(([cat]) => cat);

    const episodeSummaries = formatEpisodesForPrompt(tbpnData.episodes);

    const prompt = `You are a career advisor helping a high school student discover startup opportunities.

STUDENT'S INTERESTS (from ${analysis.platform} analysis):
- Top interests: ${(aiAnalysis.topInterests || []).join(', ') || 'Not identified'}
- Content themes: ${(aiAnalysis.contentThemes || []).join(', ') || 'Not identified'}
- Categories engaged with: ${topCategories.join(', ') || 'Not identified'}
- Personality insights: ${aiAnalysis.personalityInsights || 'Not available'}

RECENT TECH INDUSTRY TOPICS (from Technology Brother podcast):
${episodeSummaries}

Create exactly 3 DISTINCT pathways showing how this student's interests connect to exciting startup opportunities today. Make each pathway:
1. Directly relevant to their demonstrated interests
2. Inspired by themes from the podcast episodes
3. Focused on real, actionable opportunities

For EACH pathway, provide:
1. **Pathway Name** - A creative 3-5 word name connecting their interest to an industry
2. **The Connection** - 2-3 sentences explaining how their interest naturally leads to this space
3. **Top 3 Startups** - Real companies working in this area (must be actual companies)
4. **Skills to Build** - 4-5 specific technical and soft skills needed
5. **First Steps** - 3 concrete, actionable items to start exploring this path

IMPORTANT:
- Make pathways SPECIFIC to this student, not generic advice
- Reference their actual interests when explaining connections
- Include a mix of well-known and up-and-coming startups
- First steps should be things a high schooler can actually do

Respond with valid JSON only (no markdown formatting):
{
  "pathways": [
    {
      "name": "string",
      "icon": "emoji",
      "connection": "string",
      "startups": [
        { "name": "string", "description": "string (1 sentence)", "website": "string (URL)" }
      ],
      "skills": ["string"],
      "firstSteps": ["string"]
    }
  ]
}`;

    console.log('Sending prompt to Claude (length:', prompt.length, ')');

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4000,
      temperature: 1,
      messages: [{ role: 'user', content: prompt }],
    });

    const responseText = message.content
      .filter((block) => block.type === 'text')
      .map((block) => (block as any).text)
      .join('');

    console.log('Claude response length:', responseText.length);

    // Parse the response
    let pathwaysData;
    try {
      let cleanedResponse = responseText.trim();
      if (cleanedResponse.startsWith('```')) {
        cleanedResponse = cleanedResponse.replace(/^```json?\n?/, '').replace(/\n?```$/, '');
      }

      pathwaysData = JSON.parse(cleanedResponse);

      if (!Array.isArray(pathwaysData.pathways) || pathwaysData.pathways.length === 0) {
        throw new Error('No pathways in response');
      }

      console.log('Parsed', pathwaysData.pathways.length, 'pathways');
    } catch (parseError) {
      console.error('Failed to parse AI response:', responseText.substring(0, 500));
      throw new Error('AI generated invalid response format');
    }

    // Store the pathways snapshot for the episodes we used
    const episodesSnapshot = tbpnData.episodes.map(ep => ({
      title: ep.title,
      description: ep.description.substring(0, 200),
      themes: ep.themes,
      pubDate: ep.pubDate,
    }));

    // Delete old pathways for this user
    await supabase
      .from('startup_pathways')
      .delete()
      .eq('profile_id', user.id);

    // Insert new pathways
    const { data: savedPathways, error: insertError } = await supabase
      .from('startup_pathways')
      .insert({
        profile_id: user.id,
        student_interests: studentInterests,
        tbpn_episodes: episodesSnapshot,
        pathways: pathwaysData.pathways,
      })
      .select()
      .single();

    if (insertError) {
      console.error('Failed to save pathways:', insertError);
      throw new Error('Failed to save pathways to database');
    }

    console.log('Saved pathways to database');

    return NextResponse.json({
      success: true,
      pathways: savedPathways,
    });

  } catch (error: any) {
    console.error('Generate pathways error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate pathways' },
      { status: 500 }
    );
  }
}
