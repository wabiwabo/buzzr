import React, { useState, useRef, useCallback } from 'react';
import { flexRender } from '@tanstack/react-table';
import { useVirtualizer } from '@tanstack/react-virtual';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import { EmptyState } from '@/components/common/EmptyState';
import { DataTableToolbar } from './DataTableToolbar';
import { DataTablePagination } from './DataTablePagination';
import { DataTableFilterPanel } from './DataTableFilterPanel';
import { DataTableSkeleton } from './DataTableSkeleton';
import { DataTablePreview } from './DataTablePreview';
import type { FilterDef, ServerTableMeta } from './types';
import type { Table as TTable } from '@tanstack/react-table';

const ROW_HEIGHT = 48;
const VIRTUALIZE_THRESHOLD = 50;

interface DataTableProps<T> {
  table: TTable<T>;
  meta: ServerTableMeta;
  isLoading: boolean;
  searchText: string;
  onSearchChange: (text: string) => void;
  searchPlaceholder?: string;
  filters: Record<string, string>;
  onFilterChange: (key: string, value: string | undefined) => void;
  onResetFilters: () => void;
  activeFilterCount: number;
  filterDefs?: FilterDef[];
  filterLabels?: Record<string, string>;
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
  onRefresh?: () => void;
  onExportCSV?: () => void;
  onExportExcel?: () => void;
  onRowClick?: (row: T) => void;
  activeIndex?: number;
  setActiveIndex?: (index: number) => void;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyActionLabel?: string;
  onEmptyAction?: () => void;
  toolbarExtra?: React.ReactNode;
  // Preview
  previewOpen?: boolean;
  onPreviewClose?: () => void;
  renderPreview?: () => React.ReactNode;
  previewMode?: 'split' | 'drawer';
}

