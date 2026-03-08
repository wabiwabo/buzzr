import { cn } from '@/lib/utils';
import { Checkbox } from '@/components/ui/checkbox';
import { SlaCountdown } from './SlaCountdown';

export interface TriageRowData {
  id: string;
  title: string;
  meta: string;
  severity: 'critical' | 'warning' | 'info';
  createdAt: string;
  slaHours?: number;
  assigneeAvatar?: string;
  assigneeName?: string;
  isUnread?: boolean;
}

interface TriageListRowProps {
  data: TriageRowData;
  isSelected: boolean;
  isChecked: boolean;
  onSelect: (id: string) => void;
  onCheck: (id: string) => void;
  onShiftClick: (id: string) => void;
  showCheckbox: boolean;
}

const severityColor: Record<string, string> = {
  critical: 'bg-severity-critical',
  warning: 'bg-severity-warning',
  info: 'bg-severity-info',
};

function relativeAge(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}j`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}h`;
  return `${Math.floor(days / 7)}mg`;
}

export function TriageListRow({
  data,
  isSelected,
  isChecked,
  onSelect,
  onCheck,
  onShiftClick,
  showCheckbox,
}: TriageListRowProps) {
  return (
    <div
      role="row"
      aria-selected={isSelected}
      className={cn(
        'group flex items-center gap-2 px-3 h-10 cursor-pointer border-l-3 transition-colors',
        isSelected
          ? 'bg-surface-selected border-l-primary'
          : 'bg-surface border-l-transparent hover:bg-surface-hover',
      )}
      onClick={(e) => {
        if (e.shiftKey) onShiftClick(data.id);
        else onSelect(data.id);
      }}
    >
      {/* Checkbox */}
      <div className={cn('shrink-0', showCheckbox ? 'opacity-100' : 'opacity-0 group-hover:opacity-100')}>
        <Checkbox
          checked={isChecked}
          onCheckedChange={() => onCheck(data.id)}
          onClick={(e) => e.stopPropagation()}
          className="h-3.5 w-3.5"
        />
      </div>

      {/* Severity dot */}
      <div
        className={cn('w-2 h-2 rounded-full shrink-0', severityColor[data.severity])}
        aria-label={`Prioritas ${data.severity}`}
      />

      {/* Title + meta */}
      <div className="flex-1 min-w-0">
        <p className={cn(
          'text-sm truncate leading-tight',
          data.isUnread ? 'font-semibold' : 'font-normal',
        )}>
          {data.title}
        </p>
        <p className="text-xs text-muted-foreground truncate">
          {data.meta}
        </p>
      </div>

      {/* SLA */}
      <SlaCountdown
        createdAt={data.createdAt}
        slaHours={data.slaHours}
        className="shrink-0 w-14 text-right"
      />

      {/* Assignee avatar */}
      <div className="w-6 h-6 rounded-full shrink-0 overflow-hidden bg-muted flex items-center justify-center">
        {data.assigneeAvatar ? (
          <img src={data.assigneeAvatar} alt={data.assigneeName} className="w-full h-full object-cover" />
        ) : (
          <span className="text-[10px] text-muted-foreground">?</span>
        )}
      </div>

      {/* Age */}
      <span className="text-xs text-muted-foreground tabular-nums w-8 text-right shrink-0">
        {relativeAge(data.createdAt)}
      </span>
    </div>
  );
}
