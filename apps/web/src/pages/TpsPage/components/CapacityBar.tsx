// apps/web/src/pages/TpsPage/components/CapacityBar.tsx

import React from 'react';
import { cn } from '@/lib/utils';

interface CapacityBarProps {
  current: number;
  max: number;
  showLabel?: boolean;
  size?: 'sm' | 'md';
}

function getBarColor(pct: number): string {
  if (pct >= 90) return 'bg-red-500';
  if (pct >= 70) return 'bg-amber-500';
  return 'bg-emerald-500';
}

export const CapacityBar: React.FC<CapacityBarProps> = ({
  current,
  max,
  showLabel = true,
  size = 'md',
}) => {
  const pct = max > 0 ? Math.min(100, Math.round((current / max) * 100)) : 0;

  return (
    <div className="flex items-center gap-2">
      <div
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Kapasitas ${pct}%`}
        className={cn(
          'flex-1 rounded-full bg-gray-200 overflow-hidden',
          size === 'sm' ? 'h-1.5' : 'h-2.5',
        )}
      >
        <div
          className={cn('h-full rounded-full transition-all', getBarColor(pct))}
          style={{ width: `${pct}%` }}
        />
      </div>
      {showLabel && (
        <span
          className={cn(
            'tabular-nums text-right shrink-0',
            size === 'sm' ? 'text-[10px] w-8' : 'text-xs w-10',
            pct >= 90
              ? 'text-red-600 font-medium'
              : pct >= 70
                ? 'text-amber-600'
                : 'text-muted-foreground',
          )}
        >
          {pct}%
        </span>
      )}
    </div>
  );
};
