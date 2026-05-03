import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const connectionId = url.searchParams.get('connection_id');
  if (!connectionId) {
    return NextResponse.json({ error: 'missing connection_id' }, { status: 400 });
  }

  const [parentId, teenId] = connectionId.split('_');
  if (!parentId || !teenId) {
    return NextResponse.json({ error: 'invalid connection_id' }, { status: 400 });
  }

  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  await admin
    .from('family_connections')
    .update({ digest_unsubscribed_at: new Date().toISOString() })
    .eq('parent_id', parentId)
    .eq('teen_id', teenId);

  // Return a simple HTML confirmation page
  return new NextResponse(
    '<html><body style="font-family:sans-serif;text-align:center;padding:60px"><h2>Unsubscribed</h2><p>You will no longer receive weekly digest emails.</p></body></html>',
    { headers: { 'content-type': 'text/html' } }
  );
}
