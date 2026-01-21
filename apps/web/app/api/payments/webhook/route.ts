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
  console.log('Webhook received checkout.session.completed:', session.id);
  console.log('Session metadata:', session.metadata);

  const { family_id, mentor_id, teen_id, hours_purchased, payment_type, package_id } = session.metadata || {};

  if (!family_id || !mentor_id || !teen_id || !hours_purchased) {
    console.error('Missing metadata in checkout session:', session.id, { family_id, mentor_id, teen_id, hours_purchased });
    return;
  }

  const supabaseAdmin = getSupabaseAdmin();
  const hours = parseFloat(hours_purchased);

  // First, check if this payment was already processed (idempotency check)
  const { data: existingPayment } = await supabaseAdmin
    .from('payments')
    .select('id, status')
    .eq('stripe_checkout_session_id', session.id)
    .single();

  if (existingPayment?.status === 'completed') {
    console.log('Payment already processed, skipping:', session.id);
    return;
  }

  // Update or create payment record
  if (existingPayment) {
    const { error: updateError } = await supabaseAdmin
      .from('payments')
      .update({
        status: 'completed',
        stripe_payment_intent_id: session.payment_intent as string,
        completed_at: new Date().toISOString(),
      })
      .eq('stripe_checkout_session_id', session.id);

    if (updateError) {
      console.error('Error updating payment:', updateError);
    } else {
      console.log('Payment updated to completed:', session.id);
    }
  } else {
    // Create payment record if it doesn't exist
    const { error: insertError } = await supabaseAdmin
      .from('payments')
      .insert({
        family_id,
        mentor_id,
        teen_id,
        stripe_checkout_session_id: session.id,
        stripe_payment_intent_id: session.payment_intent as string,
        amount: session.amount_total || 0,
        hours_purchased: hours,
        package_id: package_id || null,
        status: 'completed',
        payment_type: payment_type || 'hourly',
        completed_at: new Date().toISOString(),
      });

    if (insertError) {
      console.error('Error inserting payment:', insertError);
      return;
    }
    console.log('Payment record created:', session.id);
  }

  // NOTE: The trigger on payments table (credit_hours_after_payment) automatically credits hours
  // when payment status changes to 'completed'. We verify it worked here.

  // Give the trigger a moment to complete, then verify the balance was credited
  const { data: balance, error: balanceCheckError } = await supabaseAdmin
    .from('hour_balances')
    .select('id, balance_hours, total_purchased_hours')
    .eq('family_id', family_id)
    .eq('mentor_id', mentor_id)
    .eq('teen_id', teen_id)
    .single();

  if (balanceCheckError) {
    console.error('Error verifying hour balance after payment:', balanceCheckError);
    console.log('The database trigger may have failed to credit hours. Manual intervention may be required.');
  } else {
    console.log(`Payment completed: Balance is now ${balance.balance_hours} hours (total purchased: ${balance.total_purchased_hours}) for family ${family_id}`);
  }
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
