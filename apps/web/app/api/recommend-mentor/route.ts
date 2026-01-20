import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

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

    const { linkedin_url, message } = await request.json();

    // Validate LinkedIn URL
    if (!linkedin_url || !linkedin_url.includes('linkedin.com/in/')) {
      return NextResponse.json(
        { error: 'Invalid LinkedIn URL' },
        { status: 400 }
      );
    }

    // Extract username from LinkedIn URL
    const urlParts = linkedin_url.split('/in/');
    const username = urlParts[1]?.split('/')[0]?.split('?')[0];

    if (!username) {
      return NextResponse.json(
        { error: 'Could not extract LinkedIn username from URL' },
        { status: 400 }
      );
    }

    // Check if this mentor recommendation already exists
    const { data: existing } = await supabase
      .from('mentor_recommendations')
      .select('*')
      .eq('linkedin_username', username)
      .single();

    if (existing) {
      return NextResponse.json(
        { error: 'This mentor has already been recommended' },
        { status: 400 }
      );
    }

    // Save the recommendation
    const { error: insertError } = await supabase
      .from('mentor_recommendations')
      .insert({
        recommended_by: user.id,
        linkedin_url: linkedin_url,
        linkedin_username: username,
        recommendation_message: message,
        status: 'pending',
      });

    if (insertError) {
      console.error('Insert error:', insertError);
      throw new Error('Failed to save recommendation');
    }

    // TODO: Send email notification to admin
    // TODO: Send LinkedIn invitation (manual process for now)

    return NextResponse.json({
      success: true,
      message: 'Recommendation submitted successfully',
    });

  } catch (error: any) {
    console.error('Recommend mentor error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to submit recommendation' },
      { status: 500 }
    );
  }
}