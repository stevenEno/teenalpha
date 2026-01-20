import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { getStripe } from '@/lib/stripe';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';

// Use service role for webhook to bypass RLS - lazy initialization
function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function POST(request: NextRequest) {
  const body = await request.text();
  const headersList = await headers();
  const signature = headersList.get('stripe-signature');

  if (!signature) {
    return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    const stripe = getStripe();
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message);
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
  }

  // Handle the event
  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      await handleCheckoutCompleted(session);
      break;
    }
    case 'checkout.session.expired': {
      const session = event.data.object as Stripe.Checkout.Session;
      await handleCheckoutExpired(session);
      break;
    }
    case 'payment_intent.payment_failed': {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      await handlePaymentFailed(paymentIntent);
      break;
    }
    default:
      console.log(`Unhandled event type: ${event.type}`);
  }

  return NextResponse.json({ received: true });
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const { family_id, mentor_id, teen_id, hours_purchased, payment_type, package_id } = session.metadata || {};

  if (!family_id || !mentor_id || !teen_id || !hours_purchased) {
    console.error('Missing metadata in checkout session:', session.id);
    return;
  }

  // Update payment record to completed
  const { error: updateError } = await getSupabaseAdmin()
    .from('payments')
    .update({
      status: 'completed',
      stripe_payment_intent_id: session.payment_intent as string,
      completed_at: new Date().toISOString(),
    })
    .eq('stripe_checkout_session_id', session.id);

  if (updateError) {
    console.error('Error updating payment:', updateError);

    // If payment record doesn't exist, create one (fallback)
    const { error: insertError } = await getSupabaseAdmin()
      .from('payments')
      .insert({
        family_id,
        mentor_id,
        teen_id,
        stripe_checkout_session_id: session.id,
        stripe_payment_intent_id: session.payment_intent as string,
        amount: session.amount_total || 0,
        hours_purchased: parseFloat(hours_purchased),
        package_id: package_id || null,
        status: 'completed',
        payment_type: payment_type || 'hourly',
        completed_at: new Date().toISOString(),
      });

    if (insertError) {
      console.error('Error inserting payment:', insertError);
      return;
    }
  }

  // The trigger on the payments table will automatically credit the hours
  // But let's also do it here as a safety measure
  const hours = parseFloat(hours_purchased);

  // Check if balance exists
  const { data: existingBalance } = await getSupabaseAdmin()
    .from('hour_balances')
    .select('id, balance_hours, total_purchased_hours')
    .eq('family_id', family_id)
    .eq('mentor_id', mentor_id)
    .eq('teen_id', teen_id)
    .single();

  if (existingBalance) {
    // Update existing balance
    const { error: balanceError } = await getSupabaseAdmin()
      .from('hour_balances')
      .update({
        balance_hours: existingBalance.balance_hours + hours,
        total_purchased_hours: existingBalance.total_purchased_hours + hours,
        updated_at: new Date().toISOString(),
      })
      .eq('id', existingBalance.id);

    if (balanceError) {
      console.error('Error updating hour balance:', balanceError);
    }
  } else {
    // Create new balance
    const { error: balanceError } = await getSupabaseAdmin()
      .from('hour_balances')
      .insert({
        family_id,
        mentor_id,
        teen_id,
        balance_hours: hours,
        total_purchased_hours: hours,
        total_used_hours: 0,
      });

    if (balanceError) {
      console.error('Error creating hour balance:', balanceError);
    }
  }

  console.log(`Payment completed: ${hours} hours credited for family ${family_id}`);
}

async function handleCheckoutExpired(session: Stripe.Checkout.Session) {
  // Update payment record to failed
  const { error } = await getSupabaseAdmin()
    .from('payments')
    .update({ status: 'failed' })
    .eq('stripe_checkout_session_id', session.id);

  if (error) {
    console.error('Error updating expired payment:', error);
  }
}

async function handlePaymentFailed(paymentIntent: Stripe.PaymentIntent) {
  // Update payment record to failed
  const { error } = await getSupabaseAdmin()
    .from('payments')
    .update({ status: 'failed' })
    .eq('stripe_payment_intent_id', paymentIntent.id);

  if (error) {
    console.error('Error updating failed payment:', error);
  }
}
