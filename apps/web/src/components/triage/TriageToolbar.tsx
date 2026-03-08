import { Search, SlidersHorizontal, RotateCw, Keyboard, AlignJustify } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

interface ActiveFilter {
  key: string;
  label: string;
  value: string;
}

interface TriageToolbarProps {
  search: string;
  onSearchChange: (value: string) => void;
  searchRef?: React.Ref<HTMLInputElement>;
  groupBy: string;
  onGroupByChange: (value: string) => void;
  groupByOptions: Array<{ value: string; label: string }>;
  activeFilters: ActiveFilter[];
  onRemoveFilter: (key: string, value: string) => void;
  onRefresh: () => void;
  onShowHelp: () => void;
  density: 'compact' | 'comfortable';
  onDensityChange: (density: 'compact' | 'comfortable') => void;
  className?: string;
}

export function TriageToolbar({
  search,
  onSearchChange,
  searchRef,
  groupBy,
  onGroupByChange,
  groupByOptions,
  activeFilters,
  onRemoveFilter,
  onRefresh,
  onShowHelp,
  density,
  onDensityChange,
  className,
}: TriageToolbarProps) {
  return (
    <div className={cn('border-b border-border', className)}>
      <div className="flex items-center gap-2 px-3 py-2">
        {/* Search */}
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            ref={searchRef}
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Cari..."
            className="h-8 pl-8 text-sm"
          />
          <kbd className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground bg-muted px-1 rounded">
            /
          </kbd>
        </div>

        {/* Group by */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5">
              <SlidersHorizontal className="h-3.5 w-3.5" />
              Group: {groupByOptions.find((o) => o.value === groupBy)?.label || 'None'}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            {groupByOptions.map((opt) => (
              <DropdownMenuItem key={opt.value} onClick={() => onGroupByChange(opt.value)}>
                {opt.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Density toggle */}
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          onClick={() => onDensityChange(density === 'compact' ? 'comfortable' : 'compact')}
          title={density === 'compact' ? 'Mode nyaman' : 'Mode padat'}
        >
          <AlignJustify className="h-3.5 w-3.5" />
        </Button>

        {/* Refresh */}
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={onRefresh} title="Refresh">
          <RotateCw className="h-3.5 w-3.5" />
        </Button>

        {/* Keyboard help */}
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={onShowHelp} title="Pintasan keyboard">
          <Keyboard className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* Active filter chips */}
      {activeFilters.length > 0 && (
        <div className="flex items-center gap-1 px-3 pb-2 flex-wrap">
          {activeFilters.map((f) => (
            <Badge key={`${f.key}-${f.value}`} variant="secondary" className="text-xs gap-1 cursor-pointer" onClick={() => onRemoveFilter(f.key, f.value)}>
              {f.label}: {f.value}
              <span className="ml-0.5">✕</span>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
