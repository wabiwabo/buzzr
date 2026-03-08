import React from 'react';
import {
  Search, Filter, Download, RefreshCw, X, Columns3,
} from 'lucide-react';
import type { Table } from '@tanstack/react-table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuCheckboxItem,
  DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface DataTableToolbarProps<T> {
  table: Table<T>;
  searchText: string;
  onSearchChange: (text: string) => void;
  searchPlaceholder?: string;
  activeFilterCount: number;
  onToggleFilterPanel: () => void;
  filters: Record<string, string>;
  onRemoveFilter: (key: string) => void;
  onResetFilters: () => void;
  filterLabels?: Record<string, string>;
  onExportCSV?: () => void;
  onExportExcel?: () => void;
  onRefresh?: () => void;
  extra?: React.ReactNode;
}

export function DataTableToolbar<T>({
  table,
  searchText,
  onSearchChange,
  searchPlaceholder = 'Cari...',
  activeFilterCount,
  onToggleFilterPanel,
  filters,
  onRemoveFilter,
  onResetFilters,
  filterLabels,
  onExportCSV,
  onExportExcel,
  onRefresh,
  extra,
}: DataTableToolbarProps<T>) {
  const selectedCount = table.getSelectedRowModel().rows.length;

  return (
    <div className="sticky top-0 z-20 bg-background pb-3 space-y-2">
      {/* Main toolbar row */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* Search */}
        <div className="relative max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder={searchPlaceholder}
            value={searchText}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-8 h-8 text-sm pr-8"
          />
          {searchText && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Filter toggle */}
        <Button
          variant={activeFilterCount > 0 ? 'default' : 'outline'}
          size="sm"
          className="gap-1.5"
          onClick={onToggleFilterPanel}
        >
          <Filter className="h-3.5 w-3.5" />
          Filter
          {activeFilterCount > 0 && (
            <Badge variant="secondary" className="ml-1 h-5 min-w-[20px] px-1 text-[10px]">
              {activeFilterCount}
            </Badge>
          )}
        </Button>

        {/* Column visibility */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-1.5">
              <Columns3 className="h-3.5 w-3.5" />
              Kolom
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            {table.getAllColumns()
              .filter((col) => col.getCanHide())
              .map((col) => (
                <DropdownMenuCheckboxItem
                  key={col.id}
                  checked={col.getIsVisible()}
                  onCheckedChange={(checked) => col.toggleVisibility(!!checked)}
                  className="text-sm"
                >
                  {(col.columnDef.meta as any)?.title || col.id}
                </DropdownMenuCheckboxItem>
              ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Export */}
        {(onExportCSV || onExportExcel) && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1.5">
                <Download className="h-3.5 w-3.5" />
                Export
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              {onExportCSV && <DropdownMenuItem onClick={onExportCSV}>Export CSV</DropdownMenuItem>}
              {onExportExcel && <DropdownMenuItem onClick={onExportExcel}>Export Excel</DropdownMenuItem>}
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        {/* Refresh */}
        {onRefresh && (
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={onRefresh} title="Refresh">
            <RefreshCw className="h-3.5 w-3.5" />
          </Button>
        )}

        {extra}

        {/* Bulk selection info */}
        {selectedCount > 0 && (
          <div className="ml-auto flex items-center gap-2">
            <span className="text-sm text-muted-foreground">{selectedCount} dipilih</span>
            <Button size="sm" variant="ghost" onClick={() => table.toggleAllRowsSelected(false)}>
              Batal
            </Button>
          </div>
        )}
      </div>

      {/* Active filter chips */}
      {activeFilterCount > 0 && (
        <div className="flex items-center gap-1.5 flex-wrap sticky top-11 z-10">
          <span className="text-xs text-muted-foreground mr-1">Filter aktif:</span>
          {Object.entries(filters).map(([key, value]) => (
            <Badge key={key} variant="secondary" className="gap-1 text-xs">
              {filterLabels?.[key] || key}: {value}
              <X className="h-3 w-3 cursor-pointer" onClick={() => onRemoveFilter(key)} />
            </Badge>
          ))}
          <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={onResetFilters}>
            Reset semua
          </Button>
        </div>
      )}
    </div>
  );
}
