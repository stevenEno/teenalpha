import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

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

    // Verify admin role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || profile.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Fetch all stats in parallel
    const [
      usersResult,
      projectsResult,
      sessionsResult,
      paymentsResult,
      socialUploadsResult,
      pathwaysResult,
      abEventsResult,
      recentUsersResult,
      mentorRecsResult,
    ] = await Promise.all([
      // User counts by role
      supabase.from('profiles').select('role', { count: 'exact' }),

      // Project counts
      supabase.from('projects').select('status', { count: 'exact' }),

      // Session counts
      supabase.from('sessions').select('status', { count: 'exact' }),

      // Payment totals
      supabase.from('payments').select('amount, status'),

      // Social media uploads
      supabase.from('social_media_analysis').select('platform', { count: 'exact' }),

      // Startup pathways generated
      supabase.from('startup_pathways').select('id', { count: 'exact', head: true }),

      // A/B test events (last 30 days)
      supabase
        .from('ab_test_events')
        .select('event_type, variant')
        .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()),

      // Recent users (last 7 days)
      supabase
        .from('profiles')
        .select('id, full_name, email, role, created_at')
        .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: false })
        .limit(10),

      // Pending mentor recommendations
      supabase
        .from('mentor_recommendations')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'pending'),
    ]);

    // Process user stats
    const usersByRole = {
      teen: 0,
      mentor: 0,
      parent: 0,
      admin: 0,
      total: 0,
    };

    if (usersResult.data) {
      usersResult.data.forEach((u: any) => {
        usersByRole[u.role as keyof typeof usersByRole]++;
        usersByRole.total++;
      });
    }

    // Process project stats
    const projectsByStatus = {
      active: 0,
      completed: 0,
      paused: 0,
      total: 0,
    };

    if (projectsResult.data) {
      projectsResult.data.forEach((p: any) => {
        if (p.status in projectsByStatus) {
          projectsByStatus[p.status as keyof typeof projectsByStatus]++;
        }
        projectsByStatus.total++;
      });
    }

    // Process session stats
    const sessionsByStatus = {
      scheduled: 0,
      completed: 0,
      cancelled: 0,
      total: 0,
    };

    if (sessionsResult.data) {
      sessionsResult.data.forEach((s: any) => {
        if (s.status in sessionsByStatus) {
          sessionsByStatus[s.status as keyof typeof sessionsByStatus]++;
        }
        sessionsByStatus.total++;
      });
    }

    // Process payment stats
    const paymentStats = {
      totalRevenue: 0,
      successfulPayments: 0,
      pendingPayments: 0,
    };

    if (paymentsResult.data) {
      paymentsResult.data.forEach((p: any) => {
        if (p.status === 'succeeded' || p.status === 'completed') {
          paymentStats.totalRevenue += p.amount || 0;
          paymentStats.successfulPayments++;
        } else if (p.status === 'pending') {
          paymentStats.pendingPayments++;
        }
      });
    }

    // Process social media stats
    const socialUploads = {
      instagram: 0,
      tiktok: 0,
      snapchat: 0,
      steam: 0,
      total: 0,
    };

    if (socialUploadsResult.data) {
      socialUploadsResult.data.forEach((s: any) => {
        if (s.platform in socialUploads) {
          socialUploads[s.platform as keyof typeof socialUploads]++;
        }
        socialUploads.total++;
      });
    }

    // Process A/B test stats
    const abStats = {
      totalViews: 0,
      signupsStarted: 0,
      signupsCompleted: 0,
      byVariant: {} as Record<string, { views: number; signups: number }>,
    };

    if (abEventsResult.data) {
      abEventsResult.data.forEach((e: any) => {
        if (e.event_type === 'page_view') {
          abStats.totalViews++;
          if (!abStats.byVariant[e.variant]) {
            abStats.byVariant[e.variant] = { views: 0, signups: 0 };
          }
          abStats.byVariant[e.variant].views++;
        } else if (e.event_type === 'signup_started') {
          abStats.signupsStarted++;
        } else if (e.event_type === 'signup_completed') {
          abStats.signupsCompleted++;
          if (!abStats.byVariant[e.variant]) {
            abStats.byVariant[e.variant] = { views: 0, signups: 0 };
          }
          abStats.byVariant[e.variant].signups++;
        }
      });
    }

    return NextResponse.json({
      users: usersByRole,
      projects: projectsByStatus,
      sessions: sessionsByStatus,
      payments: paymentStats,
      socialUploads,
      pathwaysGenerated: pathwaysResult.count || 0,
      abTest: abStats,
      recentUsers: recentUsersResult.data || [],
      pendingMentorRecs: mentorRecsResult.count || 0,
    });

  } catch (error: any) {
    console.error('Error fetching admin stats:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch stats' },
      { status: 500 }
    );
  }
}
