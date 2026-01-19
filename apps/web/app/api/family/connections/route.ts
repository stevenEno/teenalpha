import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

// GET - Get all family connections for the current user
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

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    let connections: any[] = [];

    if (profile.role === 'parent') {
      // Get teens connected to this parent
      const { data, error } = await supabase
        .from('family_connections')
        .select(`
          id,
          relationship,
          verified,
          created_at,
          verified_at,
          teen:teen_id (
            id,
            full_name,
            email,
            avatar_url,
            grade,
            school,
            bio
          )
        `)
        .eq('parent_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching parent connections:', error);
        throw error;
      }

      // Try to get verification codes separately (in case column doesn't exist)
      let verificationCodes: Record<string, string> = {};
      try {
        const { data: codesData } = await supabase
          .from('family_connections')
          .select('id, verification_code')
          .eq('parent_id', user.id);

        if (codesData) {
          verificationCodes = Object.fromEntries(
            codesData.map((c: any) => [c.id, c.verification_code || 'N/A'])
          );
        }
      } catch (e) {
        console.log('verification_code column may not exist yet');
      }

      // Add verification codes to connections
      connections = (data || []).map((c: any) => ({
        ...c,
        verification_code: verificationCodes[c.id] || 'RUN SQL FIX',
      }));
    } else if (profile.role === 'teen') {
      // Get parents connected to this teen
      const { data, error } = await supabase
        .from('family_connections')
        .select(`
          id,
          relationship,
          verified,
          verification_code,
          created_at,
          verified_at,
          parent:parent_id (
            id,
            full_name,
            email,
            avatar_url
          )
        `)
        .eq('teen_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      connections = data;
    } else {
      connections = [];
    }

    return NextResponse.json({ connections, role: profile.role });

  } catch (error: any) {
    console.error('Family connections GET error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch connections' },
      { status: 500 }
    );
  }
}

// POST - Create a new family connection (parent adds teen)
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
        { error: 'Only parents can add teens' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { teenId, relationship } = body;

    if (!teenId) {
      return NextResponse.json(
        { error: 'Teen ID is required' },
        { status: 400 }
      );
    }

    // Verify the teen exists and is actually a teen
    const { data: teen } = await supabase
      .from('profiles')
      .select('id, role, full_name')
      .eq('id', teenId)
      .single();

    if (!teen || teen.role !== 'teen') {
      return NextResponse.json(
        { error: 'Teen not found' },
        { status: 404 }
      );
    }

    // Create the connection (unverified)
    const { data: connection, error } = await supabase
      .from('family_connections')
      .insert({
        parent_id: user.id,
        teen_id: teenId,
        relationship: relationship || 'parent',
        verified: false,
      })
      .select(`
        id,
        relationship,
        verified,
        verification_code,
        created_at,
        teen:teen_id (
          id,
          full_name,
          email,
          avatar_url,
          grade,
          school
        )
      `)
      .single();

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json(
          { error: 'Connection already exists' },
          { status: 409 }
        );
      }
      throw error;
    }

    return NextResponse.json({
      connection,
      message: `Connection request sent to ${teen.full_name}. They need to verify the code.`,
    });

  } catch (error: any) {
    console.error('Family connections POST error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create connection' },
      { status: 500 }
    );
  }
}

// PATCH - Verify a family connection (teen verifies parent's request)
export async function PATCH(request: NextRequest) {
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

    const body = await request.json();
    const { connectionId, verificationCode } = body;

    if (!connectionId) {
      return NextResponse.json(
        { error: 'Connection ID is required' },
        { status: 400 }
      );
    }

    // Get the connection
    const { data: connection } = await supabase
      .from('family_connections')
      .select('*')
      .eq('id', connectionId)
      .single();

    if (!connection) {
      return NextResponse.json(
        { error: 'Connection not found' },
        { status: 404 }
      );
    }

    // Verify the user is either the parent or teen in this connection
    if (connection.parent_id !== user.id && connection.teen_id !== user.id) {
      return NextResponse.json(
        { error: 'Not authorized' },
        { status: 403 }
      );
    }

    // If teen is verifying, check the code
    if (connection.teen_id === user.id && verificationCode) {
      if (connection.verification_code !== verificationCode.toUpperCase()) {
        return NextResponse.json(
          { error: 'Invalid verification code' },
          { status: 400 }
        );
      }
    }

    // Update to verified
    const { data: updated, error } = await supabase
      .from('family_connections')
      .update({
        verified: true,
        verified_at: new Date().toISOString(),
      })
      .eq('id', connectionId)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      connection: updated,
      message: 'Connection verified successfully!',
    });

  } catch (error: any) {
    console.error('Family connections PATCH error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to verify connection' },
      { status: 500 }
    );
  }
}

// DELETE - Remove a family connection
export async function DELETE(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const connectionId = searchParams.get('id');

    if (!connectionId) {
      return NextResponse.json(
        { error: 'Connection ID is required' },
        { status: 400 }
      );
    }

    // Delete the connection (RLS will verify ownership)
    const { error } = await supabase
      .from('family_connections')
      .delete()
      .eq('id', connectionId);

    if (error) throw error;

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error('Family connections DELETE error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete connection' },
      { status: 500 }
    );
  }
}
