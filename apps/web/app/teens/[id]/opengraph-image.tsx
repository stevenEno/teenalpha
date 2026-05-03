import { ImageResponse } from '@vercel/og';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'edge';
export const alt = 'Teen Alpha — Pathway';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function OGImage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: profile } = await admin
    .from('profiles')
    .select('full_name, onboarding_interest, profile_public')
    .eq('id', id)
    .single();

  if (!profile || !profile.profile_public) {
    return new ImageResponse(
      (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            width: '100%',
            height: '100%',
            background: 'linear-gradient(135deg, #1a1a1a 0%, #2d1f14 100%)',
            fontFamily: 'sans-serif',
            color: 'white',
            padding: '60px',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              background: '#FF6B35',
              fontSize: '36px',
              fontWeight: 'bold',
              marginBottom: '20px',
            }}
          >
            T
          </div>
          <div style={{ fontSize: '48px', fontWeight: 'bold', marginBottom: '8px' }}>
            Teen Alpha
          </div>
          <div style={{ fontSize: '24px', color: '#999', marginBottom: '32px' }}>
            Where teens build real things
          </div>
          <div
            style={{
              position: 'absolute',
              bottom: '40px',
              fontSize: '18px',
              color: '#666',
            }}
          >
            teenalpha.org
          </div>
        </div>
      ),
      { ...size }
    );
  }

  const { data: streak } = await admin
    .from('streaks')
    .select('current_streak')
    .eq('user_id', id)
    .maybeSingle();

  const { count: projects } = await admin
    .from('projects')
    .select('*', { count: 'exact', head: true })
    .eq('teen_id', id)
    .eq('is_complete', true);

  const name = profile?.full_name ?? 'A Teen';
  const parts = name.split(' ');
  const displayName = parts.length > 1 ? `${parts[0]} ${parts[parts.length - 1][0]}.` : parts[0];
  const interest = profile?.onboarding_interest ?? '';
  const streakCount = streak?.current_streak ?? 0;
  const projectCount = projects ?? 0;

  return new ImageResponse(
    (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          width: '100%',
          height: '100%',
          background: 'linear-gradient(135deg, #1a1a1a 0%, #2d1f14 100%)',
          fontFamily: 'sans-serif',
          color: 'white',
          padding: '60px',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '80px',
            height: '80px',
            borderRadius: '50%',
            background: '#FF6B35',
            fontSize: '36px',
            fontWeight: 'bold',
            marginBottom: '20px',
          }}
        >
          {displayName[0]}
        </div>
        <div style={{ fontSize: '48px', fontWeight: 'bold', marginBottom: '8px' }}>
          {displayName}
        </div>
        {interest && (
          <div style={{ fontSize: '24px', color: '#FF6B35', marginBottom: '32px' }}>
            {interest}
          </div>
        )}
        <div style={{ display: 'flex', gap: '48px', fontSize: '20px', color: '#999' }}>
          {streakCount > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <span style={{ fontSize: '36px', fontWeight: 'bold', color: '#FF6B35' }}>
                {streakCount}
              </span>
              <span>day streak</span>
            </div>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <span style={{ fontSize: '36px', fontWeight: 'bold', color: 'white' }}>
              {projectCount}
            </span>
            <span>projects</span>
          </div>
        </div>
        <div
          style={{
            position: 'absolute',
            bottom: '40px',
            fontSize: '18px',
            color: '#666',
          }}
        >
          teenalpha.org — Where teens build real things
        </div>
      </div>
    ),
    { ...size }
  );
}
