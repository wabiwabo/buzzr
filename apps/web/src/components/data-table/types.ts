import type { ColumnDef, Table } from '@tanstack/react-table';

export type { ColumnDef };

export interface FilterDef {
  key: string;
  label: string;
  type: 'select' | 'multi-select' | 'text' | 'date-range';
  options?: { label: string; value: string }[];
}

export interface ServerTableMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ColumnPriority {
  /** 1 = always visible, 2 = hidden on mobile, 3 = hidden on tablet */
  priority?: 1 | 2 | 3;
}

export interface PreviewMode {
  mode: 'split' | 'drawer';
  setMode: (mode: 'split' | 'drawer') => void;
}
