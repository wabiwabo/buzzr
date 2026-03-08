import { useState, useMemo, useCallback } from 'react';

export interface FilterDef {
  key: string;
  label: string;
  type: 'select' | 'date-range' | 'number-range';
  options?: { label: string; value: string }[];
}

export interface TableState<T> {
  data: T[];
  filteredData: T[];
  loading: boolean;
  searchText: string;
  setSearchText: (text: string) => void;
  filters: Record<string, any>;
  setFilter: (key: string, value: any) => void;
  resetFilters: () => void;
  activeFilterCount: number;
  sortField: string | null;
  sortOrder: 'ascend' | 'descend' | null;
  setSort: (field: string | null, order: 'ascend' | 'descend' | null) => void;
  page: number;
  pageSize: number;
  setPage: (page: number) => void;
  setPageSize: (size: number) => void;
  total: number;
  selectedRowKeys: React.Key[];
  setSelectedRowKeys: (keys: React.Key[]) => void;
  clearSelection: () => void;
  setData: (data: T[]) => void;
  setLoading: (loading: boolean) => void;
}

interface UseTableStateOptions<T> {
  searchFields?: (keyof T)[];
  defaultPageSize?: number;
  defaultSortField?: string;
  defaultSortOrder?: 'ascend' | 'descend';
}

export function useTableState<T extends Record<string, any>>(
  options: UseTableStateOptions<T> = {},
): TableState<T> {
  const {
    searchFields = [],
    defaultPageSize = 10,
    defaultSortField = null,
    defaultSortOrder = null,
  } = options;

  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [filters, setFilters] = useState<Record<string, any>>({});
  const [sortField, setSortField] = useState<string | null>(defaultSortField);
  const [sortOrder, setSortOrder] = useState<'ascend' | 'descend' | null>(defaultSortOrder);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(defaultPageSize);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);

  const setFilter = useCallback((key: string, value: any) => {
    setFilters((prev) => {
      if (value === undefined || value === null || value === '') {
        const next = { ...prev };
        delete next[key];
        return next;
      }
      return { ...prev, [key]: value };
    });
    setPage(1);
  }, []);

  const resetFilters = useCallback(() => {
    setFilters({});
    setSearchText('');
    setPage(1);
  }, []);

  const setSort = useCallback((field: string | null, order: 'ascend' | 'descend' | null) => {
    setSortField(field);
    setSortOrder(order);
  }, []);

  const clearSelection = useCallback(() => setSelectedRowKeys([]), []);

  const activeFilterCount = Object.keys(filters).length;

  const filteredData = useMemo(() => {
    let result = [...data];

    // Search
    if (searchText && searchFields.length > 0) {
      const lower = searchText.toLowerCase();
      result = result.filter((item) =>
        searchFields.some((field) => {
          const val = item[field];
          return val && String(val).toLowerCase().includes(lower);
        }),
      );
    }

    // Filters
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        result = result.filter((item) => {
          const itemVal = item[key];
          if (Array.isArray(value)) {
            return value.includes(itemVal);
          }
          return String(itemVal) === String(value);
        });
      }
    });

    // Sort
    if (sortField && sortOrder) {
      result.sort((a, b) => {
        const aVal = a[sortField];
        const bVal = b[sortField];
        if (aVal == null) return 1;
        if (bVal == null) return -1;
        const cmp = typeof aVal === 'number'
          ? aVal - (bVal as number)
          : String(aVal).localeCompare(String(bVal));
        return sortOrder === 'ascend' ? cmp : -cmp;
      });
    }

    return result;
  }, [data, searchText, searchFields, filters, sortField, sortOrder]);

  return {
    data,
    filteredData,
    loading,
    searchText,
    setSearchText,
    filters,
    setFilter,
    resetFilters,
    activeFilterCount,
    sortField,
    sortOrder,
    setSort,
    page,
    pageSize,
    setPage,
    setPageSize,
    total: filteredData.length,
    selectedRowKeys,
    setSelectedRowKeys,
    clearSelection,
    setData,
    setLoading,
  };
}
