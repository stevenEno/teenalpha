import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { getStripe } from '@/lib/stripe';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(request: Request, context: RouteContext) {
  const { id } = await context.params;
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (name: string) => cookieStore.get(name)?.value,
        set: () => {},
        remove: () => {},
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const { data: project } = await supabase
    .from('projects')
    .select('*')
    .eq('id', id)
    .eq('teen_id', user.id)
    .single();

  if (!project) return NextResponse.json({ error: 'not_found' }, { status: 404 });

  // Return existing link if already generated
  if (project.payment_link_url) {
    return NextResponse.json({ url: project.payment_link_url });
  }

  const body = await request.json().catch(() => ({}));
  const price = Math.max(100, Number(body.price_cents) || 500); // minimum $1, default $5
  const productName = body.product_name || project.title;
  const productDesc = body.product_description || project.money_path || project.description?.slice(0, 200) || '';

  try {
    const stripe = getStripe();

    const product = await stripe.products.create({
      name: productName,
      description: productDesc,
      metadata: {
        teen_alpha_project_id: project.id,
        teen_id: user.id,
      },
    });

    const priceObj = await stripe.prices.create({
      product: product.id,
      unit_amount: price,
      currency: 'usd',
    });

    const paymentLink = await stripe.paymentLinks.create({
      line_items: [{ price: priceObj.id, quantity: 1 }],
      metadata: {
        teen_alpha_project_id: project.id,
        teen_id: user.id,
        type: 'first_dollar',
      },
      after_completion: {
        type: 'redirect',
        redirect: {
          url: `${process.env.NEXT_PUBLIC_APP_URL ?? 'https://teenalpha.org'}/teens/${user.id}?purchased=true`,
        },
      },
    });

    await supabase
      .from('projects')
      .update({
        payment_link_url: paymentLink.url,
        payment_link_id: paymentLink.id,
      })
      .eq('id', project.id);

    return NextResponse.json({ url: paymentLink.url });
  } catch (err) {
    console.error('Payment link creation failed:', err);
    return NextResponse.json({ error: 'stripe_failed' }, { status: 500 });
  }
}
