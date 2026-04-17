import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: Request) {
  const body = await request.json();
  const { parent_name, parent_email, teen_name } = body;

  if (!parent_name || !parent_email || !teen_name) {
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
    cohort: 'summer-2026',
    status: 'new',
  });

  if (error) {
    console.error('Cohort application insert failed:', error);
    return NextResponse.json({ error: 'save_failed' }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
