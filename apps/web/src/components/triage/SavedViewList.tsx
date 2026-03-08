import { cn } from '@/lib/utils';
import { Plus } from 'lucide-react';

interface SavedView {
  id: string;
  name: string;
  filters: Record<string, string[]>;
}

interface SavedViewListProps {
  views: SavedView[];
  activeViewId: string | null;
  onSelectView: (id: string) => void;
  onCreateView?: () => void;
  counts?: Record<string, number>; // viewId → count
}

export function SavedViewList({
  views,
  activeViewId,
  onSelectView,
  onCreateView,
  counts,
}: SavedViewListProps) {
  return (
    <div className="py-2">
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider px-3 mb-1.5">
        Views
      </p>
      <div className="space-y-0.5">
        {views.map((view) => (
          <button
            key={view.id}
            type="button"
            onClick={() => onSelectView(view.id)}
            className={cn(
              'w-full flex items-center justify-between px-3 py-1.5 text-sm rounded-none transition-colors',
              activeViewId === view.id
                ? 'bg-surface-selected font-medium text-primary'
                : 'hover:bg-surface-hover',
            )}
          >
            <span className="truncate">{view.name}</span>
            {counts?.[view.id] != null && (
              <span className="text-xs text-muted-foreground tabular-nums">
                {counts[view.id]}
              </span>
            )}
          </button>
        ))}
        {onCreateView && (
          <button
            type="button"
            onClick={onCreateView}
            className="w-full flex items-center gap-1.5 px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-surface-hover"
          >
            <Plus className="h-3 w-3" />
            Buat View Baru
          </button>
        )}
      </div>
    </div>
  );
}
