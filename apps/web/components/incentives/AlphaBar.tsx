'use client';

import { motion } from 'framer-motion';
import { Zap } from 'lucide-react';
import { useAlpha } from '@/hooks/useAlpha';
import { getAlphaRank } from '@/lib/incentives';

interface AlphaBarProps {
  compact?: boolean;
}

export function AlphaBar({ compact = false }: AlphaBarProps) {
  const { alpha, loading } = useAlpha();

  if (loading || !alpha) {
    return (
      <div className={`animate-pulse bg-gray-100 rounded-xl ${compact ? 'h-8' : 'h-14'}`} />
    );
  }

  const rank = getAlphaRank(alpha.level);

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1 text-sm font-semibold" style={{ color: 'var(--alpha-primary)' }}>
          <Zap className="w-3.5 h-3.5" />
          <span>{alpha.total}</span>
        </div>
        <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            style={{ background: 'linear-gradient(90deg, var(--alpha-primary), var(--alpha-secondary))' }}
            initial={{ width: 0 }}
            animate={{ width: `${alpha.levelProgress * 100}%` }}
            transition={{ type: 'spring', stiffness: 80, damping: 15 }}
          />
        </div>
        <span className="text-xs text-muted-foreground">Lv{alpha.level}</span>
      </div>
    );
  }

  return (
    <div className="rounded-xl border bg-card p-4 space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div
            className="flex items-center justify-center w-8 h-8 rounded-lg font-bold text-sm text-white"
            style={{ background: 'var(--alpha-primary)' }}
          >
            {alpha.level}
          </div>
          <div>
            <div className="flex items-center gap-1 font-semibold text-sm">
              <Zap className="w-4 h-4" style={{ color: 'var(--alpha-primary)' }} />
              {alpha.total} Alpha
            </div>
            <p className="text-xs text-muted-foreground">{rank}</p>
          </div>
        </div>
        <div className="text-right text-xs text-muted-foreground">
          Level {alpha.level}
          <span className="mx-1">·</span>
          {Math.round(alpha.levelProgress * 100)}%
        </div>
      </div>
      <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ background: 'linear-gradient(90deg, var(--alpha-primary), var(--alpha-secondary))' }}
          initial={{ width: 0 }}
          animate={{ width: `${alpha.levelProgress * 100}%` }}
          transition={{ type: 'spring', stiffness: 80, damping: 15 }}
        />
      </div>
    </div>
  );
}
