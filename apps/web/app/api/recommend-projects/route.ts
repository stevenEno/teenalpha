import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import Anthropic from '@anthropic-ai/sdk';
import { getPromptTemplate, interpolatePrompt } from '@/lib/prompts';

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
    const preferredSource = body.dataSource || 'auto'; // 'auto', 'steam', 'roblox', 'instagram', 'tiktok', 'snapchat'

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
      tiktokConnected: !!profile.tiktok_connected_at,
      snapchatConnected: !!profile.snapchat_connected_at,
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

    // Check TikTok
    if (profile?.tiktok_connected_at) {
      const { data: tiktokAnalysis } = await supabase
        .from('social_media_analysis')
        .select('*')
        .eq('profile_id', user.id)
        .eq('platform', 'tiktok')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (tiktokAnalysis) {
        availableSources.push({
          id: 'tiktok',
          name: 'TikTok Activity',
          platform: 'TikTok',
          dataSource: 'social',
          analysis: tiktokAnalysis,
        });
      }
    }

    // Check Snapchat
    if (profile?.snapchat_connected_at) {
      const { data: snapchatAnalysis } = await supabase
        .from('social_media_analysis')
        .select('*')
        .eq('profile_id', user.id)
        .eq('platform', 'snapchat')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (snapchatAnalysis) {
        availableSources.push({
          id: 'snapchat',
          name: 'Snapchat Activity',
          platform: 'Snapchat',
          dataSource: 'social',
          analysis: snapchatAnalysis,
        });
      }
    }

    console.log('📊 Available sources:', availableSources.map(s => s.id).join(', '));

    if (availableSources.length === 0) {
      return NextResponse.json(
        {
          error: 'No data found. Please connect Instagram, TikTok, or Snapchat in your profile.',
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
    } else if (dataSource === 'social') {
      const rawData = analysis.raw_data || {};
      const aiAnalysis = analysis.analysis || {};

      if (platform === 'Instagram') {
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
      } else if (platform === 'TikTok') {
        const topSearches = rawData.topSearches || [];
        profileDescription = `SOCIAL MEDIA PROFILE (TikTok):
- Total Favorite Videos: ${rawData.totalFavoriteVideos || 0}
- Total Favorite Sounds: ${rawData.totalFavoriteSounds || 0}
- Total Searches: ${rawData.totalSearches || 0}
- Engagement Level: ${rawData.engagementLevel || 'unknown'}
- Top Interests: ${aiAnalysis.topInterests?.join(', ') || 'unknown'}
- Content Themes: ${aiAnalysis.contentThemes?.join(', ') || 'unknown'}

TOP SEARCHES (what they actively look for):
${topSearches.slice(0, 10).map((s: any) => `- "${s.term}" (${s.count}x)`).join('\n')}

TOP CONTENT CATEGORIES:
${Object.entries(rawData.categories || {})
  .slice(0, 8)
  .map(([cat, count]) => `- ${cat}: ${count} mentions`)
  .join('\n')}

AI PERSONALITY INSIGHTS:
${aiAnalysis.personalityInsights || 'No insights available'}

ALREADY SUGGESTED SKILLS:
${aiAnalysis.suggestedSkills?.join(', ') || 'None yet'}`;
      } else if (platform === 'Snapchat') {
        const engagement = rawData.engagement || {};
        const topHashtags = rawData.topHashtags || [];
        profileDescription = `SOCIAL MEDIA PROFILE (Snapchat):
- Snapscore: ${rawData.snapscore?.toLocaleString() || 0}
- Total Friends: ${rawData.totalFriends || 0}
- Engagement Level: ${rawData.engagementLevel || 'unknown'}
- Is Content Creator: ${rawData.isContentCreator ? 'Yes' : 'No'}
- Top Interests: ${aiAnalysis.topInterests?.join(', ') || 'unknown'}
- Content Themes: ${aiAnalysis.contentThemes?.join(', ') || 'unknown'}

ENGAGEMENT METRICS:
- Snaps Sent: ${engagement.snapsSent?.toLocaleString() || 0}
- Snaps Viewed: ${engagement.snapsViewed?.toLocaleString() || 0}
- Chats Sent: ${engagement.chatsSent?.toLocaleString() || 0}
- Story Posts: ${engagement.storyPostsCreated || 0}
- Story Views Received: ${engagement.storyViewsReceived?.toLocaleString() || 0}

SPOTLIGHT HASHTAGS (content they engage with):
${topHashtags.slice(0, 10).map((h: any) => `- #${h.hashtag} (${h.count}x)`).join('\n')}

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
    }

    console.log('📝 Profile description length:', profileDescription.length);

    // Get customizable prompt template
    const promptTemplate = await getPromptTemplate('project-recommendations');

    // Generate project recommendations using AI
    const prompt = interpolatePrompt(promptTemplate, {
      platform,
      profileDescription,
    });

    console.log('🤖 Sending to Claude (prompt length:', prompt.length, ')...');

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