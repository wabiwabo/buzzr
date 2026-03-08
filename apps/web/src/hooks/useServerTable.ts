import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  type ColumnDef,
  type SortingState,
  type RowSelectionState,
  type VisibilityState,
  type Table,
} from '@tanstack/react-table';
import { useSearchParams } from 'react-router-dom';
import api from '@/services/api';
import type { ServerTableMeta, FilterDef } from '@/components/data-table/types';

interface UseServerTableOptions<T> {
  endpoint: string;
  columnDefs: ColumnDef<T, any>[];
  defaultSort?: { field: string; order: 'asc' | 'desc' };
  defaultLimit?: number;
  filterDefs?: FilterDef[];
  /** Fields to highlight in UI (not sent to server) */
  searchFields?: string[];
  /** Transform raw API data before passing to table */
  transformData?: (data: any[]) => T[];
}

interface UseServerTableReturn<T> {
  table: Table<T>;
  data: T[];
  isLoading: boolean;
  meta: ServerTableMeta;
  searchText: string;
  setSearchText: (text: string) => void;
  filters: Record<string, string>;
  setFilter: (key: string, value: string | undefined) => void;
  resetFilters: () => void;
  activeFilterCount: number;
  refetch: () => void;
  columnVisibility: VisibilityState;
  setColumnVisibility: (state: VisibilityState) => void;
}

export function useServerTable<T>(options: UseServerTableOptions<T>): UseServerTableReturn<T> {
  const {
    endpoint,
    columnDefs,
    defaultSort = { field: 'created_at', order: 'desc' as const },
    defaultLimit = 25,
    filterDefs = [],
    transformData,
  } = options;

  const [searchParams, setSearchParams] = useSearchParams();
  const [data, setData] = useState<T[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [meta, setMeta] = useState<ServerTableMeta>({ page: 1, limit: defaultLimit, total: 0, totalPages: 0 });
  const [sorting, setSorting] = useState<SortingState>(() => {
    const urlSort = searchParams.get('sort');
    const urlOrder = searchParams.get('order');
    if (urlSort) return [{ id: urlSort, desc: urlOrder === 'desc' }];
    return [{ id: defaultSort.field, desc: defaultSort.order === 'desc' }];
  });
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});

  // Debounced search
  const [searchText, setSearchTextImmediate] = useState(searchParams.get('search') || '');
  const [debouncedSearch, setDebouncedSearch] = useState(searchText);
  const debounceTimer = useRef<ReturnType<typeof setTimeout>>();

  const setSearchText = useCallback((text: string) => {
    setSearchTextImmediate(text);
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => setDebouncedSearch(text), 300);
  }, []);

  // Filters from URL
  const [filters, setFiltersState] = useState<Record<string, string>>(() => {
    const f: Record<string, string> = {};
    searchParams.forEach((val, key) => {
      if (key.startsWith('f_')) f[key.slice(2)] = val;
    });
    return f;
  });

  const setFilter = useCallback((key: string, value: string | undefined) => {
    setFiltersState((prev) => {
      const next = { ...prev };
      if (!value) delete next[key];
      else next[key] = value;
      return next;
    });
  }, []);

  const resetFilters = useCallback(() => {
    setFiltersState({});
    setSearchTextImmediate('');
    setDebouncedSearch('');
  }, []);

  const activeFilterCount = Object.keys(filters).length;

  // Page from URL
  const page = Number(searchParams.get('page')) || 1;
  const limit = Number(searchParams.get('limit')) || defaultLimit;

  // Sync state to URL
  useEffect(() => {
    const params = new URLSearchParams();
    if (page > 1) params.set('page', String(page));
    if (limit !== defaultLimit) params.set('limit', String(limit));
    if (sorting[0]) {
      params.set('sort', sorting[0].id);
      params.set('order', sorting[0].desc ? 'desc' : 'asc');
    }
    if (debouncedSearch) params.set('search', debouncedSearch);
    Object.entries(filters).forEach(([k, v]) => params.set(`f_${k}`, v));
    setSearchParams(params, { replace: true });
  }, [page, limit, sorting, debouncedSearch, filters, defaultLimit, setSearchParams]);

  // Fetch data
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const params: Record<string, any> = { page, limit };
      if (sorting[0]) {
        params.sort = sorting[0].id;
        params.order = sorting[0].desc ? 'desc' : 'asc';
      }
      if (debouncedSearch) params.search = debouncedSearch;
      if (Object.keys(filters).length > 0) params.filters = JSON.stringify(filters);

      const { data: response } = await api.get(`${endpoint}/paginated`, { params });
      const items = transformData ? transformData(response.data) : response.data;
      setData(items);
      setMeta(response.meta);
    } catch {
      setData([]);
      setMeta({ page: 1, limit, total: 0, totalPages: 0 });
    } finally {
      setIsLoading(false);
    }
  }, [endpoint, page, limit, sorting, debouncedSearch, filters, transformData]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Reset page to 1 when search/filter/sort changes
  useEffect(() => {
    if (page > 1) {
      setSearchParams((prev) => {
        prev.delete('page');
        return prev;
      }, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch, filters, sorting]);

  const setPage = useCallback((newPage: number) => {
    setSearchParams((prev) => {
      if (newPage <= 1) prev.delete('page');
      else prev.set('page', String(newPage));
      return prev;
    }, { replace: true });
  }, [setSearchParams]);

  const setLimit = useCallback((newLimit: number) => {
    setSearchParams((prev) => {
      prev.set('limit', String(newLimit));
      prev.delete('page');
      return prev;
    }, { replace: true });
  }, [setSearchParams]);

  // Memoize columns
  const columns = useMemo(() => columnDefs, [columnDefs]);

  const table = useReactTable({
    data,
    columns,
    state: { sorting, rowSelection, columnVisibility },
    onSortingChange: setSorting,
    onRowSelectionChange: setRowSelection,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    manualPagination: true,
    manualSorting: true,
    pageCount: meta.totalPages,
    enableRowSelection: true,
    getRowId: (row: any) => row.id,
  });

  // Attach page/limit setters to table for pagination component
  (table as any)._setPage = setPage;
  (table as any)._setLimit = setLimit;
  (table as any)._meta = meta;

  return {
    table,
    data,
    isLoading,
    meta,
    searchText,
    setSearchText,
    filters,
    setFilter,
    resetFilters,
    activeFilterCount,
    refetch: fetchData,
    columnVisibility,
    setColumnVisibility,
  };
}
