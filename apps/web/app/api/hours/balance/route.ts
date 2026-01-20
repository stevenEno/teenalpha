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

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    // Get optional filters from query params
    const { searchParams } = new URL(request.url);
    const mentorId = searchParams.get('mentor_id');
    const teenId = searchParams.get('teen_id');

    let query = supabase
      .from('hour_balances')
      .select(`
        id,
        family_id,
        mentor_id,
        teen_id,
        balance_hours,
        total_purchased_hours,
        total_used_hours,
        mentor:mentor_id (
          id,
          full_name,
          avatar_url
        ),
        teen:teen_id (
          id,
          full_name,
          avatar_url
        )
      `);

    // Filter based on user role
    if (profile.role === 'parent') {
      query = query.eq('family_id', user.id);
    } else if (profile.role === 'mentor') {
      query = query.eq('mentor_id', user.id);
    } else if (profile.role === 'teen') {
      query = query.eq('teen_id', user.id);
    }

    // Apply optional filters
    if (mentorId) {
      query = query.eq('mentor_id', mentorId);
    }
    if (teenId) {
      query = query.eq('teen_id', teenId);
    }

    const { data: balances, error } = await query;

    if (error) {
      console.error('Error fetching hour balances:', error);
      return NextResponse.json({ error: 'Failed to fetch balances' }, { status: 500 });
    }

    // Transform data for response
    const formattedBalances = (balances || []).map((balance: any) => ({
      id: balance.id,
      mentor_id: balance.mentor_id,
      mentor_name: balance.mentor?.full_name || 'Unknown Mentor',
      mentor_avatar: balance.mentor?.avatar_url || null,
      teen_id: balance.teen_id,
      teen_name: balance.teen?.full_name || 'Unknown Teen',
      teen_avatar: balance.teen?.avatar_url || null,
      balance_hours: Number(balance.balance_hours),
      total_purchased: Number(balance.total_purchased_hours),
      total_used: Number(balance.total_used_hours),
    }));

    return NextResponse.json({
      balances: formattedBalances,
      total_balance: formattedBalances.reduce((sum: number, b: any) => sum + b.balance_hours, 0),
    });

  } catch (error: any) {
    console.error('Hours balance API error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch hour balances' },
      { status: 500 }
    );
  }
}
