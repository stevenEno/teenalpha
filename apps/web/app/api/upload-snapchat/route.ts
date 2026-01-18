import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import JSZip from 'jszip';
import Anthropic from '@anthropic-ai/sdk';
import { parseSnapchatZip, anonymizeSnapchatData } from '@/lib/snapchat-parser';

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

    console.log('📦 Processing Snapchat ZIP:', file.name, `(${(file.size / 1024 / 1024).toFixed(2)}MB)`);

    // Read and extract ZIP file
    const arrayBuffer = await file.arrayBuffer();
    const zip = await JSZip.loadAsync(arrayBuffer);

    console.log('📂 ZIP contents:', Object.keys(zip.files).slice(0, 10).join(', '), '...');

    // Parse Snapchat data
    const parsedData = await parseSnapchatZip(zip);

    // Anonymize the data
    const anonymizedData = anonymizeSnapchatData(parsedData);

    console.log('✅ Data anonymized:', {
      snapscore: anonymizedData.snapscore,
      friends: anonymizedData.totalFriends,
      topHashtags: anonymizedData.topHashtags.slice(0, 5).map(h => h.hashtag),
      topCategories: Object.keys(anonymizedData.categories).slice(0, 5),
    });

    // Analyze with AI to create interest graph
    const interestGraph = await analyzeWithAI(anonymizedData);

    // Store in database (only anonymized insights)
    await supabase
      .from('social_media_analysis')
      .delete()
      .eq('profile_id', user.id)
      .eq('platform', 'snapchat');

    const { error: insertError } = await supabase
      .from('social_media_analysis')
      .insert({
        profile_id: user.id,
        platform: 'snapchat',
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
        snapchat_connected_at: new Date().toISOString(),
        snapchat_upload_filename: file.name,
        snapchat_upload_size_bytes: file.size,
      })
      .eq('id', user.id);

    return NextResponse.json({
      success: true,
      analysis: interestGraph,
      stats: {
        snapscore: anonymizedData.snapscore,
        totalFriends: anonymizedData.totalFriends,
        engagement: anonymizedData.engagement,
        isContentCreator: anonymizedData.isContentCreator,
        topCategories: Object.keys(anonymizedData.categories).slice(0, 5),
      },
      message: 'Snapchat data analyzed successfully',
    });

  } catch (error: any) {
    console.error('Snapchat upload error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to process Snapchat data' },
      { status: 500 }
    );
  }
}

async function analyzeWithAI(anonymizedData: any) {
  const topCategories = Object.entries(anonymizedData.categories)
    .sort(([, a]: any, [, b]: any) => b - a)
    .slice(0, 10)
    .map(([cat, count]) => `${cat} (${count} mentions)`);

  const topHashtags = anonymizedData.topHashtags
    .slice(0, 15)
    .map((h: any) => `#${h.hashtag} (used ${h.count} times)`);

  const engagement = anonymizedData.engagement;

  const prompt = `Analyze this high school student's Snapchat activity to identify their interests and recommend tech/coding projects.

SNAPCHAT ACTIVITY:
- Snapscore: ${anonymizedData.snapscore.toLocaleString()}
- Total Friends: ${anonymizedData.totalFriends}
- Engagement Level: ${anonymizedData.engagementLevel}
- Is Content Creator: ${anonymizedData.isContentCreator}

ENGAGEMENT METRICS:
- Snaps Sent: ${engagement.snapsSent.toLocaleString()}
- Snaps Viewed: ${engagement.snapsViewed.toLocaleString()}
- Chats Sent: ${engagement.chatsSent.toLocaleString()}
- Chats Viewed: ${engagement.chatsViewed.toLocaleString()}
- Story Posts Created: ${engagement.storyPostsCreated}
- Story Views Received: ${engagement.storyViewsReceived.toLocaleString()}
- Story Replies Received: ${engagement.storyRepliesReceived}
- App Opens: ${engagement.applicationOpens.toLocaleString()}

SPOTLIGHT HASHTAGS USED (content they create/engage with):
${topHashtags.length > 0 ? topHashtags.join('\n') : 'No spotlight hashtags found'}

CONTENT CATEGORIES:
${topCategories.length > 0 ? topCategories.join('\n') : 'Unable to categorize from hashtags'}

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
