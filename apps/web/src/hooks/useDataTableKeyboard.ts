import { useEffect, useCallback, useRef } from 'react';
import type { Table } from '@tanstack/react-table';

interface UseDataTableKeyboardOptions<T> {
  table: Table<T>;
  enabled?: boolean;
  activeIndex: number;
  setActiveIndex: (index: number) => void;
  onEnter?: (row: T) => void;
  onEscape?: () => void;
}

export function useDataTableKeyboard<T>({
  table,
  enabled = true,
  activeIndex,
  setActiveIndex,
  onEnter,
  onEscape,
}: UseDataTableKeyboardOptions<T>) {
  const activeIndexRef = useRef(activeIndex);
  activeIndexRef.current = activeIndex;

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!enabled) return;

      // Don't capture when typing in inputs
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT') return;
      if (target.isContentEditable) return;

      const rows = table.getRowModel().rows;
      if (rows.length === 0) return;

      switch (e.key) {
        case 'j':
        case 'ArrowDown': {
          e.preventDefault();
          const next = Math.min(activeIndexRef.current + 1, rows.length - 1);
          setActiveIndex(next);
          break;
        }
        case 'k':
        case 'ArrowUp': {
          e.preventDefault();
          const prev = Math.max(activeIndexRef.current - 1, 0);
          setActiveIndex(prev);
          break;
        }
        case 'Enter': {
          e.preventDefault();
          const row = rows[activeIndexRef.current];
          if (row && onEnter) onEnter(row.original);
          break;
        }
        case 'x': {
          e.preventDefault();
          const row = rows[activeIndexRef.current];
          if (row) row.toggleSelected();
          break;
        }
        case 'Escape': {
          e.preventDefault();
          onEscape?.();
          break;
        }
        case 'a': {
          if (e.metaKey || e.ctrlKey) {
            e.preventDefault();
            if (e.shiftKey) {
              table.toggleAllRowsSelected(false);
            } else {
              table.toggleAllRowsSelected(true);
            }
          }
          break;
        }
      }
    },
    [enabled, table, setActiveIndex, onEnter, onEscape],
  );

  useEffect(() => {
    if (!enabled) return;
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [enabled, handleKeyDown]);
}
