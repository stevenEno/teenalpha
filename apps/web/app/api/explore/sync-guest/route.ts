import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { ExplorePath } from '@teen-alpha/database';
import { ONBOARDING_ALPHA } from '@/lib/incentives';

// POST: Sync guest explore data to authenticated user's profile
export async function POST(request: NextRequest) {
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

    // Require authentication
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { interest, selectedPathIndex, paths, visitorId } = body;

    if (!interest || selectedPathIndex === undefined || !paths || !Array.isArray(paths)) {
      return NextResponse.json(
        { error: 'Interest, selectedPathIndex, and paths are required' },
        { status: 400 }
      );
    }

    const selectedPath = paths[selectedPathIndex] as ExplorePath;
    if (!selectedPath) {
      return NextResponse.json(
        { error: 'Invalid selectedPathIndex' },
        { status: 400 }
      );
    }

    console.log('Syncing guest data for user:', user.id, 'path:', selectedPath.name);

    // Use service role for database operations that need elevated permissions
    const supabaseAdmin = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
        },
      }
    );

    // 1. Update profile with onboarding interest
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .update({
        onboarding_interest: interest,
        onboarding_completed_at: new Date().toISOString(),
      })
      .eq('id', user.id);

    if (profileError) {
      console.error('Failed to update profile:', profileError);
      throw new Error('Failed to update profile');
    }

    // 1b. Guard: skip project creation if server-side sync in /auth/callback already ran
    const { count: existingProjects } = await supabaseAdmin
      .from('projects')
      .select('*', { count: 'exact', head: true })
      .eq('teen_id', user.id)
      .eq('category', 'explore');
    if ((existingProjects ?? 0) > 0) {
      console.log('Sync-guest: project already exists, clearing guest data only');
      return NextResponse.json({ success: true, projectId: null, alphaAwarded: 0 });
    }

    // 2. Create a project from the selected path
    const projectTitle = `${selectedPath.icon} ${selectedPath.name}`;
    const projectDescription = `${selectedPath.tagline}\n\n${selectedPath.connection}\n\nGoal: ${selectedPath.moneyPath}`;

    const { data: project, error: projectError } = await supabaseAdmin
      .from('projects')
      .insert({
        teen_id: user.id,
        title: projectTitle,
        description: projectDescription,
        category: 'explore',
        status: 'active',
        ai_generated: true,
        ai_prompt: `Generated from explore flow with interest: ${interest}`,
        money_path: selectedPath.moneyPath || null,
      })
      .select()
      .single();

    if (projectError || !project) {
      console.error('Failed to create project:', projectError);
      throw new Error('Failed to create project');
    }

    // 3. Create tasks from the path's steps
    const tasks = selectedPath.steps.map((step, index) => ({
      project_id: project.id,
      title: step.title,
      description: `${step.description}\n\nEstimated time: ${step.timeEstimate}`,
      status: 'todo' as const,
      order_index: step.order,
      ai_generated: true,
      suggested_evidence: index === selectedPath.steps.length - 1
        ? 'Screenshot of your first dollar earned!'
        : null,
    }));

    const { error: tasksError } = await supabaseAdmin
      .from('tasks')
      .insert(tasks);

    if (tasksError) {
      console.error('Failed to create tasks:', tasksError);
      // Don't fail completely - project was created
    }

    // 3b. If teen has an active sprint enrollment without a project chosen yet,
    // backfill project_title/description from the selected path so the sprint
    // dashboard reflects the choice.
    const { error: sprintUpdateError } = await supabaseAdmin
      .from('sprint_enrollments')
      .update({
        project_title: selectedPath.name,
        project_description: selectedPath.tagline,
      })
      .eq('teen_id', user.id)
      .in('status', ['enrolled', 'active'])
      .is('project_title', null);

    if (sprintUpdateError) {
      console.error('Failed to backfill sprint project (non-fatal):', sprintUpdateError);
    }

    // 4. Award onboarding Alpha
    let alphaAwarded = 0;
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('onboarding_alpha_awarded')
      .eq('id', user.id)
      .single();

    if (!profile?.onboarding_alpha_awarded) {
      const { error: alphaError } = await supabaseAdmin
        .from('alpha_awards')
        .insert({
          user_id: user.id,
          source: 'explore_onboarding',
          amount: ONBOARDING_ALPHA,
          metadata: {
            interest,
            pathName: selectedPath.name,
            projectId: project.id,
          },
        });

      if (!alphaError) {
        alphaAwarded = ONBOARDING_ALPHA;

        // Mark Alpha as awarded on profile
        await supabaseAdmin
          .from('profiles')
          .update({ onboarding_alpha_awarded: true })
          .eq('id', user.id);
      } else {
        console.error('Failed to award Alpha:', alphaError);
      }
    }

    // 5. Update guest session if visitorId provided
    if (visitorId) {
      await supabaseAdmin
        .from('guest_onboarding_sessions')
        .update({
          selected_path_index: selectedPathIndex,
          converted_user_id: user.id,
        })
        .eq('visitor_id', visitorId)
        .order('created_at', { ascending: false })
        .limit(1);
    }

    console.log('Successfully synced guest data:', {
      userId: user.id,
      projectId: project.id,
      alphaAwarded,
    });

    return NextResponse.json({
      success: true,
      projectId: project.id,
      alphaAwarded,
    });
  } catch (error: any) {
    console.error('Sync guest error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to sync guest data' },
      { status: 500 }
    );
  }
}
