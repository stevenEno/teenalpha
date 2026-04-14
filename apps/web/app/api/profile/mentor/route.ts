import { NextRequest, NextResponse } from 'next/server';
import { getAuthedSupabase } from '@/lib/api-auth';

// PATCH mentor profile fields. Only allows users with role='mentor' to update
// their own profile, and only the mentor-specific fields (no role escalation).
export async function PATCH(request: NextRequest) {
  const { user, supabase, error: authError } = await getAuthedSupabase();
  if (authError) return authError;

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user!.id)
    .single();

  if (profileError || !profile) {
    return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
  }

  if (profile.role !== 'mentor') {
    return NextResponse.json({ error: 'Only mentors can update mentor settings' }, { status: 403 });
  }

  const body = await request.json();

  const updates: Record<string, unknown> = {};
  if (typeof body.bio === 'string') updates.bio = body.bio.trim();
  if (typeof body.calendly_url === 'string') {
    const raw = body.calendly_url.trim();
    if (raw && !/^https?:\/\//i.test(raw)) {
      return NextResponse.json(
        { error: 'calendly_url must start with http:// or https://' },
        { status: 400 }
      );
    }
    updates.calendly_url = raw || null;
  }
  if (Array.isArray(body.expertise)) {
    updates.expertise = body.expertise
      .filter((s: unknown): s is string => typeof s === 'string')
      .map((s: string) => s.trim())
      .filter(Boolean);
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
  }

  const { error: updateError } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', user!.id);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, updated: Object.keys(updates) });
}
