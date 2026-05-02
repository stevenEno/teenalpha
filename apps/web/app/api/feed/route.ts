import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

export async function GET(request: Request) {
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

  const url = new URL(request.url);
  const cursor = url.searchParams.get('cursor');
  const limit = Math.min(Number(url.searchParams.get('limit') ?? 30), 50);

  // Use service role to join profiles for feed_visible check + name
  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  let query = admin
    .from('activity_events')
    .select('id, actor_id, event_type, title, metadata, created_at, profiles!inner(full_name, feed_visible)')
    .eq('actor_role', 'teen')
    .eq('profiles.feed_visible', true)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (cursor) {
    query = query.lt('created_at', cursor);
  }

  const { data, error } = await query;
  if (error) {
    console.error('Feed query failed:', error);
    return NextResponse.json({ error: 'feed_failed' }, { status: 500 });
  }

  const events = (data ?? []).map((e: Record<string, unknown>) => {
    const profile = e.profiles as { full_name: string; feed_visible: boolean } | null;
    const fullName = profile?.full_name ?? 'A teen';
    const parts = fullName.split(' ');
    const displayName = parts.length > 1
      ? `${parts[0]} ${parts[parts.length - 1][0]}.`
      : parts[0];
    return {
      id: e.id,
      actor_name: displayName,
      event_type: e.event_type,
      title: e.title,
      metadata: e.metadata,
      created_at: e.created_at,
      is_self: e.actor_id === user.id,
    };
  });

  const nextCursor = events.length === limit ? events[events.length - 1].created_at : null;

  return NextResponse.json({ events, next_cursor: nextCursor });
}
