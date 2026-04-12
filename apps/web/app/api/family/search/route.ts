import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

// GET - Search for teens by email
export async function GET(request: NextRequest) {
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

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify user is a parent
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || profile.role !== 'parent') {
      return NextResponse.json(
        { error: 'Only parents can search for teens' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');

    if (!email || email.length < 3) {
      return NextResponse.json(
        { error: 'Please enter at least 3 characters to search' },
        { status: 400 }
      );
    }

    // Search for teens by email using SECURITY DEFINER function
    // (bypasses RLS catch-22: parent can't see teen profiles without existing connection)
    const { data: teens, error } = await supabase
      .rpc('search_teens_by_email', { search_email: email })

    if (error) {
      console.error('Search error:', error);
      return NextResponse.json({ error: `Search failed: ${error.message}` }, { status: 500 });
    }

    // Get existing connections to mark already connected teens
    const { data: existingConnections, error: connError } = await supabase
      .from('family_connections')
      .select('teen_id, verified')
      .eq('parent_id', user.id);

    if (connError) {
      console.error('Connection lookup error:', connError);
      // Continue anyway - just won't show connection status
    }

    const connectionMap = new Map(
      (existingConnections || []).map((c) => [c.teen_id, c.verified])
    );

    // Add connection status to results
    const teensWithStatus = (teens || []).map((teen: { id: string; full_name: string; email: string; grade: string; school: string; avatar_url: string }) => ({
      ...teen,
      connectionStatus: connectionMap.has(teen.id)
        ? connectionMap.get(teen.id)
          ? 'verified'
          : 'pending'
        : null,
    }));

    return NextResponse.json({ teens: teensWithStatus });

  } catch (error: any) {
    console.error('Family search error:', error);
    return NextResponse.json(
      { error: error.message || 'Search failed' },
      { status: 500 }
    );
  }
}
