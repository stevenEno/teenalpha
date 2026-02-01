import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;
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

    // Get current user (optional - for mentor access check)
    const { data: { user } } = await supabase.auth.getUser();

    const { data: customization } = await supabase
      .from('profile_customizations')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (!customization) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    // Check privacy
    if (customization.visibility === 'private') {
      // Allow the owner to see their own private profile
      if (user?.id === userId) {
        return NextResponse.json({ customization });
      }

      // Allow mentors to see their mentee's private profile
      if (user) {
        const { data: mentorship } = await supabase
          .from('mentorships')
          .select('id')
          .eq('mentor_id', user.id)
          .eq('teen_id', userId)
          .eq('status', 'active')
          .single();

        if (mentorship) {
          return NextResponse.json({ customization });
        }
      }

      return NextResponse.json({ error: 'Profile is private' }, { status: 404 });
    }

    // For 'basic' visibility, return limited fields
    if (customization.visibility === 'basic' && user?.id !== userId) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, avatar_url')
        .eq('id', userId)
        .single();

      return NextResponse.json({
        customization: {
          user_id: customization.user_id,
          avatar_type: customization.avatar_type,
          avatar_preset: customization.avatar_preset,
          banner_type: customization.banner_type,
          banner_color: customization.banner_color,
          banner_image_path: customization.banner_image_path,
          theme_palette: customization.theme_palette,
          theme_font: customization.theme_font,
          interests: customization.interests,
          visibility: customization.visibility,
        },
        profile,
      });
    }

    // Full visibility - get profile data too
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name, avatar_url, bio')
      .eq('id', userId)
      .single();

    return NextResponse.json({ customization, profile });
  } catch (error: any) {
    console.error('Public profile GET error:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch profile' }, { status: 500 });
  }
}
