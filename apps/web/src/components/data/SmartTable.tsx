import React, { useState } from 'react';
import { Search, Filter, Download, RefreshCw, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import type { TableState, FilterDef } from '../../hooks/useTableState';
import { useExport } from '../../hooks/useExport';
import { EmptyState } from '../common/EmptyState';
import { FilterPanel } from './FilterPanel';

interface BulkAction {
  key: string;
  label: string;
  danger?: boolean;
  onClick: (selectedKeys: React.Key[]) => void;
}

interface ExportColumn {
  title: string;
  dataIndex: string;
  render?: (value: any, record: any) => string;
}

interface ColumnDef<T> {
  title: string;
  dataIndex?: string;
  key?: string;
  width?: number;
  sorter?: boolean;
  ellipsis?: boolean;
  render?: (value: any, record: T, index: number) => React.ReactNode;
}

interface SmartTableProps<T> {
  tableState: TableState<T>;
  columns: ColumnDef<T>[];
  rowKey?: string;
  searchPlaceholder?: string;
  filterDefs?: FilterDef[];
  bulkActions?: BulkAction[];
  exportFileName?: string;
  exportColumns?: ExportColumn[];
  expandable?: {
    expandedRowRender: (record: T) => React.ReactNode;
  };
  onRowClick?: (record: T) => void;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyActionLabel?: string;
  onEmptyAction?: () => void;
  onRefresh?: () => void;
  toolbarExtra?: React.ReactNode;
}

export function SmartTable<T extends Record<string, any>>({
  tableState,
  columns,
  rowKey = 'id',
  searchPlaceholder = 'Cari...',
  filterDefs,
  bulkActions,
  exportFileName,
  exportColumns,
  onRowClick,
  emptyTitle = 'Tidak ada data',
  emptyDescription,
  emptyActionLabel,
  onEmptyAction,
  onRefresh,
  toolbarExtra,
}: SmartTableProps<T>) {
  const [filterOpen, setFilterOpen] = useState(false);
  const { exportCSV, exportExcel } = useExport();

  const {
    filteredData, loading, searchText, setSearchText,
    filters, setFilter, resetFilters, activeFilterCount,
    page, pageSize, setPage, setPageSize, total,
    selectedRowKeys, setSelectedRowKeys, clearSelection,
  } = tableState;

  const paginatedData = filteredData.slice((page - 1) * pageSize, page * pageSize);
  const totalPages = Math.ceil(total / pageSize);
  const rangeStart = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const rangeEnd = Math.min(page * pageSize, total);

  const handleExport = (format: 'csv' | 'excel') => {
    if (!exportFileName || !exportColumns) return;
    if (format === 'csv') {
      exportCSV(filteredData, exportColumns, exportFileName);
    } else {
      exportExcel(filteredData, exportColumns, exportFileName);
    }
  };

  const toggleRow = (key: React.Key) => {
    setSelectedRowKeys(
      selectedRowKeys.includes(key)
        ? selectedRowKeys.filter((k) => k !== key)
        : [...selectedRowKeys, key],
    );
  };

  return (
    <div>
      {/* Toolbar */}
      <div className="flex items-center gap-2 mb-3 flex-wrap">
        <div className="relative max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder={searchPlaceholder}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            className="pl-8 h-8 text-sm"
          />
        </div>

        {filterDefs && filterDefs.length > 0 && (
          <Button
            variant={activeFilterCount > 0 ? 'default' : 'outline'}
            size="sm"
            className="gap-1.5"
            onClick={() => setFilterOpen(!filterOpen)}
          >
            <Filter className="h-3.5 w-3.5" />
            Filter {activeFilterCount > 0 && `(${activeFilterCount})`}
          </Button>
        )}

        {exportFileName && exportColumns && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1.5">
                <Download className="h-3.5 w-3.5" />
                Export
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => handleExport('csv')}>Export CSV</DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport('excel')}>Export Excel</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        {onRefresh && (
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={onRefresh} title="Refresh">
            <RefreshCw className="h-3.5 w-3.5" />
          </Button>
        )}

        {toolbarExtra}

        {bulkActions && selectedRowKeys.length > 0 && (
          <div className="ml-auto flex items-center gap-2">
            <span className="text-sm text-muted-foreground">{selectedRowKeys.length} dipilih</span>
            {bulkActions.map((action) => (
              <Button
                key={action.key}
                size="sm"
                variant={action.danger ? 'destructive' : 'outline'}
                onClick={() => action.onClick(selectedRowKeys)}
              >
                {action.label}
              </Button>
            ))}
            <Button size="sm" variant="ghost" onClick={clearSelection}>Batal</Button>
          </div>
        )}
      </div>

      {/* Active filter chips */}
      {activeFilterCount > 0 && (
        <div className="flex items-center gap-1.5 mb-3 flex-wrap">
          <span className="text-xs text-muted-foreground mr-1">Filter aktif:</span>
          {Object.entries(filters).map(([key, value]) => (
            <Badge key={key} variant="secondary" className="gap-1 text-xs">
              {key}: {String(value)}
              <X className="h-3 w-3 cursor-pointer" onClick={() => setFilter(key, undefined)} />
            </Badge>
          ))}
          <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={resetFilters}>
            Reset semua
          </Button>
        </div>
      )}

      {/* Filter panel */}
      {filterOpen && filterDefs && (
        <FilterPanel
          filters={filterDefs}
          values={filters}
          onChange={setFilter}
          onReset={resetFilters}
          onClose={() => setFilterOpen(false)}
        />
      )}

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              {bulkActions && <TableHead className="w-10" />}
              {columns.map((col, i) => (
                <TableHead key={col.key || col.dataIndex || i} style={col.width ? { width: col.width } : undefined}>
                  {col.title}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={`skeleton-${i}`}>
                  {bulkActions && <TableCell><Skeleton className="h-4 w-4" /></TableCell>}
                  {columns.map((col, j) => (
                    <TableCell key={j}><Skeleton className="h-4 w-3/4" /></TableCell>
                  ))}
                </TableRow>
              ))
            ) : paginatedData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length + (bulkActions ? 1 : 0)} className="h-48">
                  <EmptyState
                    type={searchText || activeFilterCount > 0 ? 'no-results' : 'no-data'}
                    title={searchText || activeFilterCount > 0 ? 'Tidak ada data yang cocok' : emptyTitle}
                    description={searchText || activeFilterCount > 0 ? 'Coba ubah kata kunci atau filter' : emptyDescription}
                    actionLabel={searchText || activeFilterCount > 0 ? 'Reset Filter' : emptyActionLabel}
                    onAction={searchText || activeFilterCount > 0 ? resetFilters : onEmptyAction}
                  />
                </TableCell>
              </TableRow>
            ) : (
              paginatedData.map((record, rowIdx) => {
                const key = record[rowKey];
                return (
                  <TableRow
                    key={key}
                    className={onRowClick ? 'cursor-pointer' : undefined}
                    onClick={() => onRowClick?.(record)}
                    data-state={selectedRowKeys.includes(key) ? 'selected' : undefined}
                  >
                    {bulkActions && (
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <Checkbox
                          checked={selectedRowKeys.includes(key)}
                          onCheckedChange={() => toggleRow(key)}
                        />
                      </TableCell>
                    )}
                    {columns.map((col, colIdx) => {
                      const val = col.dataIndex ? record[col.dataIndex] : undefined;
                      return (
                        <TableCell
                          key={col.key || col.dataIndex || colIdx}
                          className={col.ellipsis ? 'max-w-[180px] truncate' : undefined}
                        >
                          {col.render ? col.render(val, record, rowIdx) : (val ?? '-')}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {total > 0 && (
        <div className="flex items-center justify-between mt-3">
          <span className="text-sm text-muted-foreground">
            {rangeStart}-{rangeEnd} dari {total}
          </span>
          <div className="flex items-center gap-2">
            <Select value={String(pageSize)} onValueChange={(v) => { setPageSize(Number(v)); setPage(1); }}>
              <SelectTrigger className="h-8 w-[70px] text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="25">25</SelectItem>
                <SelectItem value="50">50</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline" size="icon" className="h-8 w-8"
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </Button>
            <span className="text-sm tabular-nums">{page} / {totalPages}</span>
            <Button
              variant="outline" size="icon" className="h-8 w-8"
              disabled={page >= totalPages}
              onClick={() => setPage(page + 1)}
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
