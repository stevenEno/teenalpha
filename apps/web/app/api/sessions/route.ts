import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { CreateSessionRequest } from '@/types/payments.types';

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
    const status = searchParams.get('status');
    const mentorId = searchParams.get('mentor_id');
    const teenId = searchParams.get('teen_id');

    let query = supabase
      .from('sessions')
      .select(`
        id,
        mentor_id,
        teen_id,
        family_id,
        status,
        scheduled_at,
        duration_hours,
        notes,
        mentor_notes,
        cancelled_by,
        cancelled_reason,
        created_at,
        confirmed_at,
        completed_at,
        cancelled_at,
        mentor:mentor_id (
          id,
          full_name,
          avatar_url,
          email
        ),
        teen:teen_id (
          id,
          full_name,
          avatar_url,
          email
        ),
        family:family_id (
          id,
          full_name,
          email
        )
      `)
      .order('scheduled_at', { ascending: true });

    // Filter based on user role
    if (profile.role === 'parent') {
      query = query.eq('family_id', user.id);
    } else if (profile.role === 'mentor') {
      query = query.eq('mentor_id', user.id);
    } else if (profile.role === 'teen') {
      query = query.eq('teen_id', user.id);
    }

    // Apply optional filters
    if (status) {
      query = query.eq('status', status);
    }
    if (mentorId) {
      query = query.eq('mentor_id', mentorId);
    }
    if (teenId) {
      query = query.eq('teen_id', teenId);
    }

    const { data: sessions, error } = await query;

    if (error) {
      console.error('Error fetching sessions:', error);
      return NextResponse.json({ error: 'Failed to fetch sessions' }, { status: 500 });
    }

    return NextResponse.json({
      sessions: sessions || [],
      count: sessions?.length || 0,
    });

  } catch (error: any) {
    console.error('Sessions API error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch sessions' },
      { status: 500 }
    );
  }
}

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

    // Verify user is a parent
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || profile.role !== 'parent') {
      return NextResponse.json({ error: 'Only parents can book sessions' }, { status: 403 });
    }

    const body: CreateSessionRequest = await request.json();
    const { mentor_id, teen_id, scheduled_at, duration_hours, notes } = body;

    if (!mentor_id || !teen_id || !scheduled_at || !duration_hours) {
      return NextResponse.json(
        { error: 'mentor_id, teen_id, scheduled_at, and duration_hours are required' },
        { status: 400 }
      );
    }

    // Verify teen is connected to this parent
    const { data: connection } = await supabase
      .from('family_connections')
      .select('id')
      .eq('parent_id', user.id)
      .eq('teen_id', teen_id)
      .eq('verified', true)
      .single();

    if (!connection) {
      return NextResponse.json({ error: 'Teen is not connected to your account' }, { status: 403 });
    }

    // Check hour balance
    const { data: balance } = await supabase
      .from('hour_balances')
      .select('balance_hours')
      .eq('family_id', user.id)
      .eq('mentor_id', mentor_id)
      .eq('teen_id', teen_id)
      .single();

    if (!balance || balance.balance_hours < duration_hours) {
      return NextResponse.json(
        { error: 'Insufficient hour balance. Please purchase more hours.' },
        { status: 400 }
      );
    }

    // Verify scheduled time is in the future
    const scheduledDate = new Date(scheduled_at);
    if (scheduledDate <= new Date()) {
      return NextResponse.json(
        { error: 'Session must be scheduled for a future date and time' },
        { status: 400 }
      );
    }

    // Create the session
    const { data: session, error } = await supabase
      .from('sessions')
      .insert({
        mentor_id,
        teen_id,
        family_id: user.id,
        scheduled_at,
        duration_hours,
        notes: notes || null,
        status: 'pending',
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating session:', error);
      return NextResponse.json({ error: 'Failed to create session' }, { status: 500 });
    }

    return NextResponse.json({
      session,
      message: 'Session booked successfully. Awaiting mentor confirmation.',
    });

  } catch (error: any) {
    console.error('Create session error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create session' },
      { status: 500 }
    );
  }
}
