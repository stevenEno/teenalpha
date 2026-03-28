import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function PATCH(request: NextRequest) {
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

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { task_id, status, proof_text, proof_url } = await request.json();

    if (!task_id || !status) {
      return NextResponse.json(
        { error: 'task_id and status are required' },
        { status: 400 }
      );
    }

    const validStatuses = ['pending', 'in_progress', 'completed', 'skipped'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` },
        { status: 400 }
      );
    }

    const updateData: Record<string, unknown> = { status };
    if (status === 'completed') {
      updateData.completed_at = new Date().toISOString();
    }
    if (proof_text !== undefined) updateData.proof_text = proof_text;
    if (proof_url !== undefined) updateData.proof_url = proof_url;

    const { data: task, error } = await supabase
      .from('sprint_tasks')
      .update(updateData)
      .eq('id', task_id)
      .select()
      .single();

    if (error) {
      console.error('Error updating sprint task:', error);
      return NextResponse.json({ error: 'Failed to update task' }, { status: 500 });
    }

    // Check if this completes the current week — auto-advance enrollment
    const { data: enrollment } = await supabase
      .from('sprint_enrollments')
      .select('id, current_week')
      .eq('id', task.enrollment_id)
      .single();

    if (enrollment && status === 'completed') {
      const { data: weekTasks } = await supabase
        .from('sprint_tasks')
        .select('id, status')
        .eq('enrollment_id', task.enrollment_id)
        .eq('week', task.week);

      const allComplete = weekTasks?.every(
        (t) => t.status === 'completed' || t.status === 'skipped'
      );

      if (allComplete && enrollment.current_week === task.week && task.week < 4) {
        await supabase
          .from('sprint_enrollments')
          .update({
            current_week: task.week + 1,
            status: 'active',
          })
          .eq('id', enrollment.id);
      }

      // If week 4 complete, mark enrollment as completed
      if (allComplete && task.week === 4) {
        await supabase
          .from('sprint_enrollments')
          .update({
            status: 'completed',
            completed_at: new Date().toISOString(),
          })
          .eq('id', enrollment.id);
      }
    }

    return NextResponse.json({ task });
  } catch (err) {
    console.error('Sprint task update error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
