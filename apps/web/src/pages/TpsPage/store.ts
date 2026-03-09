// apps/web/src/pages/TpsPage/store.ts

import { create } from 'zustand';
import type { TpsItem, TpsTab, TpsAnalytics } from './types';

interface TpsPageState {
  allTps: TpsItem[];
  selectedTpsId: string | null;
  activeTab: TpsTab;
  mapFilterTypes: Set<string>;
  mapFilterStatuses: Set<string>;
  isLoading: boolean;
  dataVersion: number;

  setAllTps: (tps: TpsItem[]) => void;
  selectTps: (id: string | null) => void;
  setActiveTab: (tab: TpsTab) => void;
  toggleMapFilterType: (type: string) => void;
  toggleMapFilterStatus: (status: string) => void;
  setLoading: (loading: boolean) => void;
  invalidateData: () => void;
}

export const useTpsPageStore = create<TpsPageState>((set) => ({
  allTps: [],
  selectedTpsId: null,
  activeTab: 'peta',
  mapFilterTypes: new Set<string>(),
  mapFilterStatuses: new Set<string>(),
  isLoading: false,
  dataVersion: 0,

  setAllTps: (allTps) => set({ allTps }),
  selectTps: (selectedTpsId) => set({ selectedTpsId }),
  setActiveTab: (activeTab) => set({ activeTab }),
  toggleMapFilterType: (type) =>
    set((s) => {
      const next = new Set(s.mapFilterTypes);
      if (next.has(type)) next.delete(type);
      else next.add(type);
      return { mapFilterTypes: next };
    }),
  toggleMapFilterStatus: (status) =>
    set((s) => {
      const next = new Set(s.mapFilterStatuses);
      if (next.has(status)) next.delete(status);
      else next.add(status);
      return { mapFilterStatuses: next };
    }),
  setLoading: (isLoading) => set({ isLoading }),
  invalidateData: () => set((s) => ({ dataVersion: s.dataVersion + 1 })),
}));

export function computeAnalytics(tps: TpsItem[]): TpsAnalytics {
  const totalCount = tps.length;
  const activeCount = tps.filter((t) => t.status === 'active').length;
  const nearCapacityCount = tps.filter((t) => t.fill_percent >= 80).length;
  const averageFillPercent =
    totalCount > 0
      ? Math.round(tps.reduce((sum, t) => sum + t.fill_percent, 0) / totalCount)
      : 0;

  const typeMap = new Map<string, number>();
  const statusMap = new Map<string, number>();
  for (const t of tps) {
    typeMap.set(t.type, (typeMap.get(t.type) || 0) + 1);
    statusMap.set(t.status, (statusMap.get(t.status) || 0) + 1);
  }

  const byType = Array.from(typeMap, ([type, count]) => ({ type, count }));
  const byStatus = Array.from(statusMap, ([status, count]) => ({ status, count }));

  const brackets = [
    { label: '0–25%', min: 0, max: 25, color: '#22C55E' },
    { label: '25–50%', min: 25, max: 50, color: '#84CC16' },
    { label: '50–75%', min: 50, max: 75, color: '#EAB308' },
    { label: '75–90%', min: 75, max: 90, color: '#F59E0B' },
    { label: '90–100%', min: 90, max: 101, color: '#EF4444' },
  ];
  const fillDistribution = brackets.map((b) => ({
    bracket: b.label,
    count: tps.filter((t) => t.fill_percent >= b.min && t.fill_percent < b.max).length,
    color: b.color,
  }));

  const topFilled = [...tps]
    .sort((a, b) => b.fill_percent - a.fill_percent)
    .slice(0, 10);

  return {
    totalCount,
    activeCount,
    nearCapacityCount,
    averageFillPercent,
    byType,
    byStatus,
    fillDistribution,
    topFilled,
  };
}
