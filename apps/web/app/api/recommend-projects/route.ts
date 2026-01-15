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

    // Get profile and ALL gaming analyses
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    console.log('👤 Profile:', profile?.full_name);
    console.log('   Steam ID:', profile?.steam_id);
    console.log('   Roblox Username:', profile?.roblox_username);

    // Fetch ALL gaming platforms
    const { data: allAnalyses } = await supabase
      .from('gaming_analysis')
      .select('*')
      .eq('profile_id', user.id)
      .order('created_at', { ascending: false });

    console.log('📊 Found', allAnalyses?.length || 0, 'gaming platforms');

    if (!allAnalyses || allAnalyses.length === 0) {
      console.log('🚫 No gaming data - returning error');
      return NextResponse.json(
        { error: 'No gaming data found. Please connect Steam or Roblox in your profile.' },
        { status: 404 }
      );
    }

    // Helper to get engagement score
    function getEngagementScore(analysisData: any): number {
      const platformType = analysisData.platform;
      const analysisContent = analysisData.analysis || {};
      
      if (platformType === 'steam') {
        // Steam: use total hours played
        return analysisContent.totalHours || 0;
      } else if (platformType === 'roblox') {
        // Roblox: estimate engagement (FAVORING CREATORS)
        // - 200 points per game created (shows high engagement + creation skills)
        // - 10 points per favorite game
        // - 5 points per group membership
        const createdGames = analysisContent.createdGames || 0;
        const favorites = analysisData.top_games?.length || 0;
        const groups = analysisContent.interests?.length || 0;
        
        const score = (createdGames * 200) + (favorites * 10) + (groups * 5);
        console.log(`   Roblox engagement: ${createdGames} games, ${favorites} favorites, ${groups} groups = ${score} points`);
        return score;
      }
      
      return 0;
    }

    // Score each platform
    const scoredAnalyses = allAnalyses.map(a => ({
      analysis: a,
      score: getEngagementScore(a),
      platform: a.platform,
    }));

    // Sort by score (highest first)
    scoredAnalyses.sort((a, b) => b.score - a.score);

    console.log('🏆 Engagement scores:');
    scoredAnalyses.forEach(s => {
      console.log(`   ${s.platform}: ${s.score} ${s.platform === 'steam' ? 'hours' : 'points'}`);
    });

    // Use the highest engagement platform
    const topPlatform = scoredAnalyses[0];
    const analysis = topPlatform.analysis;
    const platform = topPlatform.platform === 'steam' ? 'Steam' : 'Roblox';

    console.log(`✅ Using ${platform} (${topPlatform.score} ${platform === 'Steam' ? 'hours' : 'points'})`);

    const topGames = analysis.top_games || [];
    const skills = analysis.suggested_skills || [];
    const rawAnalysis = analysis.analysis || {};

    // Build a description based on platform
    let profileDescription = '';
    if (platform === 'Steam') {
      const totalHours = rawAnalysis.totalHours || 0;
      profileDescription = `STEAM GAMING PROFILE:
- Total Gaming Hours: ${totalHours}
- Top Games: ${topGames.map((g: any) => `${g.name} (${g.hours}h)`).join(', ')}
- Favorite Genres: ${skills.join(', ')}`;
} else if (platform === 'Roblox') {
  const isCreator = rawAnalysis.isCreator || false;
  const createdGames = rawAnalysis.createdGames || 0;
  const interests = rawAnalysis.interests || [];
  const favoriteGenres = rawAnalysis.favoriteGenres || [];
  
  // Build a rich profile description
  let creatorContext = '';
  if (isCreator && createdGames > 0) {
    creatorContext = `
IMPORTANT: This student is a Roblox game developer with ${createdGames} published game(s)! 
They already know Roblox Studio and Lua programming. Recommend projects that:
- Build on their existing game dev skills
- Take them beyond Roblox (web dev, mobile apps, advanced programming)
- Feel like natural next steps for a game creator
- Could enhance their Roblox games (tools, analytics, bots, etc.)`;
  }
  
  profileDescription = `ROBLOX PROFILE:
${creatorContext}

Profile Details:
- Games Created: ${createdGames}${createdGames > 0 ? ' (Active Creator!)' : ''}
- Favorite/Created Games: ${topGames.slice(0, 8).map((g: any) => `${g.name} (${g.type})`).join(', ')}
- Favorite Game Types: ${favoriteGenres.join(', ') || 'Various'}
- Groups/Communities: ${interests.slice(0, 5).join(', ') || 'None listed'}
- Skills Demonstrated: ${skills.join(', ')}

Context: Roblox is a game creation platform. Many students who play/create Roblox games are interested in:
- Building their own games and tools
- Creating Discord bots for their communities  
- Making websites for their Roblox groups
- Developing game analytics dashboards
- Building trading tools or economy simulators
- Creating content for YouTube/TikTok about their games`;
}

    // Create AI prompt
    const prompt = `You are analyzing a ${profile.grade ? `grade ${profile.grade}` : 'high school'} student's ${platform} profile to recommend coding/tech projects they'd be excited to build.

${profileDescription}

Based on their ${platform} activity, recommend 3 project ideas that:
1. Connect to games/experiences they love
2. Are achievable for a motivated high school student
3. Teach real programming/tech skills
4. Feel exciting and relevant to them

${platform === 'Roblox' && rawAnalysis.isCreator ? 
  `SPECIAL INSTRUCTIONS FOR ROBLOX CREATORS:
- Don't suggest "make a Roblox game" - they already do that
- Suggest tools that ENHANCE their Roblox work (Discord bots, web dashboards, analytics)
- Suggest projects that expand their skills BEYOND Roblox (web development, mobile apps, AI)
- Reference specific games they've created or favorited
- Examples: "Build a Discord bot for your Roblox group", "Create a web dashboard showing your game stats", "Make a mobile companion app for your Roblox game"` : 
  platform === 'Roblox' ? 
  `This student plays Roblox but hasn't created games yet. Suggest projects that:
- Let them create something related to games they love
- Teach game design concepts
- Could lead to Roblox game development
- Examples: "Build a simple 2D version of [their favorite game]", "Create a Discord bot for Roblox trading", "Make a game character designer tool"` :
  ''
}

For each project, identify the SPECIFIC game or experience from their ${platform} profile that inspired it.

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

Make the titles and descriptions EXCITING. Reference their actual ${platform} activity. Make them feel like you understand what they love.`;

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

    // Build gaming profile summary for response
    let gamingProfile;
    if (platform === 'Steam') {
      gamingProfile = {
        totalHours: rawAnalysis.totalHours || 0,
        topGames: topGames,
        genres: skills,
      };
    } else {
      gamingProfile = {
        totalHours: 0, // Roblox doesn't track hours the same way
        topGames: topGames,
        genres: skills,
        isCreator: rawAnalysis.isCreator,
        createdGames: rawAnalysis.createdGames,
      };
    }

    return NextResponse.json({
      success: true,
      recommendations: recommendations.projects,
      gamingProfile: gamingProfile,
    });
  } catch (error: any) {
    console.error('Recommendation error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate recommendations' },
      { status: 500 }
    );
  }
}