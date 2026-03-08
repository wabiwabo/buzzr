import { useState, useEffect, useCallback } from 'react';
import type { VisibilityState } from '@tanstack/react-table';

interface ColumnPriorityConfig {
  id: string;
  priority?: 1 | 2 | 3;
}

interface UseColumnVisibilityOptions {
  columns: ColumnPriorityConfig[];
  storageKey: string;
}

const MOBILE_BREAKPOINT = 768;
const TABLET_BREAKPOINT = 1024;

function getBreakpoint(): 'mobile' | 'tablet' | 'desktop' {
  if (typeof window === 'undefined') return 'desktop';
  if (window.innerWidth < MOBILE_BREAKPOINT) return 'mobile';
  if (window.innerWidth < TABLET_BREAKPOINT) return 'tablet';
  return 'desktop';
}

function getAutoVisibility(
  columns: ColumnPriorityConfig[],
  breakpoint: 'mobile' | 'tablet' | 'desktop',
): VisibilityState {
  const state: VisibilityState = {};
  for (const col of columns) {
    const priority = col.priority ?? 2;
    if (breakpoint === 'mobile' && priority >= 2) state[col.id] = false;
    else if (breakpoint === 'tablet' && priority >= 3) state[col.id] = false;
  }
  return state;
}

export function useColumnVisibility({ columns, storageKey }: UseColumnVisibilityOptions) {
  const [breakpoint, setBreakpoint] = useState(getBreakpoint);
  const [manualOverrides, setManualOverrides] = useState<VisibilityState>(() => {
    try {
      const stored = localStorage.getItem(`col-vis-${storageKey}`);
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  });

  useEffect(() => {
    const handleResize = () => setBreakpoint(getBreakpoint());
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const autoVisibility = getAutoVisibility(columns, breakpoint);

  // Manual overrides take precedence over auto
  const visibility: VisibilityState = { ...autoVisibility, ...manualOverrides };

  const setColumnVisibility = useCallback(
    (state: VisibilityState) => {
      setManualOverrides(state);
      localStorage.setItem(`col-vis-${storageKey}`, JSON.stringify(state));
    },
    [storageKey],
  );

  const hasHiddenColumns = Object.values(visibility).some((v) => v === false);

  return {
    visibility,
    setColumnVisibility,
    hasHiddenColumns,
    breakpoint,
  };
}
