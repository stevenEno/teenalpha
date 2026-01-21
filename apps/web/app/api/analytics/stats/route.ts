import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
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

    // Check if user is admin
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Get date range from query params
    const searchParams = request.nextUrl.searchParams;
    const days = parseInt(searchParams.get('days') || '30');
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Use service role to read analytics
    const serviceSupabase = createServerClient(
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

    // Get funnel stats per variant
    const { data: funnelData, error: funnelError } = await serviceSupabase
      .rpc('get_ab_test_funnel', {
        start_date: startDate.toISOString(),
        end_date: new Date().toISOString(),
      });

    if (funnelError) {
      console.error('Funnel query error:', funnelError);
    }

    // Get daily stats for charts
    const { data: dailyData, error: dailyError } = await serviceSupabase
      .from('ab_test_events')
      .select('variant, event_type, created_at')
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: true });

    if (dailyError) {
      console.error('Daily stats error:', dailyError);
    }

    // Process daily data for charts
    const dailyStats: Record<string, Record<string, { views: number; signups: number }>> = {};

    (dailyData || []).forEach((event: any) => {
      const date = new Date(event.created_at).toISOString().split('T')[0];
      const variant = event.variant;

      if (!dailyStats[date]) {
        dailyStats[date] = {};
      }
      if (!dailyStats[date][variant]) {
        dailyStats[date][variant] = { views: 0, signups: 0 };
      }

      if (event.event_type === 'view') {
        dailyStats[date][variant].views++;
      } else if (event.event_type === 'signup_completed') {
        dailyStats[date][variant].signups++;
      }
    });

    // Get total unique visitors
    const { data: totalVisitors } = await serviceSupabase
      .from('ab_test_events')
      .select('visitor_id')
      .gte('created_at', startDate.toISOString());

    const uniqueVisitors = new Set((totalVisitors || []).map((e: any) => e.visitor_id)).size;

    return NextResponse.json({
      funnel: funnelData || [],
      dailyStats,
      summary: {
        totalUniqueVisitors: uniqueVisitors,
        dateRange: {
          start: startDate.toISOString(),
          end: new Date().toISOString(),
        },
      },
    });
  } catch (error: any) {
    console.error('Analytics stats error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}
