import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

// Default prompts - these are the templates used for project recommendations
const DEFAULT_PROMPTS = {
  'project-recommendations': {
    name: 'Project Recommendations',
    description: 'Main prompt for generating personalized coding project recommendations',
    template: `You are a high school coding mentor helping a teen find their perfect first coding project.

Here is what we know about them based on their {{platform}} activity:

{{profileDescription}}

Based on this information, recommend 5 coding projects that:
1. Match their interests and personality
2. Are achievable for beginners (can complete in 2-4 weeks)
3. Teach valuable programming skills
4. Feel personally meaningful to them
5. Can be shown off to friends/family

For EACH project, provide:
- A catchy, specific title (not generic)
- Why it matches their interests (reference specific {{platform}} data)
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
      "whyThisMatches": "1-2 sentences connecting to their {{platform}} interests",
      "skillsLearned": ["skill1", "skill2", "skill3"],
      "difficulty": "Beginner or Intermediate",
      "estimatedTime": "X weeks",
      "techStack": ["primary language/framework", "tool2"],
      "firstStep": "Specific actionable first step"
    }
  ]
}`,
  },
  'instagram-analysis': {
    name: 'Instagram Analysis',
    description: 'Prompt for analyzing Instagram data to identify interests',
    template: `Analyze this high school student's Instagram activity to identify their interests and recommend tech/coding projects.

INSTAGRAM ACTIVITY:
- Total Likes: {{totalLikes}}
- Total Following: {{totalFollowing}}
- Engagement Level: {{engagementLevel}}

TOP CONTENT CATEGORIES:
{{topCategories}}

MOST ENGAGED ACCOUNTS:
{{topAccounts}}

RECENT SEARCHES:
{{recentSearches}}

Based on this Instagram activity, identify:
1. Their top 5 interests/passions
2. What type of content they consume most
3. Skills they might already have or be learning
4. Project ideas that would align with their interests

Respond ONLY with valid JSON (no markdown):
{
  "topInterests": ["interest1", "interest2", "interest3", "interest4", "interest5"],
  "contentThemes": ["theme1", "theme2", "theme3"],
  "suggestedSkills": ["skill1", "skill2", "skill3"],
  "personalityInsights": "2-3 sentences about what their Instagram says about them",
  "projectRecommendations": ["Short project idea 1", "Short project idea 2", "Short project idea 3"]
}`,
  },
  'tiktok-analysis': {
    name: 'TikTok Analysis',
    description: 'Prompt for analyzing TikTok data to identify interests',
    template: `Analyze this high school student's TikTok activity to identify their interests and recommend tech/coding projects.

TIKTOK ACTIVITY:
- Total Favorite Videos: {{totalFavoriteVideos}}
- Total Favorite Sounds: {{totalFavoriteSounds}}
- Total Searches: {{totalSearches}}
- Engagement Level: {{engagementLevel}}

TOP CONTENT CATEGORIES (based on searches):
{{topCategories}}

TOP SEARCHES:
{{topSearches}}

RECENT SEARCHES:
{{recentSearches}}

{{adInterestCategories}}

Based on this TikTok activity, identify:
1. Their top 5 interests/passions
2. What type of content they consume most
3. Skills they might already have or be learning
4. Project ideas that would align with their interests

Respond ONLY with valid JSON (no markdown):
{
  "topInterests": ["interest1", "interest2", "interest3", "interest4", "interest5"],
  "contentThemes": ["theme1", "theme2", "theme3"],
  "suggestedSkills": ["skill1", "skill2", "skill3"],
  "personalityInsights": "2-3 sentences about what their TikTok says about them",
  "projectRecommendations": ["Short project idea 1", "Short project idea 2", "Short project idea 3"]
}`,
  },
  'snapchat-analysis': {
    name: 'Snapchat Analysis',
    description: 'Prompt for analyzing Snapchat data to identify interests',
    template: `Analyze this high school student's Snapchat activity to identify their interests and recommend tech/coding projects.

SNAPCHAT ACTIVITY:
- Snapscore: {{snapscore}}
- Total Friends: {{totalFriends}}
- Engagement Level: {{engagementLevel}}
- Is Content Creator: {{isContentCreator}}

ENGAGEMENT METRICS:
{{engagementMetrics}}

SPOTLIGHT HASHTAGS USED (content they create/engage with):
{{topHashtags}}

CONTENT CATEGORIES:
{{topCategories}}

Based on this Snapchat activity, identify:
1. Their top 5 interests/passions (infer from engagement patterns and hashtags)
2. What type of content they consume/create most
3. Skills they might already have or be learning
4. Project ideas that would align with their interests and communication style

Note: Snapchat is primarily a communication platform, so focus on what their usage patterns and spotlight content reveal about their personality and interests.

Respond ONLY with valid JSON (no markdown):
{
  "topInterests": ["interest1", "interest2", "interest3", "interest4", "interest5"],
  "contentThemes": ["theme1", "theme2", "theme3"],
  "suggestedSkills": ["skill1", "skill2", "skill3"],
  "personalityInsights": "2-3 sentences about what their Snapchat says about them",
  "projectRecommendations": ["Short project idea 1", "Short project idea 2", "Short project idea 3"]
}`,
  },
};

