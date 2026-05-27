import { create } from 'zustand';
import type { FleetPosition, FleetTab, FleetAnalytics, VehicleStatus } from './types';
import { deriveVehicleStatus } from './types';

interface FleetPageState {
  positions: FleetPosition[];
  selectedVehicleId: string | null;
  activeTab: FleetTab;
  mapFilterTypes: Set<string>;
  mapFilterStatuses: Set<VehicleStatus>;
  isLoading: boolean;
  dataVersion: number;

  setPositions: (data: FleetPosition[]) => void;
  selectVehicle: (id: string | null) => void;
  setActiveTab: (tab: FleetTab) => void;
  toggleMapFilterType: (type: string) => void;
  toggleMapFilterStatus: (status: VehicleStatus) => void;
  setLoading: (loading: boolean) => void;
  invalidateData: () => void;
}

export const useFleetPageStore = create<FleetPageState>((set) => ({
  positions: [],
  selectedVehicleId: null,
  activeTab: 'kelola',
  mapFilterTypes: new Set<string>(),
  mapFilterStatuses: new Set<VehicleStatus>(),
  isLoading: false,
  dataVersion: 0,

  setPositions: (positions) => set({ positions }),
  selectVehicle: (selectedVehicleId) => set({ selectedVehicleId }),
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

export function computeAnalytics(positions: FleetPosition[]): FleetAnalytics {
  const totalCount = positions.length;
  const activeCount = positions.filter((v) => v.is_active).length;
  const assignedCount = positions.filter((v) => v.driver_id).length;
  const onlineCount = positions.filter((v) => {
    const status = deriveVehicleStatus(v.is_active, v.speed, v.last_update);
    return status === 'online' || status === 'idle';
  }).length;

  const typeMap = new Map<string, number>();
  const statusMap = new Map<string, number>();

  for (const v of positions) {
    typeMap.set(v.type, (typeMap.get(v.type) || 0) + 1);
    const s = deriveVehicleStatus(v.is_active, v.speed, v.last_update);
    statusMap.set(s, (statusMap.get(s) || 0) + 1);
  }

  return {
    totalCount,
    activeCount,
    assignedCount,
    onlineCount,
    byType: Array.from(typeMap, ([type, count]) => ({ type, count })),
    byStatus: Array.from(statusMap, ([status, count]) => ({ status, count })),
  };
}
