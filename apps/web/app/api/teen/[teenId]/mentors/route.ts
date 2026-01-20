import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ teenId: string }> }
) {
  try {
    const { teenId } = await params;
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

    // Verify the user is a parent connected to this teen
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || profile.role !== 'parent') {
      return NextResponse.json({ error: 'Only parents can access this endpoint' }, { status: 403 });
    }

    // Verify parent is connected to this teen
    const { data: connection } = await supabase
      .from('family_connections')
      .select('id')
      .eq('parent_id', user.id)
      .eq('teen_id', teenId)
      .eq('verified', true)
      .single();

    if (!connection) {
      return NextResponse.json({ error: 'Teen is not connected to your account' }, { status: 403 });
    }

    // Get the teen's mentors
    const { data: mentorships, error } = await supabase
      .from('mentorships')
      .select(`
        id,
        status,
        mentor:mentor_id (
          id,
          full_name,
          avatar_url,
          email,
          bio,
          expertise,
          is_default_mentor
        )
      `)
      .eq('teen_id', teenId)
      .eq('status', 'active');

    if (error) {
      console.error('Error fetching teen mentors:', error);
      return NextResponse.json({ error: 'Failed to fetch mentors' }, { status: 500 });
    }

    const mentors = (mentorships || []).map((m: any) => ({
      ...m.mentor,
      mentorship_id: m.id,
      mentorship_status: m.status,
    }));

    return NextResponse.json({
      mentors,
      count: mentors.length,
    });

  } catch (error: any) {
    console.error('Teen mentors API error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch teen mentors' },
      { status: 500 }
    );
  }
}
