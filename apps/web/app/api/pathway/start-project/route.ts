import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import Groq from 'groq-sdk';

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (name: string) => cookieStore.get(name)?.value,
        set: () => {},
        remove: () => {},
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const { node_id } = await request.json();
  if (!node_id) return NextResponse.json({ error: 'missing node_id' }, { status: 400 });

  const { data: node } = await supabase
    .from('pathway_nodes')
    .select('*')
    .eq('id', node_id)
    .eq('user_id', user.id)
    .single();
  if (!node) return NextResponse.json({ error: 'not_found' }, { status: 404 });
  if (node.status !== 'available') {
    return NextResponse.json({ error: 'node_not_available' }, { status: 400 });
  }
  if (node.kind !== 'project') {
    return NextResponse.json({ error: 'not_a_project_node' }, { status: 400 });
  }
  if (node.project_id) {
    return NextResponse.json({ ok: true, project_id: node.project_id });
  }

  // Atomic claim: set a temporary flag to prevent races
  const { data: claimed, error: claimErr } = await supabase
    .from('pathway_nodes')
    .update({ status: 'active', unlocked_at: new Date().toISOString() })
    .eq('id', node_id)
    .eq('user_id', user.id)
    .is('project_id', null)  // only succeeds if no one else claimed it
    .select()
    .single();

  if (claimErr || !claimed) {
    // Someone else already started this project
    return NextResponse.json({ error: 'already_started' }, { status: 409 });
  }

  // Generate 3-5 starter tasks via Groq
  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
  let taskList: Array<{ title: string; description: string; suggested_evidence: string }> = [];
  try {
    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      temperature: 0.7,
      max_tokens: 800,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: `Generate 3-5 concrete starter tasks for a teen project. Return JSON only: {"tasks":[{"title":"short action","description":"1 sentence, teen voice","suggested_evidence":"what to show the mentor when done"}]}. Titles are imperative and small enough to finish in a session. Evidence is a photo, screenshot, link, or artifact.`,
        },
        {
          role: 'user',
          content: `Project: ${node.title}\n${node.description ?? ''}\nPathway: ${node.source_path_name ?? ''}`,
        },
      ],
    });
    const parsed = JSON.parse(completion.choices[0]?.message?.content ?? '{}') as {
      tasks?: typeof taskList;
    };
    taskList = (parsed.tasks ?? []).slice(0, 5);
  } catch (err) {
    console.error('Task generation failed, using fallback:', err);
  }
  if (taskList.length === 0) {
    taskList = [
      { title: 'Plan the scope', description: 'Write out what done looks like in 3 bullets.', suggested_evidence: 'A short doc or note with your plan.' },
      { title: 'Do the work', description: 'Build the smallest version that proves the idea.', suggested_evidence: 'Screenshot, photo, or demo link.' },
      { title: 'Ship and share', description: 'Put it where one real person will see it.', suggested_evidence: 'Link or screenshot of the post/demo.' },
    ];
  }

  const { data: project, error: pErr } = await supabase
    .from('projects')
    .insert({
      teen_id: user.id,
      title: node.title,
      description: node.description ?? '',
      category: 'pathway',
      status: 'active',
      ai_generated: true,
      ai_prompt: `Generated from pathway node ${node.id}`,
    })
    .select()
    .single();
  if (pErr || !project) {
    console.error('Project create failed:', pErr);
    return NextResponse.json({ error: 'project_create_failed' }, { status: 500 });
  }

  await supabase.from('tasks').insert(
    taskList.map((t, idx) => ({
      project_id: project.id,
      title: t.title,
      description: t.description,
      status: 'todo',
      order_index: idx,
      ai_generated: true,
      suggested_evidence: t.suggested_evidence,
    }))
  );

  await supabase
    .from('pathway_nodes')
    .update({ project_id: project.id })
    .eq('id', node.id);

  return NextResponse.json({ ok: true, project_id: project.id });
}
