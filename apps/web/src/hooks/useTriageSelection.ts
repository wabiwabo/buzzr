import { useState, useCallback } from 'react';

interface UseTriageSelectionOptions<T> {
  items: T[];
  getId: (item: T) => string;
}

export function useTriageSelection<T>({ items, getId }: UseTriageSelectionOptions<T>) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [checkedIds, setCheckedIds] = useState<Set<string>>(new Set());

  const selectedItem = items.find((item) => getId(item) === selectedId) ?? null;
  const checkedItems = items.filter((item) => checkedIds.has(getId(item)));

  const select = useCallback((id: string | null) => {
    setSelectedId(id);
  }, []);

  const selectNext = useCallback(() => {
    if (items.length === 0) return;
    const idx = items.findIndex((item) => getId(item) === selectedId);
    const nextIdx = idx < items.length - 1 ? idx + 1 : idx;
    setSelectedId(getId(items[nextIdx]));
  }, [items, selectedId, getId]);

  const selectPrev = useCallback(() => {
    if (items.length === 0) return;
    const idx = items.findIndex((item) => getId(item) === selectedId);
    const prevIdx = idx > 0 ? idx - 1 : 0;
    setSelectedId(getId(items[prevIdx]));
  }, [items, selectedId, getId]);

  const toggleCheck = useCallback((id: string) => {
    setCheckedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const checkRange = useCallback((toId: string) => {
    const fromIdx = items.findIndex((item) => getId(item) === selectedId);
    const toIdx = items.findIndex((item) => getId(item) === toId);
    if (fromIdx === -1 || toIdx === -1) return;
    const [start, end] = fromIdx < toIdx ? [fromIdx, toIdx] : [toIdx, fromIdx];
    setCheckedIds((prev) => {
      const next = new Set(prev);
      for (let i = start; i <= end; i++) next.add(getId(items[i]));
      return next;
    });
  }, [items, selectedId, getId]);

  const clearChecked = useCallback(() => {
    setCheckedIds(new Set());
  }, []);

  const checkAll = useCallback(() => {
    setCheckedIds(new Set(items.map(getId)));
  }, [items, getId]);

  return {
    selectedId,
    selectedItem,
    checkedIds,
    checkedItems,
    checkedCount: checkedIds.size,
    select,
    selectNext,
    selectPrev,
    toggleCheck,
    checkRange,
    clearChecked,
    checkAll,
  };
}
