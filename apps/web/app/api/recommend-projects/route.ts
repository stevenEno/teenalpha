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

    // Get preferred data source from request body
    const body = await request.json();
    const preferredSource = body.dataSource || 'auto'; // 'auto', 'steam', 'roblox', 'instagram'

    console.log('🎯 Preferred data source:', preferredSource);

    // Get user's profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    console.log('🔍 Profile:', {
      steamId: profile.steam_id,
      robloxUsername: profile.roblox_username,
      instagramConnected: !!profile.instagram_connected_at,
    });

    // Get all available data sources
    const availableSources: Array<{
      id: string;
      name: string;
      platform: string;
      dataSource: string;
      analysis: any;
    }> = [];

    // Check Steam
    if (profile?.steam_id) {
      const { data: steamAnalysis } = await supabase
        .from('gaming_analysis')
        .select('*')
        .eq('profile_id', user.id)
        .eq('platform', 'steam')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      
      if (steamAnalysis) {
        availableSources.push({
          id: 'steam',
          name: 'Steam Gaming',
          platform: 'Steam',
          dataSource: 'gaming',
          analysis: steamAnalysis,
        });
      }
    }

    // Check Roblox
    if (profile?.roblox_username) {
      const { data: robloxAnalysis } = await supabase
        .from('gaming_analysis')
        .select('*')
        .eq('profile_id', user.id)
        .eq('platform', 'roblox')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      
      if (robloxAnalysis) {
        availableSources.push({
          id: 'roblox',
          name: 'Roblox Gaming',
          platform: 'Roblox',
          dataSource: 'gaming',
          analysis: robloxAnalysis,
        });
      }
    }

    // Check Instagram
    if (profile?.instagram_connected_at) {
      const { data: instagramAnalysis } = await supabase
        .from('social_media_analysis')
        .select('*')
        .eq('profile_id', user.id)
        .eq('platform', 'instagram')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      
      if (instagramAnalysis) {
        availableSources.push({
          id: 'instagram',
          name: 'Instagram Activity',
          platform: 'Instagram',
          dataSource: 'social',
          analysis: instagramAnalysis,
        });
      }
    }

    console.log('📊 Available sources:', availableSources.map(s => s.id).join(', '));

    if (availableSources.length === 0) {
      return NextResponse.json(
        { 
          error: 'No data found. Please connect Steam, Roblox, or Instagram in your profile.',
          needsConnection: true,
          availableSources: [],
        },
        { status: 404 }
      );
    }

    // Select data source based on preference
    let selectedSource;
    if (preferredSource === 'auto') {
      // Auto mode: prioritize Steam > Roblox > Instagram
      selectedSource = availableSources[0];
    } else {
      // Use specific preference
      selectedSource = availableSources.find(s => s.id === preferredSource);
      if (!selectedSource) {
        return NextResponse.json(
          { 
            error: `${preferredSource} data not available. Please choose from: ${availableSources.map(s => s.id).join(', ')}`,
            availableSources: availableSources.map(s => ({ id: s.id, name: s.name })),
          },
          { status: 400 }
        );
      }
    }

    console.log('✅ Using source:', selectedSource.id);

    const analysis = selectedSource.analysis;
    const platform = selectedSource.platform;
    const dataSource = selectedSource.dataSource;

    // Build profile description based on data source
    let profileDescription = '';

    if (dataSource === 'gaming') {
      const rawData = analysis.raw_data || {};
      const aiAnalysis = analysis.analysis || {};
      
      if (platform === 'Steam') {
        const topGames = rawData.topGames || [];
        const totalHours = rawData.totalPlaytimeHours || 0;
        const gameCount = rawData.totalGames || 0;
        
        profileDescription = `GAMING PROFILE (Steam):
- Total Games: ${gameCount}
- Total Hours Played: ${totalHours.toFixed(1)}
- Gaming Personality: ${aiAnalysis.gamingPersonality || 'Unknown'}
- Top Genres: ${aiAnalysis.topGenres?.join(', ') || 'Unknown'}

TOP GAMES (by playtime):
${topGames.map((game: any, i: number) => 
  `${i + 1}. ${game.name} - ${game.playtime_hours.toFixed(1)} hours`
).join('\n')}

AI ANALYSIS:
${aiAnalysis.personalityInsights || 'No insights available'}`;
      } else if (platform === 'Roblox') {
        const favoriteGames = rawData.favoriteGames || [];
        const friendCount = rawData.friendCount || 0;
        
        profileDescription = `GAMING PROFILE (Roblox):
- Username: ${rawData.username || 'Unknown'}
- Friends: ${friendCount}
- Gaming Personality: ${aiAnalysis.gamingPersonality || 'Unknown'}
- Top Genres: ${aiAnalysis.topGenres?.join(', ') || 'Unknown'}

FAVORITE GAMES:
${favoriteGames.map((game: any, i: number) => 
  `${i + 1}. ${game.name}`
).join('\n')}

AI ANALYSIS:
${aiAnalysis.personalityInsights || 'No insights available'}`;
      }
    } else if (dataSource === 'social' && platform === 'Instagram') {
      const rawData = analysis.raw_data || {};
      const aiAnalysis = analysis.analysis || {};
      
      profileDescription = `SOCIAL MEDIA PROFILE (Instagram):
- Total Likes: ${rawData.totalLikes || 0}
- Total Following: ${rawData.totalFollowing || 0}
- Engagement Level: ${rawData.engagementLevel || 'unknown'}
- Top Interests: ${aiAnalysis.topInterests?.join(', ') || 'unknown'}
- Content Themes: ${aiAnalysis.contentThemes?.join(', ') || 'unknown'}

TOP CONTENT CATEGORIES:
${Object.entries(rawData.categories || {})
  .slice(0, 8)
  .map(([cat, count]) => `- ${cat}: ${count} mentions`)
  .join('\n')}

AI PERSONALITY INSIGHTS:
${aiAnalysis.personalityInsights || 'No insights available'}

ALREADY SUGGESTED SKILLS:
${aiAnalysis.suggestedSkills?.join(', ') || 'None yet'}`;
    }

    console.log('📝 Profile description length:', profileDescription.length);

    // Generate project recommendations using AI
    const prompt = `You are a high school coding mentor helping a teen find their perfect first coding project.

Here is what we know about them based on their ${platform} activity:

${profileDescription}

Based on this information, recommend 5 coding projects that:
1. Match their interests and personality
2. Are achievable for beginners (can complete in 2-4 weeks)
3. Teach valuable programming skills
4. Feel personally meaningful to them
5. Can be shown off to friends/family

For EACH project, provide:
- A catchy, specific title (not generic)
- Why it matches their interests (reference specific ${platform} data)
- What they'll learn
- Difficulty level (Beginner/Intermediate)
- Estimated time (e.g., "2-3 weeks")
- Primary language/framework to use
- A specific first step to get started

Respond ONLY with valid JSON (no markdown, no code blocks):
{
  "recommendations": [
    {
      "title": "Specific project title",
      "description": "2-3 sentence description of what they'll build",
      "whyThisMatches": "1-2 sentences connecting to their ${platform} interests",
      "skillsLearned": ["skill1", "skill2", "skill3"],
      "difficulty": "Beginner or Intermediate",
      "estimatedTime": "X weeks",
      "techStack": ["primary language/framework", "tool2"],
      "firstStep": "Specific actionable first step"
    }
  ]
}`;

    console.log('🤖 Sending to Claude...');

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

    console.log('📥 Claude response length:', responseText.length);

    let recommendations;
    try {
      // Clean up the response - remove any markdown code blocks if present
      let cleanedResponse = responseText.trim();
      if (cleanedResponse.startsWith('```')) {
        cleanedResponse = cleanedResponse.replace(/^```json?\n?/, '').replace(/\n?```$/, '');
      }
      
      const parsed = JSON.parse(cleanedResponse);
      recommendations = parsed.recommendations;
      
      if (!Array.isArray(recommendations) || recommendations.length === 0) {
        throw new Error('No recommendations in response');
      }
      
      console.log('✅ Parsed', recommendations.length, 'recommendations');
    } catch (parseError) {
      console.error('Failed to parse AI response:', responseText.substring(0, 500));
      throw new Error('AI generated invalid response format');
    }

    // Save recommendations to database
    const recommendationsToSave = recommendations.map((rec: any) => ({
      profile_id: user.id,
      title: rec.title,
      description: rec.description,
      why_matches: rec.whyThisMatches,
      skills_learned: rec.skillsLearned,
      difficulty: rec.difficulty,
      estimated_time: rec.estimatedTime,
      tech_stack: rec.techStack,
      first_step: rec.firstStep,
      data_source: dataSource,
      source_platform: platform.toLowerCase(),
    }));

    // Clear old recommendations for this user
    await supabase
      .from('project_recommendations')
      .delete()
      .eq('profile_id', user.id);

    // Insert new recommendations
    const { error: insertError } = await supabase
      .from('project_recommendations')
      .insert(recommendationsToSave);

    if (insertError) {
      console.error('Failed to save recommendations:', insertError);
      throw new Error('Failed to save recommendations to database');
    }

    console.log('💾 Saved recommendations to database');

    return NextResponse.json({
      success: true,
      recommendations,
      source: {
        platform,
        dataSource,
        selectedSource: selectedSource.id,
      },
      availableSources: availableSources.map(s => ({ 
        id: s.id, 
        name: s.name 
      })),
    });

  } catch (error: any) {
    console.error('Recommendation error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate recommendations' },
      { status: 500 }
    );
  }
}