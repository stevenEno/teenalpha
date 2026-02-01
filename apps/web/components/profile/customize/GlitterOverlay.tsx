'use client';

import { useMemo } from 'react';

type OverlayType = 'glitter' | 'stars' | 'bubbles';

interface GlitterOverlayProps {
  type: OverlayType;
}

export function GlitterOverlay({ type }: GlitterOverlayProps) {
  const particles = useMemo(() => {
    const count = type === 'bubbles' ? 15 : 30;
    return Array.from({ length: count }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      top: Math.random() * 100,
      delay: Math.random() * 5,
      duration: 2 + Math.random() * 4,
      size: type === 'bubbles' ? 4 + Math.random() * 12 : 2 + Math.random() * 4,
    }));
  }, [type]);

  const getParticleStyle = (p: typeof particles[0]): React.CSSProperties => {
    const base: React.CSSProperties = {
      position: 'absolute',
      left: `${p.left}%`,
      top: `${p.top}%`,
      width: p.size,
      height: p.size,
      animationDelay: `${p.delay}s`,
      animationDuration: `${p.duration}s`,
      animationIterationCount: 'infinite',
    };

    switch (type) {
      case 'glitter':
        return {
          ...base,
          borderRadius: '50%',
          backgroundColor: '#fbbf24',
          boxShadow: '0 0 4px #fbbf24',
          animationName: 'sparkle',
        };
      case 'stars':
        return {
          ...base,
          borderRadius: '50%',
          backgroundColor: '#e2e8f0',
          boxShadow: '0 0 3px #e2e8f0',
          animationName: 'twinkle',
        };
      case 'bubbles':
        return {
          ...base,
          borderRadius: '50%',
          backgroundColor: 'transparent',
          border: '1px solid rgba(255,255,255,0.3)',
          animationName: 'float',
        };
    }
  };

  return (
    <>
      <style>{`
        @keyframes sparkle {
          0%, 100% { opacity: 0; transform: scale(0.5); }
          50% { opacity: 1; transform: scale(1.2); }
        }
        @keyframes twinkle {
          0%, 100% { opacity: 0.2; }
          50% { opacity: 1; }
        }
        @keyframes float {
          0% { transform: translateY(0) scale(1); opacity: 0.6; }
          50% { opacity: 1; }
          100% { transform: translateY(-100px) scale(0.5); opacity: 0; }
        }
        @keyframes shimmer {
          0% { background-position: 0% center; }
          100% { background-position: 200% center; }
        }
      `}</style>
      <div
        className="fixed inset-0 pointer-events-none overflow-hidden"
        style={{ zIndex: 10 }}
      >
        {particles.map(p => (
          <div key={p.id} style={getParticleStyle(p)} />
        ))}
      </div>
    </>
  );
}