export async function GET(request: NextRequest) {
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

    // Try to get prompts from database
    const { data: dbPrompts, error } = await supabase
      .from('prompt_templates')
      .select('*')
      .order('created_at', { ascending: true });

    if (error) {
      console.log('No prompt_templates table or error:', error.message);
      // Return default prompts if table doesn't exist
      return NextResponse.json({
        prompts: Object.entries(DEFAULT_PROMPTS).map(([id, prompt]) => ({
          id,
          ...prompt,
          is_default: true,
        })),
        usingDefaults: true,
      });
    }

    // Merge database prompts with defaults (database takes precedence)
    const mergedPrompts = Object.entries(DEFAULT_PROMPTS).map(([id, defaultPrompt]) => {
      const dbPrompt = dbPrompts?.find(p => p.prompt_id === id);
      if (dbPrompt) {
        return {
          id,
          name: dbPrompt.name || defaultPrompt.name,
          description: dbPrompt.description || defaultPrompt.description,
          template: dbPrompt.template,
          is_default: false,
          updated_at: dbPrompt.updated_at,
        };
      }
      return {
        id,
        ...defaultPrompt,
        is_default: true,
      };
    });

    return NextResponse.json({
      prompts: mergedPrompts,
      usingDefaults: !dbPrompts || dbPrompts.length === 0,
    });

  } catch (error: any) {
    console.error('Error fetching prompts:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch prompts' },
      { status: 500 }
    );
  }
}

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
    const { promptId, template, name, description } = body;

    if (!promptId || !template) {
      return NextResponse.json(
        { error: 'promptId and template are required' },
        { status: 400 }
      );
    }

    // Upsert the prompt
    const { data, error } = await supabase
      .from('prompt_templates')
      .upsert({
        prompt_id: promptId,
        name: name || DEFAULT_PROMPTS[promptId as keyof typeof DEFAULT_PROMPTS]?.name,
        description: description || DEFAULT_PROMPTS[promptId as keyof typeof DEFAULT_PROMPTS]?.description,
        template,
        updated_by: user.id,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'prompt_id',
      })
      .select()
      .single();

    if (error) {
      console.error('Error saving prompt:', error);
      throw new Error(`Failed to save prompt: ${error.message}`);
    }

    return NextResponse.json({
      success: true,
      prompt: data,
    });

  } catch (error: any) {
    console.error('Error saving prompt:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to save prompt' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const promptId = searchParams.get('promptId');

    if (!promptId) {
      return NextResponse.json(
        { error: 'promptId is required' },
        { status: 400 }
      );
    }

    // Delete the custom prompt (will revert to default)
    const { error } = await supabase
      .from('prompt_templates')
      .delete()
      .eq('prompt_id', promptId);

    if (error) {
      console.error('Error deleting prompt:', error);
      throw new Error(`Failed to delete prompt: ${error.message}`);
    }

    return NextResponse.json({
      success: true,
      message: 'Prompt reset to default',
    });

  } catch (error: any) {
    console.error('Error deleting prompt:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete prompt' },
      { status: 500 }
    );
  }
}
