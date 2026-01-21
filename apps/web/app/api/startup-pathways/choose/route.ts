import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

interface Startup {
  name: string;
  description: string;
  website: string;
}

interface Pathway {
  name: string;
  icon: string;
  connection: string;
  startups: Startup[];
  skills: string[];
  firstSteps: string[];
}

// POST: Create a project from a chosen pathway
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

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the pathway data from the request
    const body = await request.json();
    const { pathwayId, pathwayIndex, pathway } = body as {
      pathwayId: string;
      pathwayIndex: number;
      pathway: Pathway;
    };

    if (!pathway || !pathway.name || !pathway.firstSteps) {
      return NextResponse.json(
        { error: 'Invalid pathway data' },
        { status: 400 }
      );
    }

    console.log(`Creating project from pathway: ${pathway.name} for user ${user.id}`);

    // Build project description from pathway data
    const projectDescription = `${pathway.connection}

Skills to develop: ${pathway.skills.join(', ')}

Related startups to learn from: ${pathway.startups.map(s => s.name).join(', ')}`;

    // Create the project
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .insert({
        teen_id: user.id,
        title: pathway.name,
        description: projectDescription,
        category: 'Business & Entrepreneurship', // Default category for startup pathways
        ai_generated: true,
        ai_prompt: `Startup pathway: ${pathway.name}`,
      })
      .select()
      .single();

    if (projectError) {
      console.error('Failed to create project:', projectError);
      throw new Error('Failed to create project');
    }

    console.log(`Created project ${project.id}`);

    // Create tasks from the first steps
    const taskPromises = pathway.firstSteps.map((step, index) => {
      // Generate suggested evidence based on the step content
      const suggestedEvidence = generateSuggestedEvidence(step);

      return supabase
        .from('tasks')
        .insert({
          project_id: project.id,
          title: step,
          description: `This is step ${index + 1} in your ${pathway.name} pathway.`,
          order_index: index,
          status: 'todo',
          ai_generated: true,
          suggested_evidence: suggestedEvidence,
        })
        .select()
        .single();
    });

    const taskResults = await Promise.all(taskPromises);

    // Check for any errors in task creation
    const taskErrors = taskResults.filter(r => r.error);
    if (taskErrors.length > 0) {
      console.error('Some tasks failed to create:', taskErrors);
      // Continue anyway since the project was created
    }

    const tasks = taskResults.filter(r => !r.error).map(r => r.data);
    console.log(`Created ${tasks.length} tasks`);

    // Update the startup_pathways record to track which pathway was chosen
    await supabase
      .from('startup_pathways')
      .update({
        chosen_pathway_index: pathwayIndex,
        chosen_at: new Date().toISOString(),
        project_id: project.id,
      })
      .eq('id', pathwayId)
      .eq('profile_id', user.id);

    return NextResponse.json({
      success: true,
      project,
      tasks,
    });

  } catch (error: any) {
    console.error('Choose pathway error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create project from pathway' },
      { status: 500 }
    );
  }
}

/**
 * Generate suggested evidence based on the task step content
 */
function generateSuggestedEvidence(step: string): string {
  const lowerStep = step.toLowerCase();

  // Check for common action types
  if (lowerStep.includes('sign up') || lowerStep.includes('create account') || lowerStep.includes('register')) {
    return 'Screenshot of your account dashboard or confirmation email';
  }

  if (lowerStep.includes('try') || lowerStep.includes('test') || lowerStep.includes('experiment')) {
    return 'Screenshot or screen recording showing your exploration and results';
  }

  if (lowerStep.includes('course') || lowerStep.includes('tutorial') || lowerStep.includes('learn')) {
    return 'Certificate of completion or notes from what you learned';
  }

  if (lowerStep.includes('build') || lowerStep.includes('create') || lowerStep.includes('make')) {
    return 'Screenshot, link, or file showing what you created';
  }

  if (lowerStep.includes('research') || lowerStep.includes('read') || lowerStep.includes('study')) {
    return 'Summary document or notes capturing your key learnings';
  }

  if (lowerStep.includes('portfolio') || lowerStep.includes('showcase')) {
    return 'Link to your portfolio or screenshots of your work collection';
  }

  if (lowerStep.includes('connect') || lowerStep.includes('network') || lowerStep.includes('reach out')) {
    return 'Screenshot of conversation or notes from your interaction';
  }

  if (lowerStep.includes('watch') || lowerStep.includes('video')) {
    return 'Brief summary of key takeaways from the content';
  }

  // Default evidence suggestion
  return 'Photo, screenshot, or document showing your progress on this step';
}
