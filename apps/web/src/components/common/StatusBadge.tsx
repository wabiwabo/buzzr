import React from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const STATUS_VARIANT_MAP: Record<string, string> = {
  active: 'bg-positive/10 text-positive border-positive/20',
  full: 'bg-negative/10 text-negative border-negative/20',
  maintenance: 'bg-warning/10 text-warning border-warning/20',
  submitted: 'bg-info/10 text-info border-info/20',
  verified: 'bg-cyan-500/10 text-cyan-600 border-cyan-500/20',
  assigned: 'bg-warning/10 text-warning border-warning/20',
  in_progress: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20',
  resolved: 'bg-positive/10 text-positive border-positive/20',
  rejected: 'bg-negative/10 text-negative border-negative/20',
  pending: 'bg-warning/10 text-warning border-warning/20',
  paid: 'bg-positive/10 text-positive border-positive/20',
  failed: 'bg-negative/10 text-negative border-negative/20',
  expired: 'bg-neutral/10 text-neutral border-neutral/20',
  refunded: 'bg-purple-500/10 text-purple-600 border-purple-500/20',
  available: 'bg-positive/10 text-positive border-positive/20',
  in_use: 'bg-info/10 text-info border-info/20',
  completed: 'bg-positive/10 text-positive border-positive/20',
  cancelled: 'bg-negative/10 text-negative border-negative/20',
  inactive: 'bg-negative/10 text-negative border-negative/20',
};

const STATUS_DOT_COLOR: Record<string, string> = {
  active: 'bg-positive',
  full: 'bg-negative',
  maintenance: 'bg-warning',
  submitted: 'bg-info',
  verified: 'bg-cyan-500',
  assigned: 'bg-warning',
  in_progress: 'bg-yellow-500',
  resolved: 'bg-positive',
  rejected: 'bg-negative',
  pending: 'bg-warning',
  paid: 'bg-positive',
  failed: 'bg-negative',
  available: 'bg-positive',
  in_use: 'bg-info',
  completed: 'bg-positive',
  cancelled: 'bg-negative',
  inactive: 'bg-negative',
};

interface StatusBadgeProps {
  status: string;
  label?: string;
  dot?: boolean;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, label, dot = false }) => {
  const displayLabel = label || status.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

  if (dot) {
    return (
      <span className="inline-flex items-center gap-1.5">
        <span className={cn(
          'w-2 h-2 rounded-full shrink-0',
          status === 'active' && 'animate-pulse',
          STATUS_DOT_COLOR[status] || 'bg-neutral',
        )} />
        <span className="text-sm">{displayLabel}</span>
      </span>
    );
  }

  return (
    <Badge
      variant="outline"
      className={cn('text-xs', STATUS_VARIANT_MAP[status] || 'bg-neutral/10 text-neutral border-neutral/20')}
    >
      {displayLabel}
    </Badge>
  );
};
