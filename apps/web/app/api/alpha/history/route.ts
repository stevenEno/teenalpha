import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { convertToAlpha, type IncentiveSystem } from '@/lib/incentives';

export async function GET() {
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

    // Past 28 days
    const since = new Date();
    since.setDate(since.getDate() - 28);

    const { data: events } = await supabase
      .from('incentive_events')
      .select('system, metadata, created_at')
      .eq('user_id', user.id)
      .gte('created_at', since.toISOString())
      .order('created_at', { ascending: true });

    // Aggregate Alpha earned per day
    const dayMap = new Map<string, number>();

    for (const event of events ?? []) {
      const date = event.created_at.slice(0, 10); // YYYY-MM-DD
      const meta = event.metadata as Record<string, unknown>;
      const raw = (meta?.points_earned ?? meta?.tokens_earned ?? meta?.stars_earned ?? 0) as number;
      const system = event.system as IncentiveSystem;
      const alpha = convertToAlpha(system, raw);
      dayMap.set(date, (dayMap.get(date) ?? 0) + alpha);
    }

    const history = Array.from(dayMap.entries()).map(([date, alpha]) => ({ date, alpha }));

    return NextResponse.json(history);
  } catch (error: any) {
    console.error('Alpha history error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
