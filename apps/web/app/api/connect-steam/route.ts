import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { getSteamGames, getSteamPlayerSummary, analyzeGamingData } from '@/lib/steam';

async function resolveSteamId(input: string): Promise<string> {
  const apiKey = process.env.STEAM_API_KEY;
  if (!apiKey) throw new Error('Steam API key not configured');

  // Handle Steam ID directly (17 digits)
  if (/^\d{17}$/.test(input.trim())) {
    return input.trim();
  }

  // Handle custom URL (steamcommunity.com/id/username)
  const customUrlMatch = input.match(/steamcommunity\.com\/id\/([^/?]+)/);
  if (customUrlMatch) {
    const vanityUrl = customUrlMatch[1];
    
    const url = `https://api.steampowered.com/ISteamUser/ResolveVanityURL/v1/?key=${apiKey}&vanityurl=${vanityUrl}`;
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.response?.success === 1) {
      return data.response.steamid;
    }
    throw new Error('Could not find Steam profile with that custom URL');
  }

  // Handle numeric profile URL
  const numericMatch = input.match(/steamcommunity\.com\/profiles\/(\d{17})/);
  if (numericMatch) {
    return numericMatch[1];
  }

  // Try as vanity URL directly (without the full URL)
  if (/^[a-zA-Z0-9_-]+$/.test(input.trim())) {
    const url = `https://api.steampowered.com/ISteamUser/ResolveVanityURL/v1/?key=${apiKey}&vanityurl=${input.trim()}`;
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.response?.success === 1) {
      return data.response.steamid;
    }
  }

  throw new Error('Invalid Steam ID or profile URL. Please try your numeric Steam ID instead.');
}

export async function POST(request: NextRequest) {
  try {
    const { steamId: inputSteamId } = await request.json();

    if (!inputSteamId) {
      return NextResponse.json(
        { error: 'Steam ID or profile URL is required' },
        { status: 400 }
      );
    }

    // Resolve to numeric Steam ID
    let steamId: string;
    try {
      steamId = await resolveSteamId(inputSteamId);
    } catch (err: any) {
      return NextResponse.json(
        { error: err.message },
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

    if (authError) {
      console.error('Auth error:', authError);
      if (authError.status === 429) {
        return NextResponse.json(
          { error: 'Too many requests. Please wait a moment and try again.' },
          { status: 429 }
        );
      }
    }

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Fetch Steam data
    let profile, games;
    try {
      [profile, games] = await Promise.all([
        getSteamPlayerSummary(steamId),
        getSteamGames(steamId),
      ]);
    } catch (err: any) {
      return NextResponse.json(
        { error: 'Failed to fetch Steam data. Make sure your profile is public.' },
        { status: 400 }
      );
    }

    // Analyze gaming data
    const analysis = analyzeGamingData(games);

    // Update user profile
    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        steam_id: steamId,
        steam_profile_name: profile.personaname,
        steam_connected_at: new Date().toISOString(),
      })
      .eq('id', user.id);

    if (profileError) {
      console.error('Profile update error:', profileError);
      throw new Error('Failed to update profile');
    }

    // Store gaming analysis (delete old first, then insert new)
    const { error: deleteError } = await supabase
      .from('gaming_analysis')
      .delete()
      .eq('profile_id', user.id)
      .eq('platform', 'steam');

    // Ignore delete error (might not exist)

    const { error: analysisError } = await supabase
      .from('gaming_analysis')
      .insert({
        profile_id: user.id,
        platform: 'steam',
        raw_data: { games, profile },
        analysis: analysis,
        top_games: analysis.topGames,
        suggested_skills: analysis.genres,
      });

    if (analysisError) {
      console.error('Analysis insert error:', analysisError);
      throw new Error('Failed to save gaming analysis');
    }

    return NextResponse.json({
      success: true,
      profile: {
        name: profile.personaname,
        avatar: profile.avatarfull,
      },
      analysis,
    });
  } catch (error: any) {
    console.error('Steam connection error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to connect Steam account' },
      { status: 500 }
    );
  }
}