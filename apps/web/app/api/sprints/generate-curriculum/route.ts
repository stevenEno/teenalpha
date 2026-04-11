import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getAuthedSupabase } from '@/lib/api-auth';
import { generateText } from '@/lib/ai';

const GenerateCurriculumSchema = z.object({
  enrollment_id: z.string().uuid(),
});

function sanitizeForPrompt(input: string): string {
  return input
    .replace(/[^a-zA-Z0-9\s\-,.]/g, '')
    .slice(0, 100)
    .trim();
}

export async function POST(request: NextRequest) {
  try {
    const { user, supabase, error: authError } = await getAuthedSupabase();
    if (authError) return authError;

    const body = await request.json();
    const parsed = GenerateCurriculumSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { enrollment_id } = parsed.data;

    // Fetch enrollment with sprint details
    const { data: enrollment, error: enrollError } = await supabase
      .from('sprint_enrollments')
      .select(`
        *,
        sprint:sprints (
          id, title, description, mentor_id
        )
      `)
      .eq('id', enrollment_id)
      .single();

    if (enrollError || !enrollment) {
      return NextResponse.json({ error: 'Enrollment not found' }, { status: 404 });
    }

    // Verify user is the enrolled teen, the parent, or the mentor
    const isAuthorized =
      user!.id === enrollment.teen_id ||
      user!.id === enrollment.family_id ||
      (enrollment.sprint?.mentor_id && user!.id === enrollment.sprint.mentor_id);

    if (!isAuthorized) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Race condition guard: check if curriculum already requested
    if (enrollment.curriculum_requested_at) {
      return NextResponse.json(
        { error: 'Curriculum already requested for this enrollment' },
        { status: 409 }
      );
    }

    // Atomically mark as requested to prevent double generation
    const { error: lockError } = await supabase
      .from('sprint_enrollments')
      .update({ curriculum_requested_at: new Date().toISOString() })
      .eq('id', enrollment_id)
      .is('curriculum_requested_at', null);

    if (lockError) {
      return NextResponse.json(
        { error: 'Curriculum generation already in progress' },
        { status: 409 }
      );
    }

    // Get teen's interests from social media analysis
    const { data: analyses } = await supabase
      .from('social_media_analysis')
      .select('interests, personality_traits, top_interests, content_themes')
      .eq('profile_id', enrollment.teen_id);

    const interests: string[] = [];
    if (analyses) {
      for (const a of analyses) {
        if (a.interests) interests.push(...a.interests);
        if (a.top_interests) interests.push(...a.top_interests);
        if (a.content_themes) interests.push(...a.content_themes);
      }
    }

    // Get teen's profile for additional context
    const { data: teenProfile } = await supabase
      .from('profiles')
      .select('full_name, grade, school, onboarding_interest')
      .eq('id', enrollment.teen_id)
      .single();

    // Sanitize all user-derived data before prompt injection
    const sanitizedInterests = [...new Set(interests)]
      .filter((i) => typeof i === 'string' && i.length > 0)
      .map(sanitizeForPrompt)
      .filter((i) => i.length > 0)
      .slice(0, 10);

    const interestStr =
      sanitizedInterests.join(', ') ||
      sanitizeForPrompt(teenProfile?.onboarding_interest || '') ||
      'technology, creativity, entrepreneurship';

    const safeName = sanitizeForPrompt(teenProfile?.full_name || 'Teen');
    const safeGrade = sanitizeForPrompt(teenProfile?.grade || 'unknown');
    const safeProject = sanitizeForPrompt(enrollment.project_title || '');

    const prompt = `You are generating a 4-week "First Dollar Sprint" curriculum for a teen.

TEEN INFO:
- Name: ${safeName}
- Grade: ${safeGrade}
- Interests: ${interestStr}
${safeProject ? `- Chosen project: ${safeProject}` : '- Project: not yet chosen (Week 1 will help them choose)'}

SPRINT STRUCTURE:
- Week 1: DISCOVER — Pick a project through mentor session + exploration tasks
- Week 2: BUILD — Start building the project with concrete daily steps
- Week 3: LEVEL UP — Polish, get feedback, prepare to launch
- Week 4: SHIP & EARN — Launch the project and earn the first dollar

RULES:
- Generate 4-5 tasks per week (16-20 total)
- Each task should be concrete and completable in 15-45 minutes
- Tasks should build on each other within each week
- Week 1 tasks should help them explore and choose a project direction
- Week 2-3 tasks should be specific build steps (not vague like "work on project")
- Week 4 tasks should include: create a landing page or listing, share with 10 people, make the first sale, reflect on what they learned
- task_type must be one of: "action", "session", "build", "ship", "earn"
- Week 1 should have exactly one "session" task (the mentor meeting)
- Week 4 should have at least one "ship" and one "earn" task
- Make tasks feel exciting and teen-friendly, not like homework

Respond with valid JSON only (no markdown):
{
  "weeks": [
    {
      "week": 1,
      "tasks": [
        {
          "title": "short action title",
          "description": "what to do and why",
          "task_type": "action|session|build|ship|earn",
          "order_index": 0
        }
      ]
    }
  ]
}`;

    let responseText: string;
    try {
      responseText = await generateText({
        prompt,
        maxTokens: 3000,
        temperature: 0.8,
      });
    } catch (aiError) {
      console.error('AI generation failed:', aiError);
      // Reset the lock so user can retry
      await supabase
        .from('sprint_enrollments')
        .update({ curriculum_requested_at: null })
        .eq('id', enrollment_id);
      return NextResponse.json(
        { error: 'AI service unavailable. Please try again.' },
        { status: 503 }
      );
    }

    let curriculum;
    try {
      curriculum = JSON.parse(responseText);
    } catch {
      console.error('Failed to parse curriculum AI response:', responseText?.slice(0, 500));
      await supabase
        .from('sprint_enrollments')
        .update({ curriculum_requested_at: null })
        .eq('id', enrollment_id);
      return NextResponse.json(
        { error: 'AI generated invalid response. Please try again.' },
        { status: 500 }
      );
    }

    if (!Array.isArray(curriculum.weeks) || curriculum.weeks.length === 0) {
      await supabase
        .from('sprint_enrollments')
        .update({ curriculum_requested_at: null })
        .eq('id', enrollment_id);
      return NextResponse.json({ error: 'No curriculum generated' }, { status: 500 });
    }

    // Flatten and validate tasks
    const validTypes = ['action', 'session', 'build', 'ship', 'earn'];
    const taskRows = curriculum.weeks.flatMap(
      (week: { week: number; tasks: Array<{ title: string; description: string; task_type: string; order_index: number }> }) =>
        (week.tasks || []).map(
          (task: { title: string; description: string; task_type: string; order_index: number }, idx: number) => ({
            enrollment_id,
            week: Math.min(4, Math.max(1, week.week)),
            title: String(task.title || '').slice(0, 200),
            description: String(task.description || '').slice(0, 1000),
            task_type: validTypes.includes(task.task_type) ? task.task_type : 'action',
            order_index: task.order_index ?? idx,
            status: 'pending',
          })
        )
    );

    if (taskRows.length === 0) {
      await supabase
        .from('sprint_enrollments')
        .update({ curriculum_requested_at: null })
        .eq('id', enrollment_id);
      return NextResponse.json({ error: 'No tasks in generated curriculum' }, { status: 500 });
    }

    const { data: insertedTasks, error: insertError } = await supabase
      .from('sprint_tasks')
      .insert(taskRows)
      .select()
      .order('week', { ascending: true })
      .order('order_index', { ascending: true });

    if (insertError) {
      console.error('Error inserting sprint tasks:', insertError);
      await supabase
        .from('sprint_enrollments')
        .update({ curriculum_requested_at: null })
        .eq('id', enrollment_id);
      return NextResponse.json({ error: 'Failed to save curriculum' }, { status: 500 });
    }

    // Mark enrollment as active
    await supabase
      .from('sprint_enrollments')
      .update({ status: 'active', started_at: new Date().toISOString() })
      .eq('id', enrollment_id);

    return NextResponse.json({
      tasks: insertedTasks,
      total: insertedTasks?.length || 0,
    });
  } catch (err) {
    console.error('Generate curriculum error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
