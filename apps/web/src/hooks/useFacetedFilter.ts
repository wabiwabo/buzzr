import { useState, useMemo, useCallback, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';

interface FacetDimension {
  key: string;
  label: string;
  getValue: (item: Record<string, unknown>) => string;
}

interface FacetCount {
  value: string;
  count: number;
  checked: boolean;
}

interface UseFacetedFilterOptions<T> {
  items: T[];
  dimensions: FacetDimension[];
  searchFields?: string[];
}

export function useFacetedFilter<T extends Record<string, unknown>>({
  items,
  dimensions,
  searchFields = [],
}: UseFacetedFilterOptions<T>) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState(searchParams.get('q') || '');

  // Parse active filters from URL
  const activeFilterMap = useMemo(() => {
    const map: Record<string, Set<string>> = {};
    dimensions.forEach((dim) => {
      const values = searchParams.get(dim.key);
      if (values) map[dim.key] = new Set(values.split(','));
    });
    return map;
  }, [searchParams, dimensions]);

  // Apply search filter
  const searchFiltered = useMemo(() => {
    if (!search) return items;
    const q = search.toLowerCase();
    return items.filter((item) =>
      searchFields.some((field) => {
        const val = item[field];
        return typeof val === 'string' && val.toLowerCase().includes(q);
      }),
    );
  }, [items, search, searchFields]);

  // Apply facet filters
  const filtered = useMemo(() => {
    return searchFiltered.filter((item) => {
      return dimensions.every((dim) => {
        const active = activeFilterMap[dim.key];
        if (!active || active.size === 0) return true;
        return active.has(dim.getValue(item));
      });
    });
  }, [searchFiltered, dimensions, activeFilterMap]);

  // Compute cross-filtered facet counts
  const facetCounts = useMemo(() => {
    const result: Record<string, FacetCount[]> = {};
    dimensions.forEach((dim) => {
      const counts: Record<string, number> = {};
      // Filter by all OTHER dimensions (not this one) for cross-filtering
      const otherFiltered = searchFiltered.filter((item) =>
        dimensions.every((otherDim) => {
          if (otherDim.key === dim.key) return true;
          const active = activeFilterMap[otherDim.key];
          if (!active || active.size === 0) return true;
          return active.has(otherDim.getValue(item));
        }),
      );
      otherFiltered.forEach((item) => {
        const val = dim.getValue(item);
        counts[val] = (counts[val] || 0) + 1;
      });
      const active = activeFilterMap[dim.key] || new Set();
      result[dim.key] = Object.entries(counts)
        .map(([value, count]) => ({ value, count, checked: active.has(value) }))
        .sort((a, b) => b.count - a.count);
    });
    return result;
  }, [searchFiltered, dimensions, activeFilterMap]);

  // Toggle a facet value
  const toggleFilter = useCallback((dimensionKey: string, value: string) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      const current = next.get(dimensionKey);
      const values = current ? new Set(current.split(',')) : new Set<string>();
      if (values.has(value)) values.delete(value);
      else values.add(value);
      if (values.size === 0) next.delete(dimensionKey);
      else next.set(dimensionKey, Array.from(values).join(','));
      return next;
    });
  }, [setSearchParams]);

  // Remove a specific filter
  const removeFilter = useCallback((dimensionKey: string, value: string) => {
    toggleFilter(dimensionKey, value);
  }, [toggleFilter]);

  // Reset all filters
  const resetFilters = useCallback(() => {
    setSearchParams({});
    setSearch('');
  }, [setSearchParams]);

  // Active filters as flat array (for chips)
  const activeFilters = useMemo(() => {
    const result: Array<{ key: string; label: string; value: string }> = [];
    dimensions.forEach((dim) => {
      const active = activeFilterMap[dim.key];
      if (active) {
        active.forEach((value) => {
          result.push({ key: dim.key, label: dim.label, value });
        });
      }
    });
    return result;
  }, [dimensions, activeFilterMap]);

  // Sync search to URL
  useEffect(() => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (search) next.set('q', search);
      else next.delete('q');
      return next;
    });
  }, [search, setSearchParams]);

  return {
    filtered,
    facetCounts,
    search,
    setSearch,
    toggleFilter,
    removeFilter,
    resetFilters,
    activeFilters,
    totalCount: items.length,
    filteredCount: filtered.length,
  };
}
