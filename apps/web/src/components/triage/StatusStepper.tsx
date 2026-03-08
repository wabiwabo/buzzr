import { cn } from '@/lib/utils';
import { STATUS_LABELS, STATUS_TRANSITIONS } from '@/theme/tokens';

const LIFECYCLE = ['submitted', 'verified', 'assigned', 'in_progress', 'resolved'] as const;

interface StatusStepperProps {
  currentStatus: string;
  onTransition?: (newStatus: string) => void;
  className?: string;
}

export function StatusStepper({ currentStatus, onTransition, className }: StatusStepperProps) {
  const currentIdx = LIFECYCLE.indexOf(currentStatus as typeof LIFECYCLE[number]);
  const validTransitions = STATUS_TRANSITIONS[currentStatus] || [];

  // If rejected, show as terminal after current position
  const isRejected = currentStatus === 'rejected';

  return (
    <div className={cn('flex items-center gap-0', className)}>
      {LIFECYCLE.map((status, idx) => {
        const isCompleted = idx < currentIdx;
        const isCurrent = status === currentStatus;
        const isFuture = idx > currentIdx;
        const canTransition = validTransitions.includes(status);

        return (
          <div key={status} className="flex items-center">
            {idx > 0 && (
              <div
                className={cn(
                  'h-[2px] w-6',
                  isCompleted ? 'bg-positive' : 'bg-border',
                )}
              />
            )}
            <button
              type="button"
              disabled={!canTransition}
              onClick={() => canTransition && onTransition?.(status)}
              className={cn(
                'w-3 h-3 rounded-full shrink-0 transition-colors',
                isCompleted && 'bg-positive',
                isCurrent && 'bg-primary ring-2 ring-primary/30',
                isFuture && !canTransition && 'bg-border',
                isFuture && canTransition && 'bg-border hover:bg-primary/50 cursor-pointer',
              )}
              title={STATUS_LABELS[status] || status}
            />
          </div>
        );
      })}
      {isRejected && (
        <>
          <div className="h-[2px] w-6 bg-destructive" />
          <div
            className="w-3 h-3 rounded-full bg-destructive ring-2 ring-destructive/30"
            title="Ditolak"
          />
        </>
      )}
    </div>
  );
}
