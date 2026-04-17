import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET() {
  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data } = await admin
    .from('profiles')
    .select('full_name, avatar_url, bio, expertise')
    .eq('is_default_mentor', true)
    .limit(1)
    .maybeSingle();

  if (!data) return NextResponse.json({ mentor: null });

  return NextResponse.json({ mentor: data });
}
