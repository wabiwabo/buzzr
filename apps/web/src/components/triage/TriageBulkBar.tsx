import { X, UserPlus, ArrowRightLeft, Merge } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface TriageBulkBarProps {
  count: number;
  onAssign: () => void;
  onStatusChange: () => void;
  onMerge?: () => void;
  onClear: () => void;
  className?: string;
}

export function TriageBulkBar({
  count,
  onAssign,
  onStatusChange,
  onMerge,
  onClear,
  className,
}: TriageBulkBarProps) {
  if (count === 0) return null;

  return (
    <div className={cn(
      'flex items-center gap-2 px-3 py-2 bg-primary/5 border-b border-primary/20',
      className,
    )}>
      <span className="text-sm font-medium text-primary">
        {count} dipilih
      </span>

      <div className="flex items-center gap-1 ml-2">
        <Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={onAssign}>
          <UserPlus className="h-3 w-3" />
          Tugaskan
        </Button>
        <Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={onStatusChange}>
          <ArrowRightLeft className="h-3 w-3" />
          Status
        </Button>
        {onMerge && (
          <Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={onMerge}>
            <Merge className="h-3 w-3" />
            Gabung
          </Button>
        )}
      </div>

      <Button variant="ghost" size="sm" className="h-7 text-xs gap-1 ml-auto" onClick={onClear}>
        <X className="h-3 w-3" />
        Batal
      </Button>
    </div>
  );
}
