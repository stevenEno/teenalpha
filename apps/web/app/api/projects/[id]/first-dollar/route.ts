import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { emitActivityEvent } from '@/lib/feed/emit';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(request: Request, context: RouteContext) {
  const { id: projectId } = await context.params;
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

  // Verify the project belongs to the user and is complete
  const { data: project } = await supabase
    .from('projects')
    .select('teen_id, is_complete')
    .eq('id', projectId)
    .single();
  if (!project || project.teen_id !== user.id) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 });
  }
  if (!project.is_complete) {
    return NextResponse.json({ error: 'project_not_complete' }, { status: 400 });
  }

  const body = await request.json();
  const { amount_cents, evidence_url } = body;
  if (!amount_cents || !evidence_url) {
    return NextResponse.json({ error: 'amount and evidence required' }, { status: 400 });
  }
  if (!Number.isInteger(amount_cents) || amount_cents <= 0 || amount_cents > 100000) {
    return NextResponse.json({ error: 'invalid amount' }, { status: 400 });
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('first_dollar_earned_at')
    .eq('id', user.id)
    .single();

  // Only stamp first dollar once
  if (!profile?.first_dollar_earned_at) {
    await supabase
      .from('profiles')
      .update({
        first_dollar_earned_at: new Date().toISOString(),
        first_dollar_amount: amount_cents,
        first_dollar_evidence_url: evidence_url,
        first_dollar_project_id: projectId,
      })
      .eq('id', user.id);

    await emitActivityEvent({
      actorId: user.id,
      actorRole: 'teen',
      eventType: 'project_complete',
      title: 'earned their first dollar',
      metadata: { amount_cents, project_id: projectId },
    });
  }

  return NextResponse.json({ ok: true });
}
