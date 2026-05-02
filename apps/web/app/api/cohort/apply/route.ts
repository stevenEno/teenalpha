import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: Request) {
  const body = await request.json();
  const { parent_name, parent_email, teen_name, teen_curiosity, teen_self_starter } = body;

  if (!parent_name || !parent_email || !teen_name || !teen_curiosity || !teen_self_starter) {
    return NextResponse.json({ error: 'all_fields_required' }, { status: 400 });
  }

  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { error } = await admin.from('cohort_applications').insert({
    parent_name,
    parent_email,
    teen_name,
    teen_curiosity,
    teen_self_starter,
    cohort: 'summer-2026',
    status: 'new',
  });

  if (error) {
    console.error('Cohort application insert failed:', error);
    return NextResponse.json({ error: 'save_failed' }, { status: 500 });
  }

  // Send confirmation email via Resend (non-blocking — don't fail the
  // application if email delivery fails)
  if (process.env.RESEND_API_KEY) {
    try {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://teenalpha.org';
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from: 'TeenAlpha <noreply@teenalpha.org>',
          reply_to: 'steveneno@hey.com',
          to: parent_email,
          subject: `We received ${teen_name}'s application — here's what to do next`,
          html: `
<div style="font-family: 'Plus Jakarta Sans', -apple-system, sans-serif; max-width: 560px; margin: 0 auto; color: #1a1a1a;">
  <div style="background: #FF6B35; padding: 24px 32px; border-radius: 12px 12px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 22px;">Application received</h1>
  </div>
  <div style="background: #ffffff; padding: 32px; border: 1px solid #e5e5e5; border-top: none; border-radius: 0 0 12px 12px;">
    <p>Hi ${parent_name},</p>
    <p>
      Thank you for submitting ${teen_name}'s application to the
      <strong>Summer 2026 Cohort</strong>. We read every answer carefully and
      will be in touch within 48 hours to discuss whether the program is the
      right fit.
    </p>
    <h3 style="margin-top: 24px; color: #FF6B35;">While you wait — get a head start</h3>
    <p>
      We recommend that both you <em>and</em> ${teen_name} create accounts on
      TeenAlpha and explore the platform. The Explore page lets your teen
      discover 5 personalized career pathways based on their interests — it
      takes about 2 minutes and gives us even more context for your
      application.
    </p>
    <div style="text-align: center; margin: 28px 0;">
      <a href="${appUrl}/explore"
         style="display: inline-block; background: #FF6B35; color: white; padding: 14px 32px; border-radius: 999px; text-decoration: none; font-weight: bold; font-size: 16px;">
        Explore Now →
      </a>
    </div>
    <p style="font-size: 14px; color: #666;">
      <strong>Parent account:</strong>
      <a href="${appUrl}/signup" style="color: #FF6B35;">Sign up here</a>
      (select "Parent" as your role). Once your teen also signs up, you can
      connect your accounts from the dashboard.
    </p>
    <p style="font-size: 14px; color: #666;">
      <strong>Teen account:</strong>
      Have ${teen_name}
      <a href="${appUrl}/explore" style="color: #FF6B35;">start on the Explore page</a>
      — they'll create an account at the end of the flow.
    </p>
    <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
    <p style="font-size: 13px; color: #999;">
      Questions? Reply to this email or reach out to
      <a href="mailto:steveneno@hey.com" style="color: #FF6B35;">steveneno@hey.com</a>.
    </p>
  </div>
</div>
          `.trim(),
        }),
      });
    } catch (emailErr) {
      console.error('Confirmation email failed (non-blocking):', emailErr);
    }
  }

  return NextResponse.json({ ok: true });
}
