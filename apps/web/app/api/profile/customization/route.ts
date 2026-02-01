import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function GET() {
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

    const { data: customization } = await supabase
      .from('profile_customizations')
      .select('*')
      .eq('user_id', user.id)
      .single();

    const { data: unlocks } = await supabase
      .from('profile_unlocks')
      .select('*')
      .eq('user_id', user.id);

    return NextResponse.json({
      customization: customization || null,
      unlocks: unlocks || [],
    });
  } catch (error: any) {
    console.error('Profile customization GET error:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch customization' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
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

    // Verify teen role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || profile.role !== 'teen') {
      return NextResponse.json({ error: 'Only teens can customize profiles' }, { status: 403 });
    }

    const body = await request.json();

    // Validate music URL if provided
    if (body.music_url) {
      const musicPattern = /^https?:\/\/(www\.)?(youtube\.com|youtu\.be|open\.spotify\.com)\/.+/;
      if (!musicPattern.test(body.music_url)) {
        return NextResponse.json({ error: 'Only YouTube and Spotify URLs are allowed' }, { status: 400 });
      }
    }

    // Validate widget count
    if (body.widgets && Array.isArray(body.widgets) && body.widgets.length > 4) {
      return NextResponse.json({ error: 'Maximum 4 widgets allowed' }, { status: 400 });
    }

    const { data: customization, error } = await supabase
      .from('profile_customizations')
      .upsert(
        { user_id: user.id, ...body },
        { onConflict: 'user_id' }
      )
      .select()
      .single();

    if (error) {
      console.error('Profile customization upsert error:', error);
      return NextResponse.json({ error: 'Failed to save customization' }, { status: 500 });
    }

    return NextResponse.json({ customization });
  } catch (error: any) {
    console.error('Profile customization PUT error:', error);
    return NextResponse.json({ error: error.message || 'Failed to update customization' }, { status: 500 });
  }
}
