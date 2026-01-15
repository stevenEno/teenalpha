import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import {
  getRobloxUserByUsername,
  getRobloxUserGames,
  getRobloxUserFavorites,
  getRobloxUserGroups,
  getRobloxUserBadges,
  analyzeRobloxData,
} from '@/lib/roblox';

export async function POST(request: NextRequest) {
  try {
    const { username } = await request.json();

    if (!username || typeof username !== 'string') {
      return NextResponse.json(
        { error: 'Roblox username is required' },
        { status: 400 }
      );
    }

    // Get authenticated user
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

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError?.status === 429) {
      return NextResponse.json(
        { error: 'Too many requests. Please wait a moment.' },
        { status: 429 }
      );
    }

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get Roblox user data
    let robloxUser;
    try {
      console.log('🔍 Looking up Roblox user:', username.trim());
      robloxUser = await getRobloxUserByUsername(username.trim());
      console.log('✅ Found user:', robloxUser.name, 'ID:', robloxUser.id);
    } catch (err: any) {
      console.error('❌ Roblox lookup failed:', err.message);
      
      // Provide helpful error messages
      let errorMessage = err.message;
      if (err.message.includes('ECONNRESET') || err.message.includes('fetch failed')) {
        errorMessage = 'Unable to connect to Roblox. Their servers might be busy. Please try again in 2-3 minutes.';
      } else if (err.message.includes('timeout')) {
        errorMessage = 'Roblox is taking too long to respond. Please try again.';
      }
      
      return NextResponse.json(
        { error: errorMessage },
        { status: 503 } // Service Unavailable
      );
    }

    // Fetch all Roblox data in parallel
    const [games, favorites, groups, badges] = await Promise.all([
      getRobloxUserGames(robloxUser.id),
      getRobloxUserFavorites(robloxUser.id),
      getRobloxUserGroups(robloxUser.id),
      getRobloxUserBadges(robloxUser.id),
    ]);

    // Analyze the data
    const analysis = analyzeRobloxData({
      user: robloxUser,
      games,
      favorites,
      groups,
      badges,
    });

    // Update user profile
    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        roblox_username: robloxUser.name,
        roblox_user_id: robloxUser.id,
        roblox_connected_at: new Date().toISOString(),
      })
      .eq('id', user.id);

    if (profileError) {
      console.error('Profile update error:', profileError);
      throw new Error('Failed to update profile');
    }

    // Store gaming analysis (delete old first)
    await supabase
      .from('gaming_analysis')
      .delete()
      .eq('profile_id', user.id)
      .eq('platform', 'roblox');

    const { error: analysisError } = await supabase
      .from('gaming_analysis')
      .insert({
        profile_id: user.id,
        platform: 'roblox',
        raw_data: { user: robloxUser, games, favorites, groups, badges },
        analysis: analysis,
        top_games: analysis.topGames,
        suggested_skills: [...analysis.favoriteGenres, ...analysis.skills],
      });

    if (analysisError) {
      console.error('Analysis insert error:', analysisError);
      throw new Error('Failed to save Roblox analysis');
    }

    return NextResponse.json({
      success: true,
      profile: {
        name: robloxUser.displayName,
        username: robloxUser.name,
      },
      analysis,
    });
  } catch (error: any) {
    console.error('Roblox connection error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to connect Roblox account' },
      { status: 500 }
    );
  }
}