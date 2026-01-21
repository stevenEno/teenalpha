import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { UpdateSessionRequest } from '@/types/payments.types';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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

    const { data: session, error } = await supabase
      .from('sessions')
      .select(`
        *,
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
      .eq('id', id)
      .single();

    if (error || !session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    // Verify user has access
    if (session.mentor_id !== user.id && session.teen_id !== user.id && session.family_id !== user.id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    return NextResponse.json({ session });

  } catch (error: any) {
    console.error('Get session error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch session' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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

    // Get user profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    // Get the session
    const { data: session, error: sessionError } = await supabase
      .from('sessions')
      .select('*')
      .eq('id', id)
      .single();

    if (sessionError || !session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    // Verify user has access
    if (session.mentor_id !== user.id && session.family_id !== user.id) {
      return NextResponse.json({ error: 'Only mentors or parents can update sessions' }, { status: 403 });
    }

    const body: UpdateSessionRequest = await request.json();
    const { status, mentor_notes, cancelled_reason } = body;

    // Build update object
    const updateData: Record<string, unknown> = {};

    if (status) {
      // Validate status transitions
      const validTransitions: Record<string, string[]> = {
        pending: ['confirmed', 'cancelled'],
        confirmed: ['completed', 'cancelled'],
        completed: [], // Final state
        cancelled: [], // Final state
      };

      if (!validTransitions[session.status]?.includes(status)) {
        return NextResponse.json(
          { error: `Cannot change status from ${session.status} to ${status}` },
          { status: 400 }
        );
      }

      // Check role permissions for status changes
      if (status === 'confirmed' && profile.role !== 'mentor') {
        return NextResponse.json({ error: 'Only mentors can confirm sessions' }, { status: 403 });
      }

      if (status === 'completed' && profile.role !== 'mentor') {
        return NextResponse.json({ error: 'Only mentors can mark sessions as completed' }, { status: 403 });
      }

      // For completed status, check hour balance
      if (status === 'completed') {
        const { data: balance } = await supabase
          .from('hour_balances')
          .select('balance_hours')
          .eq('family_id', session.family_id)
          .eq('mentor_id', session.mentor_id)
          .eq('teen_id', session.teen_id)
          .single();

        if (!balance || balance.balance_hours < session.duration_hours) {
          return NextResponse.json(
            { error: 'Insufficient hour balance to complete this session' },
            { status: 400 }
          );
        }

        // Note: Hour deduction is handled by the database trigger (deduct_hours_on_session_complete)
        // which fires when session status is updated to 'completed'
      }

      updateData.status = status;

      // Set timestamp fields based on status
      if (status === 'confirmed') {
        updateData.confirmed_at = new Date().toISOString();
      } else if (status === 'completed') {
        updateData.completed_at = new Date().toISOString();
      } else if (status === 'cancelled') {
        updateData.cancelled_at = new Date().toISOString();
        updateData.cancelled_by = user.id;
        if (cancelled_reason) {
          updateData.cancelled_reason = cancelled_reason;
        }
      }
    }

    if (mentor_notes !== undefined && profile.role === 'mentor') {
      updateData.mentor_notes = mentor_notes;
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
    }

    // Update the session
    const { data: updatedSession, error: updateError } = await supabase
      .from('sessions')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating session:', updateError);
      return NextResponse.json({ error: 'Failed to update session' }, { status: 500 });
    }

    return NextResponse.json({
      session: updatedSession,
      message: `Session ${status || 'updated'} successfully`,
    });

  } catch (error: any) {
    console.error('Update session error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update session' },
      { status: 500 }
    );
  }
}
