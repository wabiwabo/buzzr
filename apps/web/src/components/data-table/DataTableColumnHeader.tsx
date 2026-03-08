import React from 'react';
import { ArrowUp, ArrowDown, ArrowUpDown, Filter } from 'lucide-react';
import { type Column } from '@tanstack/react-table';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

interface DataTableColumnHeaderProps<TData, TValue> {
  column: Column<TData, TValue>;
  title: string;
  filterType?: 'text' | 'select';
  filterOptions?: { label: string; value: string }[];
  filterValue?: string;
  onFilterChange?: (value: string | undefined) => void;
}

export function DataTableColumnHeader<TData, TValue>({
  column,
  title,
  filterType,
  filterOptions,
  filterValue,
  onFilterChange,
}: DataTableColumnHeaderProps<TData, TValue>) {
  const sorted = column.getIsSorted();
  const canSort = column.getCanSort();

  return (
    <div className="flex items-center gap-1">
      {canSort ? (
        <Button
          variant="ghost"
          size="sm"
          className="-ml-2 h-8 text-xs font-medium"
          onClick={() => column.toggleSorting(sorted === 'asc')}
        >
          {title}
          {sorted === 'asc' ? (
            <ArrowUp className="ml-1 h-3.5 w-3.5" />
          ) : sorted === 'desc' ? (
            <ArrowDown className="ml-1 h-3.5 w-3.5" />
          ) : (
            <ArrowUpDown className="ml-1 h-3.5 w-3.5 text-muted-foreground/50" />
          )}
        </Button>
      ) : (
        <span className="text-xs font-medium">{title}</span>
      )}

      {filterType && onFilterChange && (
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className={cn('h-6 w-6', filterValue && 'text-primary')}
            >
              <Filter className="h-3 w-3" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-48 p-2" align="start">
            {filterType === 'text' ? (
              <Input
                placeholder={`Filter ${title}...`}
                value={filterValue || ''}
                onChange={(e) => onFilterChange(e.target.value || undefined)}
                className="h-8 text-sm"
              />
            ) : filterType === 'select' && filterOptions ? (
              <Select value={filterValue || ''} onValueChange={(v) => onFilterChange(v || undefined)}>
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue placeholder={`Semua ${title}`} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Semua</SelectItem>
                  {filterOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : null}
          </PopoverContent>
        </Popover>
      )}
    </div>
  );
}
