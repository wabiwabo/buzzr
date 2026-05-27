import { create } from 'zustand';
import type { Schedule, ScheduleTab, ScheduleAnalytics } from './types';

interface SchedulePageState {
  todaySchedules: Schedule[];
  selectedScheduleId: string | null;
  activeTab: ScheduleTab;
  filterStatuses: Set<string>;
  filterTypes: Set<string>;
  isLoading: boolean;
  dataVersion: number;

  setTodaySchedules: (data: Schedule[]) => void;
  selectSchedule: (id: string | null) => void;
  setActiveTab: (tab: ScheduleTab) => void;
  toggleFilterStatus: (status: string) => void;
  toggleFilterType: (type: string) => void;
  setLoading: (loading: boolean) => void;
  invalidateData: () => void;
}

export const useSchedulePageStore = create<SchedulePageState>((set) => ({
  todaySchedules: [],
  selectedScheduleId: null,
  activeTab: 'kelola',
  filterStatuses: new Set<string>(),
  filterTypes: new Set<string>(),
  isLoading: false,
  dataVersion: 0,

  setTodaySchedules: (todaySchedules) => set({ todaySchedules }),
  selectSchedule: (selectedScheduleId) => set({ selectedScheduleId }),
  setActiveTab: (activeTab) => set({ activeTab }),
  toggleFilterStatus: (status) =>
    set((s) => {
      const next = new Set(s.filterStatuses);
      if (next.has(status)) next.delete(status);
      else next.add(status);
      return { filterStatuses: next };
    }),
  toggleFilterType: (type) =>
    set((s) => {
      const next = new Set(s.filterTypes);
      if (next.has(type)) next.delete(type);
      else next.add(type);
      return { filterTypes: next };
    }),
  setLoading: (isLoading) => set({ isLoading }),
  invalidateData: () => set((s) => ({ dataVersion: s.dataVersion + 1 })),
}));

export function computeAnalytics(today: Schedule[]): ScheduleAnalytics {
  const totalCount = today.length;
  const completedTodayCount = today.filter((s) => s.status === 'completed').length;

  const typeMap = new Map<string, number>();
  const statusMap = new Map<string, number>();
  const routeMap = new Map<string, number>();
  const driverMap = new Map<string, number>();

  for (const s of today) {
    typeMap.set(s.schedule_type, (typeMap.get(s.schedule_type) || 0) + 1);
    statusMap.set(s.status, (statusMap.get(s.status) || 0) + 1);
    routeMap.set(s.route_name, (routeMap.get(s.route_name) || 0) + 1);
    if (s.driver_name) {
      driverMap.set(s.driver_name, (driverMap.get(s.driver_name) || 0) + 1);
    }
  }

  return {
    totalCount,
    todayCount: totalCount,
    completedTodayCount,
    onTimePct: totalCount > 0 ? Math.round((completedTodayCount / totalCount) * 100) : 0,
    byType: Array.from(typeMap, ([type, count]) => ({ type, count })).sort((a, b) => b.count - a.count),
    byStatus: Array.from(statusMap, ([status, count]) => ({ status, count })).sort((a, b) => b.count - a.count),
    topRoutes: Array.from(routeMap, ([route_name, count]) => ({ route_name, count })).sort((a, b) => b.count - a.count).slice(0, 10),
    byDriver: Array.from(driverMap, ([driver_name, count]) => ({ driver_name, count })).sort((a, b) => b.count - a.count).slice(0, 10),
  };
}
