import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { notFound } from 'next/navigation';
import type { ProfileCustomization, ProfileWidget, ProfileCssOverrides } from '@teen-alpha/database';
import { PublicProfileView } from './view';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function PublicProfilePage({ params }: Props) {
  const { id } = await params;
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

  // Fetch profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, full_name, avatar_url, bio, role')
    .eq('id', id)
    .single();

  if (!profile) {
    notFound();
  }

  // Fetch customization
  const { data: customization } = await supabase
    .from('profile_customizations')
    .select('*')
    .eq('user_id', id)
    .single();

  // Privacy check
  const { data: { user } } = await supabase.auth.getUser();
  const isOwner = user?.id === id;

  if (customization?.visibility === 'private' && !isOwner) {
    // Check if viewer is mentor
    if (user) {
      const { data: mentorship } = await supabase
        .from('mentorships')
        .select('id')
        .eq('mentor_id', user.id)
        .eq('teen_id', id)
        .eq('status', 'active')
        .single();

      if (!mentorship) {
        notFound();
      }
    } else {
      notFound();
    }
  }

  // Increment visitor counter widget if present and not the owner
  if (customization && !isOwner) {
    const widgets = (customization.widgets || []) as ProfileWidget[];
    const counterIdx = widgets.findIndex(w => w.type === 'visitor_counter');
    if (counterIdx !== -1) {
      const updated = [...widgets];
      const count = ((updated[counterIdx].config?.count as number) || 0) + 1;
      updated[counterIdx] = { ...updated[counterIdx], config: { ...updated[counterIdx].config, count } };
      await supabase
        .from('profile_customizations')
        .update({ widgets: updated })
        .eq('user_id', id);
    }
  }

  // Fetch alpha score for display
  let alphaLevel = 1;
  let alphaTotal = 0;
  try {
    const { data: questProgress } = await supabase
      .from('user_quest_progress')
      .select('total_points, current_streak')
      .eq('user_id', id)
      .single();

    const { data: ladderMembers } = await supabase
      .from('ladder_members')
      .select('tokens')
      .eq('user_id', id);

    const totalTokens = ladderMembers?.reduce((sum: number, m: { tokens: number }) => sum + (m.tokens || 0), 0) ?? 0;

    const { data: ambitionGoals } = await supabase
      .from('ambition_goals')
      .select('total_stars')
      .eq('user_id', id);

    const totalStars = ambitionGoals?.reduce((sum: number, g: { total_stars: number }) => sum + (g.total_stars || 0), 0) ?? 0;

    const { buildAlphaScore } = await import('@/lib/incentives');
    const alpha = buildAlphaScore(
      questProgress?.total_points ?? 0,
      totalTokens,
      totalStars,
      questProgress?.current_streak ?? 0,
    );
    alphaLevel = alpha.level;
    alphaTotal = alpha.total;
  } catch {
    // Silently fail for alpha display
  }

  return (
    <PublicProfileView
      profile={profile}
      customization={customization as ProfileCustomization | null}
      isOwner={isOwner}
      alphaLevel={alphaLevel}
      alphaTotal={alphaTotal}
    />
  );
}
