import { create } from 'zustand';
import type { MapComplaint, ComplaintTab, ComplaintAnalytics } from './types';

interface ComplaintPageState {
  mapComplaints: MapComplaint[];
  activeTab: ComplaintTab;
  filterStatuses: Set<string>;
  filterCategories: Set<string>;
  isLoading: boolean;
  dataVersion: number;

  setMapComplaints: (data: MapComplaint[]) => void;
  setActiveTab: (tab: ComplaintTab) => void;
  toggleFilterStatus: (status: string) => void;
  toggleFilterCategory: (category: string) => void;
  setLoading: (loading: boolean) => void;
  invalidateData: () => void;
}

export const useComplaintPageStore = create<ComplaintPageState>((set) => ({
  mapComplaints: [],
  activeTab: 'triage',
  filterStatuses: new Set<string>(),
  filterCategories: new Set<string>(),
  isLoading: false,
  dataVersion: 0,

  setMapComplaints: (mapComplaints) => set({ mapComplaints }),
  setActiveTab: (activeTab) => set({ activeTab }),
  toggleFilterStatus: (status) =>
    set((s) => {
      const next = new Set(s.filterStatuses);
      if (next.has(status)) next.delete(status);
      else next.add(status);
      return { filterStatuses: next };
    }),
  toggleFilterCategory: (category) =>
    set((s) => {
      const next = new Set(s.filterCategories);
      if (next.has(category)) next.delete(category);
      else next.add(category);
      return { filterCategories: next };
    }),
  setLoading: (isLoading) => set({ isLoading }),
  invalidateData: () => set((s) => ({ dataVersion: s.dataVersion + 1 })),
}));

const SLA_HOURS = 72;

export function computeAnalytics(complaints: MapComplaint[]): ComplaintAnalytics {
  const totalCount = complaints.length;
  const now = Date.now();
  const slaMs = SLA_HOURS * 60 * 60 * 1000;

  const slaBreach = complaints.filter(
    (c) => c.status !== 'resolved' && c.status !== 'rejected' && now - new Date(c.created_at).getTime() > slaMs,
  ).length;

  const resolved = complaints.filter((c) => c.status === 'resolved');
  const resolvedPct = totalCount > 0 ? Math.round((resolved.length / totalCount) * 100) : 0;

  const categoryMap = new Map<string, number>();
  const statusMap = new Map<string, number>();

  for (const c of complaints) {
    categoryMap.set(c.category, (categoryMap.get(c.category) || 0) + 1);
    statusMap.set(c.status, (statusMap.get(c.status) || 0) + 1);
  }

  const byCategory = Array.from(categoryMap, ([category, count]) => ({ category, count }))
    .sort((a, b) => b.count - a.count);
  const byStatus = Array.from(statusMap, ([status, count]) => ({ status, count }))
    .sort((a, b) => b.count - a.count);

  return {
    totalCount,
    slaBreach,
    avgResolutionHours: 0,
    resolvedPct,
    byCategory,
    byStatus,
    topAreas: [],
  };
}
