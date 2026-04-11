import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getAuthedSupabase } from '@/lib/api-auth';

const TaskUpdateSchema = z.object({
  task_id: z.string().uuid(),
  status: z.enum(['pending', 'in_progress', 'completed', 'skipped']),
  proof_text: z.string().max(500).optional(),
  proof_url: z.string().url().optional(),
});

export async function PATCH(request: NextRequest) {
  try {
    const { user, supabase, error: authError } = await getAuthedSupabase();
    if (authError) return authError;

    const body = await request.json();
    const parsed = TaskUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { task_id, status, proof_text, proof_url } = parsed.data;

    // Verify task ownership: task must belong to an enrollment owned by this user
    const { data: taskCheck } = await supabase
      .from('sprint_tasks')
      .select('id, enrollment_id, week')
      .eq('id', task_id)
      .single();

    if (!taskCheck) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    const { data: enrollment } = await supabase
      .from('sprint_enrollments')
      .select('id, teen_id, current_week')
      .eq('id', taskCheck.enrollment_id)
      .single();

    if (!enrollment || enrollment.teen_id !== user!.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
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

    // Check if this completes the current week, auto-advance enrollment
    if (status === 'completed') {
      const { data: weekTasks } = await supabase
        .from('sprint_tasks')
        .select('id, status')
        .eq('enrollment_id', taskCheck.enrollment_id)
        .eq('week', taskCheck.week);

      const allComplete = weekTasks?.every(
        (t) => t.status === 'completed' || t.status === 'skipped'
      );

      if (allComplete && enrollment.current_week === taskCheck.week && taskCheck.week < 4) {
        const { error: advanceError } = await supabase
          .from('sprint_enrollments')
          .update({
            current_week: taskCheck.week + 1,
            status: 'active',
          })
          .eq('id', enrollment.id);

        if (advanceError) {
          console.error('Error advancing sprint week:', advanceError);
        }
      }

      if (allComplete && taskCheck.week === 4) {
        const { error: completeError } = await supabase
          .from('sprint_enrollments')
          .update({
            status: 'completed',
            completed_at: new Date().toISOString(),
          })
          .eq('id', enrollment.id);

        if (completeError) {
          console.error('Error completing sprint enrollment:', completeError);
        }
      }
    }

    return NextResponse.json({ task });
  } catch (err) {
    console.error('Sprint task update error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
