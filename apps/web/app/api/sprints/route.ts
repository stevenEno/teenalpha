import { NextResponse } from 'next/server';
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

    const { data: sprints, error } = await supabase
      .from('sprints')
      .select(`
        *,
        mentor:profiles!sprints_mentor_id_fkey (
          id,
          full_name,
          avatar_url,
          bio,
          expertise
        )
      `)
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching sprints:', error);
      return NextResponse.json({ error: 'Failed to fetch sprints' }, { status: 500 });
    }

    // Get enrollment counts
    const sprintIds = sprints?.map((s) => s.id) || [];
    let enrollmentCounts: Record<string, number> = {};

    if (sprintIds.length > 0) {
      const { data: enrollments } = await supabase
        .from('sprint_enrollments')
        .select('sprint_id')
        .in('sprint_id', sprintIds)
        .in('status', ['enrolled', 'active', 'completed']);

      if (enrollments) {
        enrollmentCounts = enrollments.reduce(
          (acc, e) => {
            acc[e.sprint_id] = (acc[e.sprint_id] || 0) + 1;
            return acc;
          },
          {} as Record<string, number>
        );
      }
    }

    const sprintsWithCounts = sprints?.map((sprint) => ({
      ...sprint,
      enrolled_count: enrollmentCounts[sprint.id] || 0,
      spots_remaining: sprint.max_participants - (enrollmentCounts[sprint.id] || 0),
      price_formatted: `$${(sprint.price / 100).toFixed(0)}`,
    }));

    return NextResponse.json({ sprints: sprintsWithCounts });
  } catch (err) {
    console.error('Sprints API error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
