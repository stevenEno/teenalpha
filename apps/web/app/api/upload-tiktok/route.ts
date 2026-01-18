import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import JSZip from 'jszip';
import Anthropic from '@anthropic-ai/sdk';
import { parseTikTokZip, anonymizeTikTokData } from '@/lib/tiktok-parser';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

// Maximum file size: 50MB
const MAX_FILE_SIZE = 50 * 1024 * 1024;

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

    // Get the uploaded file
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 50MB.' },
        { status: 400 }
      );
    }

    // Validate file type
    if (!file.name.endsWith('.zip')) {
      return NextResponse.json(
        { error: 'Please upload a ZIP file' },
        { status: 400 }
      );
    }

    console.log('📦 Processing TikTok ZIP:', file.name, `(${(file.size / 1024 / 1024).toFixed(2)}MB)`);

    // Read and extract ZIP file
    const arrayBuffer = await file.arrayBuffer();
    const zip = await JSZip.loadAsync(arrayBuffer);

    console.log('📂 ZIP contents:', Object.keys(zip.files).slice(0, 10).join(', '), '...');

    // Parse TikTok data
    const parsedData = await parseTikTokZip(zip);

    // Anonymize the data
    const anonymizedData = anonymizeTikTokData(parsedData);

    console.log('✅ Data anonymized:', {
      favoriteVideos: anonymizedData.totalFavoriteVideos,
      favoriteSounds: anonymizedData.totalFavoriteSounds,
      likedItems: anonymizedData.totalLikedItems,
      reposts: anonymizedData.totalReposts,
      searches: anonymizedData.totalSearches,
      totalActivity: anonymizedData.totalActivity,
      topCategories: Object.keys(anonymizedData.categories).slice(0, 5),
    });

    // Analyze with AI to create interest graph
    const interestGraph = await analyzeWithAI(anonymizedData);

    // Store in database (only anonymized insights)
    await supabase
      .from('social_media_analysis')
      .delete()
      .eq('profile_id', user.id)
      .eq('platform', 'tiktok');

    const { error: insertError } = await supabase
      .from('social_media_analysis')
      .insert({
        profile_id: user.id,
        platform: 'tiktok',
        raw_data: anonymizedData,
        analysis: interestGraph,
        top_interests: interestGraph.topInterests,
        content_themes: interestGraph.contentThemes,
        suggested_skills: interestGraph.suggestedSkills,
      });

    if (insertError) {
      console.error('Database insert error:', insertError);
      throw new Error('Failed to save analysis');
    }

    // Update profile
    await supabase
      .from('profiles')
      .update({
        tiktok_connected_at: new Date().toISOString(),
        tiktok_upload_filename: file.name,
        tiktok_upload_size_bytes: file.size,
      })
      .eq('id', user.id);

    return NextResponse.json({
      success: true,
      analysis: interestGraph,
      stats: {
        totalFavoriteVideos: anonymizedData.totalFavoriteVideos,
        totalFavoriteSounds: anonymizedData.totalFavoriteSounds,
        totalLikedItems: anonymizedData.totalLikedItems,
        totalReposts: anonymizedData.totalReposts,
        totalSearches: anonymizedData.totalSearches,
        totalActivity: anonymizedData.totalActivity,
        topCategories: Object.keys(anonymizedData.categories).slice(0, 5),
      },
      message: 'TikTok data analyzed successfully',
    });

  } catch (error: any) {
    console.error('TikTok upload error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to process TikTok data' },
      { status: 500 }
    );
  }
}

async function analyzeWithAI(anonymizedData: any) {
  const topCategories = Object.entries(anonymizedData.categories)
    .sort(([, a]: any, [, b]: any) => b - a)
    .slice(0, 10)
    .map(([cat, count]) => `${cat} (${count} mentions)`);

  const topSearches = (anonymizedData.topSearches || [])
    .slice(0, 15)
    .map((s: any) => `"${s.term}" (searched ${s.count} times)`);

  const recentSearches = (anonymizedData.recentSearches || []).slice(0, 10);

  const prompt = `Analyze this high school student's TikTok activity to identify their interests and recommend tech/coding projects.

TIKTOK ACTIVITY:
- Total Liked Videos: ${anonymizedData.totalLikedItems || 0}
- Total Favorite Videos: ${anonymizedData.totalFavoriteVideos || 0}
- Total Favorite Sounds: ${anonymizedData.totalFavoriteSounds || 0}
- Total Reposts: ${anonymizedData.totalReposts || 0}
- Total Searches: ${anonymizedData.totalSearches || 0}
- Total Activity: ${anonymizedData.totalActivity || 0}
- Engagement Level: ${anonymizedData.engagementLevel || 'unknown'}

TOP CONTENT CATEGORIES (based on searches):
${topCategories.length > 0 ? topCategories.join('\n') : 'No categories detected'}

TOP SEARCHES (what they actively look for):
${topSearches.length > 0 ? topSearches.join('\n') : 'No searches found'}

RECENT SEARCHES:
${recentSearches.length > 0 ? recentSearches.join(', ') : 'No recent searches'}

${anonymizedData.adInterestCategories && anonymizedData.adInterestCategories.length > 0 ? `AD INTEREST CATEGORIES:\n${anonymizedData.adInterestCategories.join(', ')}` : ''}

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
}`;

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

  try {
    const parsed = JSON.parse(responseText);
    return parsed;
  } catch (parseError) {
    console.error('Failed to parse AI response:', responseText);
    throw new Error('AI generated invalid response');
  }
}