export function DataTable<T>({
  table,
  meta,
  isLoading,
  searchText,
  onSearchChange,
  searchPlaceholder,
  filters,
  onFilterChange,
  onResetFilters,
  activeFilterCount,
  filterDefs,
  filterLabels,
  onPageChange,
  onLimitChange,
  onRefresh,
  onExportCSV,
  onExportExcel,
  onRowClick,
  activeIndex = -1,
  setActiveIndex,
  emptyTitle = 'Tidak ada data',
  emptyDescription,
  emptyActionLabel,
  onEmptyAction,
  toolbarExtra,
  previewOpen,
  onPreviewClose,
  renderPreview,
  previewMode = 'split',
}: DataTableProps<T>) {
  const [filterPanelOpen, setFilterPanelOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const rows = table.getRowModel().rows;
  const columns = table.getVisibleFlatColumns();
  const useVirtual = rows.length > VIRTUALIZE_THRESHOLD;

  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: 5,
    enabled: useVirtual,
  });

  const handleRowClick = useCallback(
    (row: T, index: number) => {
      setActiveIndex?.(index);
      onRowClick?.(row);
    },
    [setActiveIndex, onRowClick],
  );

  const showPreviewSplit = previewOpen && previewMode === 'split' && renderPreview;

  return (
    <div className="flex">
      {/* Main table area */}
      <div className={cn('flex-1 min-w-0', showPreviewSplit && 'w-[60%]')}>
        <DataTableToolbar
          table={table}
          searchText={searchText}
          onSearchChange={onSearchChange}
          searchPlaceholder={searchPlaceholder}
          activeFilterCount={activeFilterCount}
          onToggleFilterPanel={() => setFilterPanelOpen((o) => !o)}
          filters={filters}
          onRemoveFilter={(key) => onFilterChange(key, undefined)}
          onResetFilters={onResetFilters}
          filterLabels={filterLabels}
          onExportCSV={onExportCSV}
          onExportExcel={onExportExcel}
          onRefresh={onRefresh}
          extra={toolbarExtra}
        />

        {filterPanelOpen && filterDefs && (
          <DataTableFilterPanel
            filterDefs={filterDefs}
            filters={filters}
            onFilterChange={onFilterChange}
            onReset={onResetFilters}
            onClose={() => setFilterPanelOpen(false)}
          />
        )}

        <div className="rounded-md border">
          <div
            ref={scrollRef}
            className={cn(useVirtual && 'max-h-[calc(100vh-280px)] overflow-y-auto')}
          >
            <Table>
              <TableHeader className="sticky top-0 z-10 bg-muted/50">
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    {table.options.enableRowSelection && (
                      <TableHead className="w-10">
                        <Checkbox
                          checked={table.getIsAllPageRowsSelected()}
                          onCheckedChange={(checked) => table.toggleAllPageRowsSelected(!!checked)}
                          aria-label="Select all"
                        />
                      </TableHead>
                    )}
                    {headerGroup.headers.map((header) => (
                      <TableHead key={header.id} style={{ width: header.getSize() !== 150 ? header.getSize() : undefined }}>
                        {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                      </TableHead>
                    ))}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <DataTableSkeleton
                    columnCount={columns.length}
                    rowCount={meta.limit}
                    hasCheckbox={!!table.options.enableRowSelection}
                  />
                ) : rows.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={columns.length + (table.options.enableRowSelection ? 1 : 0)}
                      className="h-48"
                    >
                      <EmptyState
                        type={searchText || activeFilterCount > 0 ? 'no-results' : 'no-data'}
                        title={searchText || activeFilterCount > 0 ? 'Tidak ada data yang cocok' : emptyTitle}
                        description={searchText || activeFilterCount > 0 ? 'Coba ubah kata kunci atau filter' : emptyDescription}
                        actionLabel={searchText || activeFilterCount > 0 ? 'Reset Filter' : emptyActionLabel}
                        onAction={searchText || activeFilterCount > 0 ? onResetFilters : onEmptyAction}
                      />
                    </TableCell>
                  </TableRow>
                ) : useVirtual ? (
                  <>
                    {virtualizer.getVirtualItems().length > 0 && (
                      <TableRow style={{ height: virtualizer.getVirtualItems()[0].start }}>
                        <TableCell colSpan={columns.length + (table.options.enableRowSelection ? 1 : 0)} className="p-0" />
                      </TableRow>
                    )}
                    {virtualizer.getVirtualItems().map((virtualRow) => {
                      const row = rows[virtualRow.index];
                      return (
                        <TableRow
                          key={row.id}
                          data-state={row.getIsSelected() ? 'selected' : undefined}
                          className={cn(
                            onRowClick && 'cursor-pointer',
                            virtualRow.index === activeIndex && 'ring-2 ring-primary/30 ring-inset',
                          )}
                          onClick={() => handleRowClick(row.original, virtualRow.index)}
                        >
                          {table.options.enableRowSelection && (
                            <TableCell className="w-10" onClick={(e) => e.stopPropagation()}>
                              <Checkbox
                                checked={row.getIsSelected()}
                                onCheckedChange={(checked) => row.toggleSelected(!!checked)}
                              />
                            </TableCell>
                          )}
                          {row.getVisibleCells().map((cell) => (
                            <TableCell key={cell.id}>
                              {flexRender(cell.column.columnDef.cell, cell.getContext())}
                            </TableCell>
                          ))}
                        </TableRow>
                      );
                    })}
                    {virtualizer.getVirtualItems().length > 0 && (
                      <TableRow
                        style={{
                          height: virtualizer.getTotalSize() -
                            (virtualizer.getVirtualItems().at(-1)?.end ?? 0),
                        }}
                      >
                        <TableCell colSpan={columns.length + (table.options.enableRowSelection ? 1 : 0)} className="p-0" />
                      </TableRow>
                    )}
                  </>
                ) : (
                  rows.map((row, rowIdx) => (
                    <TableRow
                      key={row.id}
                      data-state={row.getIsSelected() ? 'selected' : undefined}
                      className={cn(
                        onRowClick && 'cursor-pointer',
                        rowIdx === activeIndex && 'ring-2 ring-primary/30 ring-inset',
                      )}
                      onClick={() => handleRowClick(row.original, rowIdx)}
                    >
                      {table.options.enableRowSelection && (
                        <TableCell className="w-10" onClick={(e) => e.stopPropagation()}>
                          <Checkbox
                            checked={row.getIsSelected()}
                            onCheckedChange={(checked) => row.toggleSelected(!!checked)}
                          />
                        </TableCell>
                      )}
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id}>
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        <DataTablePagination
          meta={meta}
          onPageChange={onPageChange}
          onLimitChange={onLimitChange}
        />
      </div>

      {/* Preview panel (split mode) */}
      {showPreviewSplit && onPreviewClose && (
        <DataTablePreview
          open
          onClose={onPreviewClose}
          renderContent={renderPreview}
        />
      )}

      {/* Preview panel (drawer mode) */}
      {previewOpen && previewMode === 'drawer' && renderPreview && onPreviewClose && (
        <DataTablePreview
          open
          onClose={onPreviewClose}
          renderContent={renderPreview}
          defaultMode="drawer"
        />
      )}
    </div>
  );
}
