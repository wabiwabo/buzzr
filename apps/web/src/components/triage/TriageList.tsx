import { useMemo, useState } from 'react';
import { ChevronDown, ChevronRight, Inbox, SearchX } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { TriageListRow, type TriageRowData } from './TriageListRow';
import { TriageToolbar } from './TriageToolbar';
import { TriageBulkBar } from './TriageBulkBar';

interface GroupConfig {
  key: string;
  getGroup: (item: TriageRowData) => string;
}

interface TriageListProps {
  items: TriageRowData[];
  loading?: boolean;
  selectedId: string | null;
  checkedIds: Set<string>;
  onSelect: (id: string) => void;
  onCheck: (id: string) => void;
  onShiftClick: (id: string) => void;
  onClearChecked: () => void;
  search: string;
  onSearchChange: (value: string) => void;
  searchRef?: React.Ref<HTMLInputElement>;
  groupBy: string;
  onGroupByChange: (value: string) => void;
  groupByOptions: Array<{ value: string; label: string }>;
  groupConfig?: Record<string, GroupConfig>;
  activeFilters: Array<{ key: string; label: string; value: string }>;
  onRemoveFilter: (key: string, value: string) => void;
  onRefresh: () => void;
  onShowHelp: () => void;
  onBulkAssign: () => void;
  onBulkStatus: () => void;
  emptyMessage?: string;
  className?: string;
}

export function TriageList({
  items,
  loading,
  selectedId,
  checkedIds,
  onSelect,
  onCheck,
  onShiftClick,
  onClearChecked,
  search,
  onSearchChange,
  searchRef,
  groupBy,
  onGroupByChange,
  groupByOptions,
  groupConfig,
  activeFilters,
  onRemoveFilter,
  onRefresh,
  onShowHelp,
  onBulkAssign,
  onBulkStatus,
  emptyMessage = 'Tidak ada item',
  className,
}: TriageListProps) {
  const [density, setDensity] = useState<'compact' | 'comfortable'>('compact');
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());
  const showCheckbox = checkedIds.size > 0;

  const grouped = useMemo(() => {
    if (groupBy === 'none' || !groupConfig?.[groupBy]) {
      return [{ key: '__all__', label: '', items }];
    }
    const config = groupConfig[groupBy];
    const groups: Record<string, TriageRowData[]> = {};
    items.forEach((item) => {
      const group = config.getGroup(item);
      if (!groups[group]) groups[group] = [];
      groups[group].push(item);
    });
    return Object.entries(groups).map(([label, groupItems]) => ({
      key: label,
      label,
      items: groupItems,
    }));
  }, [items, groupBy, groupConfig]);

  const toggleGroup = (key: string) => {
    setCollapsedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const isFiltered = search.length > 0 || activeFilters.length > 0;

  return (
    <div className={cn('flex flex-col h-full', className)}>
      {checkedIds.size > 0 ? (
        <TriageBulkBar
          count={checkedIds.size}
          onAssign={onBulkAssign}
          onStatusChange={onBulkStatus}
          onClear={onClearChecked}
        />
      ) : (
        <TriageToolbar
          search={search}
          onSearchChange={onSearchChange}
          searchRef={searchRef}
          groupBy={groupBy}
          onGroupByChange={onGroupByChange}
          groupByOptions={groupByOptions}
          activeFilters={activeFilters}
          onRemoveFilter={onRemoveFilter}
          onRefresh={onRefresh}
          onShowHelp={onShowHelp}
          density={density}
          onDensityChange={setDensity}
        />
      )}

      <ScrollArea className="flex-1">
        {loading ? (
          <div className="p-3 space-y-2">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            {isFiltered ? (
              <>
                <SearchX className="h-8 w-8 mb-2" />
                <p className="text-sm">Tidak ada hasil untuk filter ini</p>
              </>
            ) : (
              <>
                <Inbox className="h-8 w-8 mb-2" />
                <p className="text-sm">{emptyMessage}</p>
              </>
            )}
          </div>
        ) : (
          grouped.map((group) => (
            <div key={group.key}>
              {group.label && (
                <button
                  type="button"
                  className="flex items-center gap-1.5 w-full px-3 py-1.5 text-xs font-medium text-muted-foreground bg-muted/50 hover:bg-muted cursor-pointer"
                  onClick={() => toggleGroup(group.key)}
                >
                  {collapsedGroups.has(group.key)
                    ? <ChevronRight className="h-3 w-3" />
                    : <ChevronDown className="h-3 w-3" />
                  }
                  {group.label}
                  <span className="text-muted-foreground/60 ml-1">({group.items.length})</span>
                </button>
              )}
              {!collapsedGroups.has(group.key) &&
                group.items.map((item) => (
                  <TriageListRow
                    key={item.id}
                    data={item}
                    isSelected={item.id === selectedId}
                    isChecked={checkedIds.has(item.id)}
                    onSelect={onSelect}
                    onCheck={onCheck}
                    onShiftClick={onShiftClick}
                    showCheckbox={showCheckbox}
                  />
                ))
              }
            </div>
          ))
        )}
      </ScrollArea>
    </div>
  );
}
