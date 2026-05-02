import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: connections } = await admin
    .from('family_connections')
    .select('parent_id, teen_id, profiles!family_connections_parent_id_fkey(email, full_name), teen:profiles!family_connections_teen_id_fkey(full_name)')
    .eq('verified', true)
    .is('digest_unsubscribed_at', null);

  if (!connections || connections.length === 0) {
    return NextResponse.json({ ok: true, sent: 0, reason: 'no_subscribed_parents' });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://teenalpha.org';
  let sent = 0;

  for (const conn of connections) {
    const parentRaw = conn.profiles;
    const teenRaw = conn.teen;
    const parent = (Array.isArray(parentRaw) ? parentRaw[0] : parentRaw) as { email: string; full_name: string } | null;
    const teen = (Array.isArray(teenRaw) ? teenRaw[0] : teenRaw) as { full_name: string } | null;
    if (!parent?.email || !teen?.full_name) continue;

    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

    const { count: weekEvents } = await admin
      .from('activity_events')
      .select('*', { count: 'exact', head: true })
      .eq('actor_id', conn.teen_id)
      .gte('created_at', sevenDaysAgo);

    const { data: streak } = await admin
      .from('streaks')
      .select('current_streak')
      .eq('user_id', conn.teen_id)
      .maybeSingle();

    const { data: recentNode } = await admin
      .from('pathway_nodes')
      .select('title')
      .eq('user_id', conn.teen_id)
      .eq('status', 'completed')
      .order('completed_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    const { count: completedProjects } = await admin
      .from('projects')
      .select('*', { count: 'exact', head: true })
      .eq('teen_id', conn.teen_id)
      .eq('is_complete', true);

    const activityCount = weekEvents ?? 0;
    const streakCount = streak?.current_streak ?? 0;
    const projectCount = completedProjects ?? 0;
    const projectsUntilMap = Math.max(0, 5 - projectCount);
    const conversationStarter = recentNode?.title
      ? `Ask them about "${recentNode.title}".`
      : 'Ask them what they want to work on next.';

    const hasActivity = activityCount > 0;
    const subject = hasActivity
      ? `${teen.full_name}'s week in review — ${streakCount > 0 ? `${streakCount}-day streak` : `${activityCount} steps`}`
      : `Check in with ${teen.full_name} this week`;

    const body = hasActivity
      ? `<p>This week <strong>${teen.full_name}</strong> completed <strong>${activityCount} steps</strong> on their pathway${streakCount > 0 ? ` and is on a <strong>${streakCount}-day streak</strong>` : ''}. They've shipped <strong>${projectCount} project${projectCount !== 1 ? 's' : ''}</strong> total${projectsUntilMap > 0 ? ` — <strong>${projectsUntilMap} more</strong> until they unlock the Map of Opportunity (real startup connections)` : ' and have unlocked the Map of Opportunity'}.</p><p><strong>Conversation starter:</strong> ${conversationStarter}</p>`
      : `<p><strong>${teen.full_name}</strong> didn't log any activity this week. A quick check-in could help — sometimes all it takes is "what are you working on?" at dinner.</p><p><strong>Conversation starter:</strong> ${conversationStarter}</p>`;

    if (process.env.RESEND_API_KEY) {
      try {
        await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
          },
          body: JSON.stringify({
            from: 'TeenAlpha <digest@teenalpha.org>',
              reply_to: 'steveneno@hey.com',
            to: parent.email,
            subject,
            html: `
<div style="font-family: 'Plus Jakarta Sans', -apple-system, sans-serif; max-width: 560px; margin: 0 auto; color: #1a1a1a;">
  <div style="background: #FF6B35; padding: 20px 28px; border-radius: 12px 12px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 18px;">Weekly Progress Update</h1>
  </div>
  <div style="background: #ffffff; padding: 28px; border: 1px solid #e5e5e5; border-top: none; border-radius: 0 0 12px 12px;">
    <p>Hi ${parent.full_name},</p>
    ${body}
    <div style="text-align: center; margin: 24px 0;">
      <a href="${appUrl}/family/dashboard" style="display: inline-block; background: #FF6B35; color: white; padding: 12px 28px; border-radius: 999px; text-decoration: none; font-weight: bold;">View Dashboard</a>
    </div>
    <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
    <p style="font-size: 12px; color: #999; text-align: center;">
      <a href="${appUrl}/api/digest/unsubscribe?connection_id=${conn.parent_id}_${conn.teen_id}" style="color: #999;">Unsubscribe</a> from weekly digests.
    </p>
  </div>
</div>`.trim(),
          }),
        });
        sent++;
      } catch (err) {
        console.error('Digest email failed:', err);
      }
    }
  }

  return NextResponse.json({ ok: true, sent });
}
