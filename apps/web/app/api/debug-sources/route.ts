import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function GET() {
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
    return NextResponse.json({ error: 'Not logged in' }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  const { data: gaming } = await supabase
    .from('gaming_analysis')
    .select('platform, created_at, analysis, raw_data')
    .eq('profile_id', user.id);

  const { data: social } = await supabase
    .from('social_media_analysis')
    .select('platform, created_at, analysis, raw_data')
    .eq('profile_id', user.id);

  const { data: recommendations } = await supabase
    .from('project_recommendations')
    .select('id, title, source_platform, created_at')
    .eq('profile_id', user.id);

  return NextResponse.json({
    user_id: user.id,
    email: user.email,
    profile: {
      steam_id: profile?.steam_id || null,
      roblox_username: profile?.roblox_username || null,
      instagram_connected_at: profile?.instagram_connected_at || null,
      instagram_filename: profile?.instagram_upload_filename || null,
      instagram_size_mb: profile?.instagram_upload_size_bytes 
        ? (profile.instagram_upload_size_bytes / 1024 / 1024).toFixed(2) 
        : null,
    },
    data_sources: {
      gaming_analysis: gaming?.map(g => ({
        platform: g.platform,
        created_at: g.created_at,
        has_analysis: !!g.analysis,
        has_raw_data: !!g.raw_data,
      })) || [],
      social_media_analysis: social?.map(s => ({
        platform: s.platform,
        created_at: s.created_at,
        has_analysis: !!s.analysis,
        has_raw_data: !!s.raw_data,
        total_likes: (s.raw_data as any)?.totalLikes || 0,
        total_following: (s.raw_data as any)?.totalFollowing || 0,
        top_interests: (s.analysis as any)?.topInterests || [],
      })) || [],
    },
    recommendations: recommendations?.map(r => ({
      id: r.id,
      title: r.title,
      source: r.source_platform,
      created_at: r.created_at,
    })) || [],
    summary: {
      total_data_sources: (gaming?.length || 0) + (social?.length || 0),
      total_recommendations: recommendations?.length || 0,
      has_instagram: !!profile?.instagram_connected_at,
      has_steam: !!profile?.steam_id,
      has_roblox: !!profile?.roblox_username,
    }
  }, {
    headers: {
      'Content-Type': 'application/json',
    }
  });
}