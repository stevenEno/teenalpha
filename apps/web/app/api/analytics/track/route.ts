import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { visitorId, variant, eventType, metadata } = body;

    if (!visitorId || !variant || !eventType) {
      return NextResponse.json(
        { error: 'Missing required fields: visitorId, variant, eventType' },
        { status: 400 }
      );
    }

    const cookieStore = await cookies();
    // Use anon key - RLS policy allows anyone to insert events
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

    // Get user if authenticated
    const { data: { user } } = await supabase.auth.getUser();

    // Insert the event
    const { error } = await supabase
      .from('ab_test_events')
      .insert({
        visitor_id: visitorId,
        variant,
        event_type: eventType,
        user_id: user?.id || null,
        metadata: metadata || {},
        user_agent: request.headers.get('user-agent') || null,
        referrer: request.headers.get('referer') || null,
      });

    if (error) {
      console.error('Failed to track event:', error);
      // Don't fail the request - tracking shouldn't break the user experience
      return NextResponse.json({ success: false, error: error.message });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Analytics tracking error:', error);
    return NextResponse.json({ success: false, error: error.message });
  }
}
