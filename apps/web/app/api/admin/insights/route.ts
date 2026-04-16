import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { parseInsightMarkdown } from '@/lib/insights/parse';

async function requireAdmin() {
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
  if (!user) return { error: 'unauthorized' as const };
  const { data: profile } = await supabase
    .from('profiles').select('role').eq('id', user.id).single();
  if (profile?.role !== 'admin') return { error: 'forbidden' as const };
  return { supabase, userId: user.id };
}

export async function POST(request: Request) {
  const auth = await requireAdmin();
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.error === 'unauthorized' ? 401 : 403 });
  }

  const body = await request.json();
  let parsed;
  if (typeof body.markdown === 'string' && body.markdown.trim().length > 0) {
    parsed = parseInsightMarkdown(body.markdown);
  } else {
    parsed = {
      title: body.title ?? null,
      url: body.url ?? null,
      source: body.source ?? null,
      author: body.author ?? null,
      tags: Array.isArray(body.tags) ? body.tags : [],
      takeaway: body.takeaway ?? null,
      audience: Array.isArray(body.audience) ? body.audience : ['teens', 'mentors'],
      body_md: body.body_md ?? '',
      date: null,
    };
  }

  if (!parsed.title) {
    return NextResponse.json({ error: 'title_required' }, { status: 400 });
  }

  const { data, error } = await auth.supabase
    .from('insights')
    .insert({
      title: parsed.title,
      url: parsed.url,
      source: parsed.source,
      author: parsed.author,
      tags: parsed.tags,
      audience: parsed.audience,
      takeaway: parsed.takeaway,
      body_md: parsed.body_md,
      created_by: auth.userId,
    })
    .select()
    .single();

  if (error) {
    console.error('Insert insight failed:', error);
    return NextResponse.json({ error: 'insert_failed' }, { status: 500 });
  }

  return NextResponse.json({ insight: data });
}

export async function DELETE(request: Request) {
  const auth = await requireAdmin();
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.error === 'unauthorized' ? 401 : 403 });
  }
  const { id } = await request.json();
  if (!id) return NextResponse.json({ error: 'missing_id' }, { status: 400 });
  await auth.supabase.from('insights').delete().eq('id', id);
  return NextResponse.json({ ok: true });
}
