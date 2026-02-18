import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import JSZip from 'jszip';
import { parseInstagramZip, anonymizeInstagramData } from '@/lib/instagram-parser';
import { generateText } from '@/lib/ai';

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

    console.log('📦 Processing Instagram ZIP:', file.name, `(${(file.size / 1024 / 1024).toFixed(2)}MB)`);

    // Read and extract ZIP file
    const arrayBuffer = await file.arrayBuffer();
    const zip = await JSZip.loadAsync(arrayBuffer);

    console.log('📂 ZIP contents:', Object.keys(zip.files).slice(0, 10).join(', '), '...');

    // Parse Instagram data
    const parsedData = await parseInstagramZip(zip);

    // Anonymize the data
    const anonymizedData = anonymizeInstagramData(parsedData);

    console.log('✅ Data anonymized:', {
      likedPosts: anonymizedData.totalLikedPosts,
      postsViewed: anonymizedData.totalPostsViewed,
      videosWatched: anonymizedData.totalVideosWatched,
      following: anonymizedData.totalFollowing,
      searches: anonymizedData.totalSearches,
      topCategories: Object.keys(anonymizedData.categories).slice(0, 5),
    });

    // Analyze with AI to create interest graph
    const interestGraph = await analyzeWithAI(anonymizedData);

    // Store in database (only anonymized insights)
    await supabase
      .from('social_media_analysis')
      .delete()
      .eq('profile_id', user.id)
      .eq('platform', 'instagram');

    const { error: insertError } = await supabase
      .from('social_media_analysis')
      .insert({
        profile_id: user.id,
        platform: 'instagram',
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
    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        instagram_connected_at: new Date().toISOString(),
        instagram_upload_filename: file.name,
        instagram_upload_size_bytes: file.size,
      })
      .eq('id', user.id);

    if (profileError) {
      console.error('Profile update error:', profileError);
      // Don't throw - the analysis was saved, just log the error
    } else {
      console.log('✅ Profile updated with Instagram connection');
    }

    return NextResponse.json({
      success: true,
      analysis: interestGraph,
      stats: {
        totalLikedPosts: anonymizedData.totalLikedPosts,
        totalPostsViewed: anonymizedData.totalPostsViewed,
        totalVideosWatched: anonymizedData.totalVideosWatched,
        totalFollowing: anonymizedData.totalFollowing,
        topCategories: Object.keys(anonymizedData.categories).slice(0, 5),
      },
      message: 'Instagram data analyzed successfully',
    });

  } catch (error: any) {
    console.error('Instagram upload error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to process Instagram data' },
      { status: 500 }
    );
  }
}

