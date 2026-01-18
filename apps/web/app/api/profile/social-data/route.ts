import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

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

    // Get user profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    // Get all social media analyses
    const { data: socialAnalyses } = await supabase
      .from('social_media_analysis')
      .select('*')
      .eq('profile_id', user.id)
      .order('created_at', { ascending: false });

    // Build profile description for each platform (same logic as recommend-projects)
    const platformData = (socialAnalyses || []).map((analysis) => {
      const platform = analysis.platform;
      const rawData = analysis.raw_data || {};
      const aiAnalysis = analysis.analysis || {};

      let profileDescription = '';

      if (platform === 'instagram') {
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
      } else if (platform === 'tiktok') {
        const topSearches = rawData.topSearches || [];
        profileDescription = `SOCIAL MEDIA PROFILE (TikTok):
- Total Liked Videos: ${rawData.totalLikedItems || 0}
- Total Favorite Videos: ${rawData.totalFavoriteVideos || 0}
- Total Favorite Sounds: ${rawData.totalFavoriteSounds || 0}
- Total Reposts: ${rawData.totalReposts || 0}
- Total Searches: ${rawData.totalSearches || 0}
- Total Activity: ${rawData.totalActivity || 0}
- Engagement Level: ${rawData.engagementLevel || 'unknown'}
- Top Interests: ${aiAnalysis.topInterests?.join(', ') || 'unknown'}
- Content Themes: ${aiAnalysis.contentThemes?.join(', ') || 'unknown'}

TOP SEARCHES (what they actively look for):
${topSearches.slice(0, 10).map((s: any) => `- "${s.term}" (${s.count}x)`).join('\n') || 'No searches found'}

TOP CONTENT CATEGORIES:
${Object.entries(rawData.categories || {})
  .slice(0, 8)
  .map(([cat, count]) => `- ${cat}: ${count} mentions`)
  .join('\n') || 'No categories detected'}

AI PERSONALITY INSIGHTS:
${aiAnalysis.personalityInsights || 'No insights available'}

ALREADY SUGGESTED SKILLS:
${aiAnalysis.suggestedSkills?.join(', ') || 'None yet'}`;
      } else if (platform === 'snapchat') {
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

      return {
        platform,
        createdAt: analysis.created_at,
        updatedAt: analysis.updated_at,
        rawData,
        aiAnalysis,
        profileDescription,
        // Summary stats
        stats: {
          categoriesDetected: Object.keys(rawData.categories || {}).length,
          topInterestsCount: aiAnalysis.topInterests?.length || 0,
          suggestedSkillsCount: aiAnalysis.suggestedSkills?.length || 0,
        },
      };
    });

    return NextResponse.json({
      profile: {
        id: profile?.id,
        email: profile?.email,
        instagramConnectedAt: profile?.instagram_connected_at,
        tiktokConnectedAt: profile?.tiktok_connected_at,
        snapchatConnectedAt: profile?.snapchat_connected_at,
        instagramFilename: profile?.instagram_upload_filename,
        tiktokFilename: profile?.tiktok_upload_filename,
        snapchatFilename: profile?.snapchat_upload_filename,
      },
      platforms: platformData,
    });

  } catch (error: any) {
    console.error('Error fetching social data:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch social data' },
      { status: 500 }
    );
  }
}
