import { useState } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface FacetCount {
  value: string;
  count: number;
  checked: boolean;
}

interface FacetGroupProps {
  label: string;
  counts: FacetCount[];
  onToggle: (value: string) => void;
  labelMap?: Record<string, string>;
  searchable?: boolean;
  maxVisible?: number;
}

export function FacetGroup({
  label,
  counts,
  onToggle,
  labelMap,
  searchable = false,
  maxVisible = 5,
}: FacetGroupProps) {
  const [expanded, setExpanded] = useState(false);
  const [search, setSearch] = useState('');

  const filtered = search
    ? counts.filter((c) => {
        const display = labelMap?.[c.value] || c.value;
        return display.toLowerCase().includes(search.toLowerCase());
      })
    : counts;

  const visible = expanded ? filtered : filtered.slice(0, maxVisible);
  const hasMore = filtered.length > maxVisible;

  return (
    <div className="py-2">
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider px-3 mb-1.5">
        {label}
      </p>

      {searchable && counts.length > maxVisible && (
        <div className="px-3 mb-1.5">
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari..."
            className="h-6 text-xs"
          />
        </div>
      )}

      <div className="space-y-0.5">
        {visible.map((item) => (
          <label
            key={item.value}
            className="flex items-center gap-2 px-3 py-1 cursor-pointer hover:bg-surface-hover text-sm"
          >
            <Checkbox
              checked={item.checked}
              onCheckedChange={() => onToggle(item.value)}
              className="h-3.5 w-3.5"
            />
            <span className="flex-1 truncate">
              {labelMap?.[item.value] || item.value}
            </span>
            <span className="text-xs text-muted-foreground tabular-nums">
              {item.count}
            </span>
          </label>
        ))}
      </div>

      {hasMore && !expanded && (
        <button
          type="button"
          className="text-xs text-primary px-3 mt-1 hover:underline"
          onClick={() => setExpanded(true)}
        >
          + {filtered.length - maxVisible} lainnya
        </button>
      )}
      {expanded && hasMore && (
        <button
          type="button"
          className="text-xs text-muted-foreground px-3 mt-1 hover:underline"
          onClick={() => setExpanded(false)}
        >
          Tampilkan lebih sedikit
        </button>
      )}
    </div>
  );
}
