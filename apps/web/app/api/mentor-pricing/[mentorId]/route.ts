import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { formatPrice, calculateDiscount } from '@/lib/stripe';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ mentorId: string }> }
) {
  try {
    const { mentorId } = await params;
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

    // Get mentor details
    const { data: mentor, error: mentorError } = await supabase
      .from('profiles')
      .select('id, full_name, avatar_url, role')
      .eq('id', mentorId)
      .single();

    if (mentorError || !mentor) {
      return NextResponse.json({ error: 'Mentor not found' }, { status: 404 });
    }

    if (mentor.role !== 'mentor') {
      return NextResponse.json({ error: 'User is not a mentor' }, { status: 400 });
    }

    // Get pricing
    const { data: pricing, error: pricingError } = await supabase
      .from('mentor_pricing')
      .select('*')
      .eq('mentor_id', mentorId)
      .single();

    if (pricingError || !pricing) {
      return NextResponse.json({ error: 'Pricing not found for this mentor' }, { status: 404 });
    }

    // Get packages
    const { data: packages } = await supabase
      .from('hour_packages')
      .select('*')
      .eq('mentor_id', mentorId)
      .eq('is_active', true)
      .order('hours', { ascending: true });

    const hourlyRate = pricing.hourly_rate;

    // Format packages with discount calculations
    const formattedPackages = (packages || []).map((pkg: any) => {
      const originalPrice = hourlyRate * pkg.hours;
      const discount = calculateDiscount(originalPrice, pkg.price);

      return {
        id: pkg.id,
        hours: pkg.hours,
        price: pkg.price,
        price_formatted: formatPrice(pkg.price),
        name: pkg.name,
        description: pkg.description,
        discount_percent: discount,
        original_price: originalPrice,
        original_price_formatted: formatPrice(originalPrice),
        savings: originalPrice - pkg.price,
        savings_formatted: formatPrice(originalPrice - pkg.price),
      };
    });

    return NextResponse.json({
      hourly_rate: hourlyRate,
      hourly_rate_formatted: formatPrice(hourlyRate),
      currency: pricing.currency,
      packages: formattedPackages,
      mentor: {
        id: mentor.id,
        full_name: mentor.full_name,
        avatar_url: mentor.avatar_url,
      },
    });

  } catch (error: any) {
    console.error('Mentor pricing API error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch mentor pricing' },
      { status: 500 }
    );
  }
}
