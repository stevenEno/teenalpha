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

    // Get user's profile to check their role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    let mentorsWithRelationship;

    if (profile.role === 'teen') {
      // Teens: Get their mentors
      const { data: mentorships, error } = await supabase
        .from('mentorships')
        .select(`
          id,
          status,
          invitation_message,
          created_at,
          accepted_at,
          mentor:mentor_id (
            id,
            full_name,
            email,
            avatar_url,
            bio,
            expertise,
            is_default_mentor
          )
        `)
        .eq('teen_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching mentorships:', error);
        return NextResponse.json({ error: 'Failed to fetch mentors' }, { status: 500 });
      }

      mentorsWithRelationship = (mentorships || []).map((m: any) => ({
        ...m.mentor,
        mentorship_id: m.id,
        mentorship_status: m.status,
        mentorship_message: m.invitation_message,
        mentorship_created_at: m.created_at,
        mentorship_accepted_at: m.accepted_at,
      }));
    } else if (profile.role === 'mentor') {
      // Mentors: Get their mentees
      const { data: mentorships, error } = await supabase
        .from('mentorships')
        .select(`
          id,
          status,
          invitation_message,
          created_at,
          accepted_at,
          teen:teen_id (
            id,
            full_name,
            email,
            avatar_url,
            bio,
            grade,
            school
          )
        `)
        .eq('mentor_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching mentees:', error);
        return NextResponse.json({ error: 'Failed to fetch mentees' }, { status: 500 });
      }

      mentorsWithRelationship = (mentorships || []).map((m: any) => ({
        ...m.teen,
        mentorship_id: m.id,
        mentorship_status: m.status,
        mentorship_message: m.invitation_message,
        mentorship_created_at: m.created_at,
        mentorship_accepted_at: m.accepted_at,
      }));
    } else {
      // Parents: Return empty for now
      mentorsWithRelationship = [];
    }

    return NextResponse.json({
      role: profile.role,
      connections: mentorsWithRelationship,
      count: mentorsWithRelationship.length,
    });

  } catch (error: any) {
    console.error('Mentors API error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch mentorship data' },
      { status: 500 }
    );
  }
}
