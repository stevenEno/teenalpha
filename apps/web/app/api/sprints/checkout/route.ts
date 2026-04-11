import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getAuthedSupabase } from '@/lib/api-auth';
import { getStripe } from '@/lib/stripe';

const SprintCheckoutSchema = z.object({
  sprint_id: z.string().uuid(),
  teen_id: z.string().uuid(),
});

export async function POST(request: NextRequest) {
  try {
    const { user, supabase, error: authError } = await getAuthedSupabase();
    if (authError) return authError;

    // Verify user is a parent
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, role, email, full_name')
      .eq('id', user!.id)
      .single();

    if (!profile || profile.role !== 'parent') {
      return NextResponse.json(
        { error: 'Only parents can enroll teens in sprints' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const parsed = SprintCheckoutSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { sprint_id, teen_id } = parsed.data;

    // Verify the teen is connected to this parent
    const { data: connection } = await supabase
      .from('family_connections')
      .select('id')
      .eq('parent_id', user!.id)
      .eq('teen_id', teen_id)
      .eq('verified', true)
      .single();

    if (!connection) {
      return NextResponse.json(
        { error: 'Teen is not connected to your account' },
        { status: 403 }
      );
    }

    // Fetch sprint details
    const { data: sprint } = await supabase
      .from('sprints')
      .select('*, mentor:profiles!sprints_mentor_id_fkey (id, full_name)')
      .eq('id', sprint_id)
      .eq('status', 'active')
      .single();

    if (!sprint) {
      return NextResponse.json({ error: 'Sprint not found' }, { status: 404 });
    }

    // Check if already enrolled
    const { data: existingEnrollment } = await supabase
      .from('sprint_enrollments')
      .select('id')
      .eq('sprint_id', sprint_id)
      .eq('teen_id', teen_id)
      .in('status', ['enrolled', 'active', 'completed'])
      .single();

    if (existingEnrollment) {
      return NextResponse.json(
        { error: 'This teen is already enrolled in this sprint' },
        { status: 409 }
      );
    }

    // Check spots remaining
    const { count } = await supabase
      .from('sprint_enrollments')
      .select('id', { count: 'exact', head: true })
      .eq('sprint_id', sprint_id)
      .in('status', ['enrolled', 'active', 'completed']);

    if ((count || 0) >= sprint.max_participants) {
      return NextResponse.json(
        { error: 'This sprint is full' },
        { status: 409 }
      );
    }

    // Get teen details
    const { data: teen } = await supabase
      .from('profiles')
      .select('id, full_name')
      .eq('id', teen_id)
      .single();

    // Create Stripe checkout session
    const origin =
      request.headers.get('origin') ||
      process.env.NEXT_PUBLIC_APP_URL ||
      'http://localhost:3000';

    const stripe = getStripe();
    const checkoutSession = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: sprint.currency,
            product_data: {
              name: sprint.title,
              description: `${sprint.duration_weeks}-week program for ${teen?.full_name || 'your teen'} with ${sprint.mentor?.full_name || 'mentor'}`,
            },
            unit_amount: sprint.price,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${origin}/sprint/success?session_id={CHECKOUT_SESSION_ID}&sprint_id=${sprint_id}`,
      cancel_url: `${origin}/sprint?cancelled=true`,
      customer_email: profile.email,
      metadata: {
        family_id: user!.id,
        mentor_id: sprint.mentor_id,
        teen_id,
        sprint_id,
        payment_type: 'sprint',
        hours_purchased: sprint.includes_session_hours.toString(),
      },
    });

    // Create pending payment record
    await supabase.from('payments').insert({
      family_id: user!.id,
      mentor_id: sprint.mentor_id,
      teen_id,
      stripe_checkout_session_id: checkoutSession.id,
      amount: sprint.price,
      hours_purchased: sprint.includes_session_hours,
      status: 'pending',
      payment_type: 'sprint',
      metadata: { sprint_id },
    });

    return NextResponse.json({
      checkout_url: checkoutSession.url,
      session_id: checkoutSession.id,
    });
  } catch (error: unknown) {
    console.error('Sprint checkout error:', error);
    const message =
      error instanceof Error ? error.message : 'Failed to create checkout';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
