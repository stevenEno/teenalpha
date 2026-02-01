const shapes = [
  // Large circle, top-left, purple
  { type: 'circle', cx: '8%', cy: '15%', size: 64, color: 'var(--alpha-primary)', opacity: 0.12, anim: 'ambient-float-1', dur: '32s', delay: '0s' },
  // Small triangle, top-right, orange
  { type: 'triangle', cx: '85%', cy: '10%', size: 28, color: 'var(--alpha-secondary)', opacity: 0.10, anim: 'ambient-float-2', dur: '26s', delay: '-8s' },
  // Medium hexagon, left, purple
  { type: 'hexagon', cx: '12%', cy: '50%', size: 40, color: 'var(--alpha-primary)', opacity: 0.08, anim: 'ambient-float-3', dur: '36s', delay: '-4s' },
  // Small circle, bottom-right, indigo
  { type: 'circle', cx: '78%', cy: '75%', size: 24, color: '#6366f1', opacity: 0.10, anim: 'ambient-float-1', dur: '28s', delay: '-12s' },
  // Medium rounded square, top-center, orange
  { type: 'square', cx: '45%', cy: '8%', size: 36, color: 'var(--alpha-secondary)', opacity: 0.09, anim: 'ambient-float-2', dur: '34s', delay: '-6s' },
  // Large triangle, bottom-left, purple
  { type: 'triangle', cx: '18%', cy: '80%', size: 56, color: 'var(--alpha-primary)', opacity: 0.10, anim: 'ambient-float-3', dur: '40s', delay: '-16s' },
  // Small hexagon, right, indigo
  { type: 'hexagon', cx: '88%', cy: '45%', size: 22, color: '#6366f1', opacity: 0.12, anim: 'ambient-float-1', dur: '24s', delay: '-10s' },
  // Medium circle, bottom-center, orange
  { type: 'circle', cx: '55%', cy: '85%', size: 48, color: 'var(--alpha-secondary)', opacity: 0.08, anim: 'ambient-float-2', dur: '38s', delay: '-14s' },
  // Small square, top-right, purple
  { type: 'square', cx: '72%', cy: '20%', size: 20, color: 'var(--alpha-primary)', opacity: 0.10, anim: 'ambient-float-3', dur: '27s', delay: '-3s' },
  // Large circle, center, indigo
  { type: 'circle', cx: '40%', cy: '55%', size: 72, color: '#6366f1', opacity: 0.07, anim: 'ambient-float-1', dur: '42s', delay: '-20s' },
  // Small triangle, bottom-right, orange
  { type: 'triangle', cx: '90%', cy: '70%', size: 18, color: 'var(--alpha-secondary)', opacity: 0.12, anim: 'ambient-float-2', dur: '22s', delay: '-7s' },
  // Medium hexagon, top-left, purple
  { type: 'hexagon', cx: '25%', cy: '25%', size: 32, color: 'var(--alpha-primary)', opacity: 0.09, anim: 'ambient-float-3', dur: '35s', delay: '-18s' },
  // Tiny circle, center-right, indigo
  { type: 'circle', cx: '65%', cy: '40%', size: 16, color: '#6366f1', opacity: 0.13, anim: 'ambient-drift', dur: '18s', delay: '-5s' },
  // Tiny square, center-left, orange
  { type: 'square', cx: '30%', cy: '65%', size: 14, color: 'var(--alpha-secondary)', opacity: 0.11, anim: 'ambient-drift', dur: '20s', delay: '-9s' },
] as const;

function renderShape(type: string, size: number, color: string) {
  const half = size / 2;

  switch (type) {
    case 'circle':
      return <circle cx={half} cy={half} r={half} fill={color} />;
    case 'triangle': {
      const h = size * 0.866;
      return <polygon points={`${half},0 ${size},${h} 0,${h}`} fill={color} />;
    }
    case 'square':
      return <rect x={0} y={0} width={size} height={size} rx={size * 0.2} fill={color} />;
    case 'hexagon': {
      const pts = Array.from({ length: 6 }, (_, i) => {
        const angle = (Math.PI / 3) * i - Math.PI / 2;
        return `${half + half * Math.cos(angle)},${half + half * Math.sin(angle)}`;
      }).join(' ');
      return <polygon points={pts} fill={color} />;
    }
    default:
      return null;
  }
}

export function AmbientBackground() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 overflow-hidden"
      style={{ zIndex: 0 }}
    >
      {shapes.map((s, i) => (
        <div
          key={i}
          className="absolute"
          style={{
            left: s.cx,
            top: s.cy,
            opacity: s.opacity,
            animation: `${s.anim} ${s.dur} ease-in-out infinite`,
            animationDelay: s.delay,
            willChange: 'transform',
          }}
        >
          <svg
            width={s.size}
            height={s.size}
            viewBox={`0 0 ${s.size} ${s.size}`}
            xmlns="http://www.w3.org/2000/svg"
          >
            {renderShape(s.type, s.size, s.color)}
          </svg>
        </div>
      ))}
    </div>
  );
}
