import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { getStripe } from '@/lib/stripe';
import type { CreateCheckoutRequest } from '@/types/payments.types';

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

    // Verify user is authenticated
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify user is a parent
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, role, email, full_name')
      .eq('id', user.id)
      .single();

    if (!profile || profile.role !== 'parent') {
      return NextResponse.json({ error: 'Only parents can purchase hours' }, { status: 403 });
    }

    const body: CreateCheckoutRequest = await request.json();
    const { mentor_id, teen_id, hours, package_id } = body;

    if (!mentor_id || !teen_id) {
      return NextResponse.json({ error: 'mentor_id and teen_id are required' }, { status: 400 });
    }

    if (!hours && !package_id) {
      return NextResponse.json({ error: 'Either hours or package_id is required' }, { status: 400 });
    }

    // Verify the teen is connected to this parent
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

    // Get mentor pricing
    const { data: pricing } = await supabase
      .from('mentor_pricing')
      .select('hourly_rate')
      .eq('mentor_id', mentor_id)
      .single();

    if (!pricing) {
      return NextResponse.json({ error: 'Mentor pricing not found' }, { status: 404 });
    }

    // Get mentor details
    const { data: mentor } = await supabase
      .from('profiles')
      .select('id, full_name')
      .eq('id', mentor_id)
      .single();

    if (!mentor) {
      return NextResponse.json({ error: 'Mentor not found' }, { status: 404 });
    }

    // Get teen details
    const { data: teen } = await supabase
      .from('profiles')
      .select('id, full_name')
      .eq('id', teen_id)
      .single();

    if (!teen) {
      return NextResponse.json({ error: 'Teen not found' }, { status: 404 });
    }

    let amount: number;
    let purchasedHours: number;
    let lineItemName: string;
    let paymentType: 'hourly' | 'package' = 'hourly';

    if (package_id) {
      // Package purchase
      const { data: pkg } = await supabase
        .from('hour_packages')
        .select('*')
        .eq('id', package_id)
        .eq('mentor_id', mentor_id)
        .eq('is_active', true)
        .single();

      if (!pkg) {
        return NextResponse.json({ error: 'Package not found' }, { status: 404 });
      }

      amount = pkg.price;
      purchasedHours = pkg.hours;
      lineItemName = `${pkg.name} - ${mentor.full_name || 'Mentor'}`;
      paymentType = 'package';
    } else {
      // Hourly purchase
      if (!hours || hours < 1 || hours > 20) {
        return NextResponse.json({ error: 'Hours must be between 1 and 20' }, { status: 400 });
      }
      amount = pricing.hourly_rate * hours;
      purchasedHours = hours;
      lineItemName = `${hours} Hour${hours > 1 ? 's' : ''} of Mentoring - ${mentor.full_name || 'Mentor'}`;
    }

    // Create Stripe checkout session
    const origin = request.headers.get('origin') || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    const stripe = getStripe();
    const checkoutSession = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: lineItemName,
              description: `Mentoring hours for ${teen.full_name || 'your teen'}`,
            },
            unit_amount: amount,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${origin}/dashboard/purchase/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/dashboard/purchase?cancelled=true`,
      customer_email: profile.email,
      metadata: {
        family_id: user.id,
        mentor_id,
        teen_id,
        hours_purchased: purchasedHours.toString(),
        payment_type: paymentType,
        package_id: package_id || '',
      },
    });

    // Create pending payment record
    const { error: paymentError } = await supabase
      .from('payments')
      .insert({
        family_id: user.id,
        mentor_id,
        teen_id,
        stripe_checkout_session_id: checkoutSession.id,
        amount,
        hours_purchased: purchasedHours,
        package_id: package_id || null,
        status: 'pending',
        payment_type: paymentType,
      });

    if (paymentError) {
      console.error('Error creating payment record:', paymentError);
      // Don't fail the checkout, just log the error
    }

    return NextResponse.json({
      checkout_url: checkoutSession.url,
      session_id: checkoutSession.id,
    });

  } catch (error: any) {
    console.error('Create checkout error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}
