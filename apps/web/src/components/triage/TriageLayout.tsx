import { useState } from 'react';
import { cn } from '@/lib/utils';
import { TriageList } from './TriageList';
import { TriagePreview, type TriagePreviewData } from './TriagePreview';
import type { TriageRowData } from './TriageListRow';

interface TriageLayoutProps {
  // List data
  items: TriageRowData[];
  loading?: boolean;
  selectedId: string | null;
  checkedIds: Set<string>;
  onSelect: (id: string) => void;
  onCheck: (id: string) => void;
  onShiftClick: (id: string) => void;
  onClearChecked: () => void;

  // Search & filter
  search: string;
  onSearchChange: (value: string) => void;
  searchRef?: React.Ref<HTMLInputElement>;
  groupBy: string;
  onGroupByChange: (value: string) => void;
  groupByOptions: Array<{ value: string; label: string }>;
  groupConfig?: Record<string, { key: string; getGroup: (item: TriageRowData) => string }>;
  activeFilters: Array<{ key: string; label: string; value: string }>;
  onRemoveFilter: (key: string, value: string) => void;
  onRefresh: () => void;
  onShowHelp: () => void;

  // Bulk
  onBulkAssign: () => void;
  onBulkStatus: () => void;

  // Preview
  previewData: TriagePreviewData | null;
  onStatusTransition: (id: string, newStatus: string) => void;
  onAssign: (id: string) => void;

  // Filter sidebar (slot)
  filterSidebar?: React.ReactNode;

  className?: string;
}

export function TriageLayout({
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
  previewData,
  onStatusTransition,
  onAssign,
  filterSidebar,
  className,
}: TriageLayoutProps) {
  const [previewOpen, setPreviewOpen] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className={cn('flex h-[calc(100vh-var(--header-height)-48px)] overflow-hidden rounded-lg border border-border bg-surface', className)}>
      {/* Filter sidebar */}
      {filterSidebar && sidebarOpen && (
        <div className="w-[var(--filter-sidebar-width)] shrink-0 border-r border-border overflow-y-auto">
          {filterSidebar}
        </div>
      )}

      {/* Request list */}
      <TriageList
        items={items}
        loading={loading}
        selectedId={selectedId}
        checkedIds={checkedIds}
        onSelect={onSelect}
        onCheck={onCheck}
        onShiftClick={onShiftClick}
        onClearChecked={onClearChecked}
        search={search}
        onSearchChange={onSearchChange}
        searchRef={searchRef}
        groupBy={groupBy}
        onGroupByChange={onGroupByChange}
        groupByOptions={groupByOptions}
        groupConfig={groupConfig}
        activeFilters={activeFilters}
        onRemoveFilter={onRemoveFilter}
        onRefresh={onRefresh}
        onShowHelp={onShowHelp}
        onBulkAssign={onBulkAssign}
        onBulkStatus={onBulkStatus}
        className="flex-1 min-w-0"
      />

      {/* Preview panel */}
      {previewOpen && (
        <TriagePreview
          data={previewData}
          onStatusTransition={onStatusTransition}
          onAssign={onAssign}
          className="w-[var(--preview-panel-width)] shrink-0"
        />
      )}
    </div>
  );
}

// Re-export toggle helpers for keyboard hook
export type { TriageLayoutProps };
