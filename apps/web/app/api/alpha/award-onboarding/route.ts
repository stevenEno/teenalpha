import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { ONBOARDING_ALPHA } from '@/lib/incentives';

// POST: Award onboarding Alpha to authenticated user (if not already awarded)
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

    // Require authentication
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const { source = 'explore_onboarding', metadata = {} } = body;

    // Use service role for database operations
    const supabaseAdmin = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
        },
      }
    );

    // Check if already awarded
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('onboarding_alpha_awarded')
      .eq('id', user.id)
      .single();

    if (profile?.onboarding_alpha_awarded) {
      return NextResponse.json({
        success: true,
        alphaAwarded: 0,
        message: 'Alpha already awarded',
      });
    }

    // Award Alpha
    const { error: alphaError } = await supabaseAdmin
      .from('alpha_awards')
      .insert({
        user_id: user.id,
        source,
        amount: ONBOARDING_ALPHA,
        metadata,
      });

    if (alphaError) {
      console.error('Failed to award Alpha:', alphaError);
      throw new Error('Failed to award Alpha');
    }

    // Mark as awarded on profile
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .update({
        onboarding_alpha_awarded: true,
        onboarding_completed_at: new Date().toISOString(),
      })
      .eq('id', user.id);

    if (profileError) {
      console.error('Failed to update profile:', profileError);
      // Don't fail - Alpha was awarded
    }

    console.log('Awarded onboarding Alpha to user:', user.id, 'amount:', ONBOARDING_ALPHA);

    return NextResponse.json({
      success: true,
      alphaAwarded: ONBOARDING_ALPHA,
    });
  } catch (error: any) {
    console.error('Award Alpha error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to award Alpha' },
      { status: 500 }
    );
  }
}

// GET: Check if onboarding Alpha was awarded
export async function GET() {
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
      .select('onboarding_alpha_awarded, onboarding_interest, onboarding_completed_at')
      .eq('id', user.id)
      .single();

    return NextResponse.json({
      awarded: profile?.onboarding_alpha_awarded || false,
      interest: profile?.onboarding_interest || null,
      completedAt: profile?.onboarding_completed_at || null,
    });
  } catch (error: any) {
    console.error('Check Alpha error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to check Alpha status' },
      { status: 500 }
    );
  }
}
