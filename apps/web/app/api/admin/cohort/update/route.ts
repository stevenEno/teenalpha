import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: { get: (name: string) => cookieStore.get(name)?.value, set: () => {}, remove: () => {} },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const { data: profile } = await supabase
    .from('profiles').select('role').eq('id', user.id).single();
  if (profile?.role !== 'admin') {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  const { id, status } = await request.json();
  if (!id || !status) return NextResponse.json({ error: 'missing fields' }, { status: 400 });

  const valid = ['new', 'contacted', 'accepted', 'declined', 'enrolled'];
  if (!valid.includes(status)) {
    return NextResponse.json({ error: 'invalid status' }, { status: 400 });
  }

  const { error } = await supabase
    .from('cohort_applications')
    .update({ status })
    .eq('id', id);

  if (error) return NextResponse.json({ error: 'update_failed' }, { status: 500 });
  return NextResponse.json({ ok: true });
}
