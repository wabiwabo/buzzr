import { cn } from '@/lib/utils';
import { useSlaTimer, type SlaPhase } from '@/hooks/useSlaTimer';

const phaseStyles: Record<SlaPhase, string> = {
  normal: 'text-sla-normal',
  warning: 'text-sla-warning',
  critical: 'text-sla-critical animate-pulse',
  breached: 'text-sla-critical font-semibold',
};

interface SlaCountdownProps {
  createdAt: string | Date | null;
  slaHours?: number;
  className?: string;
}

export function SlaCountdown({ createdAt, slaHours = 72, className }: SlaCountdownProps) {
  const { phase, label } = useSlaTimer(createdAt, slaHours);

  return (
    <span
      className={cn('text-xs font-mono tabular-nums', phaseStyles[phase], className)}
      title={phase === 'breached' ? 'SLA terlewat' : `Sisa ${label}`}
    >
      {label}
    </span>
  );
}
