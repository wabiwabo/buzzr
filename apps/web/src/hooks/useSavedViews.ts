import { useState, useCallback, useEffect } from 'react';

interface SavedView {
  id: string;
  name: string;
  filters: Record<string, string[]>;
  isDefault?: boolean;
}

const STORAGE_KEY = 'buzzr_saved_views';

export function useSavedViews(page: string, defaultViews: SavedView[] = []) {
  const storageKey = `${STORAGE_KEY}_${page}`;

  const [views, setViews] = useState<SavedView[]>(() => {
    const stored = localStorage.getItem(storageKey);
    if (stored) {
      try { return JSON.parse(stored); } catch { /* fall through */ }
    }
    return defaultViews;
  });

  const [activeViewId, setActiveViewId] = useState<string | null>(views[0]?.id || null);

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(views));
  }, [views, storageKey]);

  const addView = useCallback((view: Omit<SavedView, 'id'>) => {
    const newView = { ...view, id: crypto.randomUUID() };
    setViews((prev) => [...prev, newView]);
    return newView.id;
  }, []);

  const removeView = useCallback((id: string) => {
    setViews((prev) => prev.filter((v) => v.id !== id));
    if (activeViewId === id) setActiveViewId(null);
  }, [activeViewId]);

  const selectView = useCallback((id: string) => {
    setActiveViewId(id);
  }, []);

  const activeView = views.find((v) => v.id === activeViewId) || null;

  return { views, activeView, activeViewId, addView, removeView, selectView };
}
