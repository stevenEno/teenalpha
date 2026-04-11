import { NextRequest, NextResponse } from 'next/server';
import { getAuthedSupabase } from '@/lib/api-auth';

export async function GET(request: NextRequest) {
  try {
    const { user, supabase, error: authError } = await getAuthedSupabase();
    if (authError) return authError;

    const { searchParams } = new URL(request.url);
    const teenId = searchParams.get('teen_id');

    // Get enrollments - for teens get their own, for parents get their teens'
    let query = supabase
      .from('sprint_enrollments')
      .select(`
        *,
        sprint:sprints (
          id, title, description, duration_weeks, mentor_id,
          mentor:profiles!sprints_mentor_id_fkey (
            id, full_name, avatar_url
          )
        ),
        tasks:sprint_tasks (
          id, week, title, description, task_type, order_index, status, proof_text, proof_url, completed_at
        )
      `)
      .order('enrolled_at', { ascending: false });

    if (teenId) {
      query = query.eq('teen_id', teenId);
    } else {
      // Default: get current user's enrollments (teen) or their family's (parent)
      query = query.or(`teen_id.eq.${user!.id},family_id.eq.${user!.id}`);
    }

    const { data: enrollments, error } = await query;

    if (error) {
      console.error('Error fetching sprint enrollments:', error);
      return NextResponse.json({ error: 'Failed to fetch enrollments' }, { status: 500 });
    }

    // Sort tasks by week and order_index
    const enriched = enrollments?.map((enrollment) => {
      const tasks = (enrollment.tasks || []).sort(
        (a: { week: number; order_index: number }, b: { week: number; order_index: number }) =>
          a.week - b.week || a.order_index - b.order_index
      );

      const totalTasks = tasks.length;
      const completedTasks = tasks.filter(
        (t: { status: string }) => t.status === 'completed'
      ).length;
      const progressPercent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

      // Group tasks by week
      const weeklyTasks: Record<number, typeof tasks> = {};
      for (const task of tasks) {
        if (!weeklyTasks[task.week]) weeklyTasks[task.week] = [];
        weeklyTasks[task.week].push(task);
      }

      return {
        ...enrollment,
        tasks,
        weekly_tasks: weeklyTasks,
        total_tasks: totalTasks,
        completed_tasks: completedTasks,
        progress_percent: progressPercent,
      };
    });

    return NextResponse.json({ enrollments: enriched });
  } catch (err) {
    console.error('Sprint enrollment API error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