async function analyzeWithAI(anonymizedData: any) {
  const topCategories = Object.entries(anonymizedData.categories)
    .sort(([, a]: any, [, b]: any) => b - a)
    .slice(0, 10)
    .map(([cat, count]) => `${cat} (${count} signals)`);

  // Get all engagement signals
  const topEngaged = (anonymizedData.topEngagedAccounts || [])
    .slice(0, 15)
    .map((a: any) => `${a.account} (liked ${a.count}x)`);

  const topViewed = (anonymizedData.topViewedCreators || [])
    .slice(0, 15)
    .map((a: any) => `${a.account} (viewed ${a.count}x)`);

  const topWatched = (anonymizedData.topWatchedCreators || [])
    .slice(0, 15)
    .map((a: any) => `${a.account} (watched ${a.count}x)`);

  const topSaved = (anonymizedData.topSavedAccounts || [])
    .slice(0, 10)
    .map((a: any) => `${a.account} (saved ${a.count}x)`);

  const topDomains = (anonymizedData.topDomainsVisited || [])
    .slice(0, 10)
    .map((d: any) => `${d.domain} (${d.count}x)`);

  const prompt = `Analyze this high school student's Instagram activity to identify their interests and recommend tech/coding projects.

INSTAGRAM ACTIVITY SUMMARY:
- Total Posts Liked: ${anonymizedData.totalLikedPosts || 0}
- Total Comments Liked: ${anonymizedData.totalLikedComments || 0}
- Total Following: ${anonymizedData.totalFollowing || 0}
- Total Followers: ${anonymizedData.totalFollowers || 0}
- Total Posts Viewed: ${anonymizedData.totalPostsViewed || 0}
- Total Videos Watched: ${anonymizedData.totalVideosWatched || 0}
- Total Saved Posts: ${anonymizedData.totalSavedPosts || 0}
- Total Searches: ${anonymizedData.totalSearches || 0}
- Content Creator: ${anonymizedData.isContentCreator ? 'Yes' : 'No'}
- Engagement Level: ${anonymizedData.engagementLevel || 'unknown'}

TOP CONTENT CATEGORIES (detected from all activity):
${topCategories.join('\n') || 'None detected'}

MOST LIKED ACCOUNTS (shows active engagement):
${topEngaged.join('\n') || 'No data'}

MOST VIEWED CREATORS (posts they scroll through):
${topViewed.join('\n') || 'No data'}

MOST WATCHED VIDEO CREATORS:
${topWatched.join('\n') || 'No data'}

SAVED CONTENT (valuable/reference material):
${topSaved.join('\n') || 'No data'}

INSTAGRAM'S OWN INTEREST CATEGORIES (ad targeting):
${(anonymizedData.adTargetingCategories || []).slice(0, 15).join(', ') || 'Not available'}

TOPIC INTERESTS (Instagram's detected interests):
${(anonymizedData.topicInterests || []).slice(0, 15).join(', ') || 'Not available'}

AD INTERESTS:
${(anonymizedData.adInterests || []).slice(0, 15).join(', ') || 'Not available'}

RECENT SEARCHES (what they actively look for):
- Word/Phrase: ${(anonymizedData.recentWordSearches || []).slice(0, 15).join(', ') || 'None'}
- Hashtags: ${(anonymizedData.recentTagSearches || []).slice(0, 10).join(', ') || 'None'}
- Accounts: ${(anonymizedData.recentAccountSearches || []).slice(0, 10).join(', ') || 'None'}

EXTERNAL LINKS CLICKED (top domains):
${topDomains.join('\n') || 'No data'}

USER'S OWN CONTENT (if content creator):
- Post captions: ${(anonymizedData.postCaptions || []).slice(0, 5).join(' | ') || 'None'}
- Reel captions: ${(anonymizedData.reelCaptions || []).slice(0, 3).join(' | ') || 'None'}
- Sample comments: ${(anonymizedData.sampleComments || []).slice(0, 5).join(' | ') || 'None'}

Based on this comprehensive Instagram activity data, provide a detailed analysis:
1. Identify their top 5-7 specific interests/passions (be specific, not generic)
2. What types of content do they consume most and why
3. Skills they might already have or be developing
4. Personality insights based on consumption patterns
5. Tech/coding project ideas that would genuinely excite them

Respond ONLY with valid JSON (no markdown):
{
  "topInterests": ["specific interest 1", "specific interest 2", "specific interest 3", "specific interest 4", "specific interest 5"],
  "contentThemes": ["theme1", "theme2", "theme3", "theme4"],
  "suggestedSkills": ["skill1", "skill2", "skill3", "skill4"],
  "personalityInsights": "3-4 sentences analyzing their Instagram behavior and what it reveals about their personality, learning style, and motivations",
  "projectRecommendations": ["Specific project idea 1 that connects to their interests", "Specific project idea 2", "Specific project idea 3"]
}`;

  const responseText = await generateText({
    prompt,
    maxTokens: 2000,
    temperature: 1,
  });

  try {
    const parsed = JSON.parse(responseText);
    return parsed;
  } catch (parseError) {
    console.error('Failed to parse AI response:', responseText);
    throw new Error('AI generated invalid response');
  }
}