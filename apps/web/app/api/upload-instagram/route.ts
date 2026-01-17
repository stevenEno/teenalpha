import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import JSZip from 'jszip';
import Anthropic from '@anthropic-ai/sdk';
import { parseInstagramZip, anonymizeInstagramData } from '@/lib/instagram-parser';

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
      likes: anonymizedData.totalLikes,
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
    await supabase
      .from('profiles')
      .update({
        instagram_connected_at: new Date().toISOString(),
        instagram_upload_filename: file.name,
        instagram_upload_size_bytes: file.size,
      })
      .eq('id', user.id);

    return NextResponse.json({
      success: true,
      analysis: interestGraph,
      stats: {
        totalLikes: anonymizedData.totalLikes,
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
    .map(([cat, count]) => `${cat} (${count} mentions)`);

  const topAccounts = anonymizedData.topAccounts
    .slice(0, 15)
    .map((a: any) => `${a.account} (liked ${a.count} times)`);

  const prompt = `Analyze this high school student's Instagram activity to identify their interests and recommend tech/coding projects.

INSTAGRAM ACTIVITY:
- Total Likes: ${anonymizedData.totalLikes}
- Total Following: ${anonymizedData.totalFollowing}
- Engagement Level: ${anonymizedData.engagementLevel}

TOP CONTENT CATEGORIES:
${topCategories.join('\n')}

MOST ENGAGED ACCOUNTS:
${topAccounts.join('\n')}

RECENT SEARCHES:
${anonymizedData.recentSearches.slice(0, 10).join(', ')}

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