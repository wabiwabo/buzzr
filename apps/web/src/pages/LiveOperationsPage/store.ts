import { create } from 'zustand';
import type {
  VehicleWithStatus,
  VehicleStatus,
  TpsMapItem,
  ActiveSchedule,
  LiveAlert,
  DashboardKPIs,
  MapLayer,
  GpsUpdatePayload,
  HeatmapPoint,
} from './types';

interface LiveOpsState {
  // Data
  vehicles: VehicleWithStatus[];
  tpsLocations: TpsMapItem[];
  activeSchedules: ActiveSchedule[];
  kpis: DashboardKPIs | null;
  alerts: LiveAlert[];
  heatmapData: HeatmapPoint[];

  // UI State
  selectedVehicleId: string | null;
  selectedTpsId: string | null;
  activeLayers: Set<MapLayer>;
  vehicleSearch: string;
  isVehiclePanelOpen: boolean;
  isAlertPanelOpen: boolean;

  // Actions
  setVehicles: (vehicles: VehicleWithStatus[]) => void;
  updateVehicleGps: (payload: GpsUpdatePayload) => void;
  setTpsLocations: (tps: TpsMapItem[]) => void;
  setActiveSchedules: (schedules: ActiveSchedule[]) => void;
  setKpis: (kpis: DashboardKPIs) => void;
  setAlerts: (alerts: LiveAlert[]) => void;
  setHeatmapData: (data: HeatmapPoint[]) => void;
  acknowledgeAlert: (alertId: string) => void;
  selectVehicle: (vehicleId: string | null) => void;
  selectTps: (tpsId: string | null) => void;
  toggleLayer: (layer: MapLayer) => void;
  setVehicleSearch: (search: string) => void;
  toggleVehiclePanel: () => void;
  toggleAlertPanel: () => void;
}

const OFFLINE_THRESHOLD_MS = 5 * 60 * 1000; // 5 minutes

export function deriveVehicleStatus(
  speed: number | null,
  lastUpdate: string | null,
): VehicleStatus {
  if (!lastUpdate) return 'offline';
  const elapsed = Date.now() - new Date(lastUpdate).getTime();
  if (elapsed > OFFLINE_THRESHOLD_MS) return 'offline';
  if (speed != null && speed > 2) return 'moving';
  return 'idle';
}

export const useLiveOpsStore = create<LiveOpsState>((set) => ({
  vehicles: [],
  tpsLocations: [],
  activeSchedules: [],
  kpis: null,
  alerts: [],
  heatmapData: [],

  selectedVehicleId: null,
  selectedTpsId: null,
  activeLayers: new Set<MapLayer>(['vehicles', 'tps', 'routes']),
  vehicleSearch: '',
  isVehiclePanelOpen: true,
  isAlertPanelOpen: true,

  setVehicles: (vehicles) => set({ vehicles }),

  updateVehicleGps: (payload) =>
    set((state) => ({
      vehicles: state.vehicles.map((v) =>
        v.id === payload.vehicleId
          ? {
              ...v,
              latitude: payload.latitude,
              longitude: payload.longitude,
              speed: payload.speed,
              last_update: payload.timestamp,
              status: deriveVehicleStatus(payload.speed, payload.timestamp),
            }
          : v,
      ),
    })),

  setTpsLocations: (tpsLocations) => set({ tpsLocations }),
  setActiveSchedules: (activeSchedules) => set({ activeSchedules }),
  setKpis: (kpis) => set({ kpis }),

  setAlerts: (alerts) => set({ alerts }),
  setHeatmapData: (heatmapData) => set({ heatmapData }),

  acknowledgeAlert: (alertId) =>
    set((state) => ({
      alerts: state.alerts.map((a) =>
        a.id === alertId ? { ...a, acknowledged: true } : a,
      ),
    })),

  selectVehicle: (vehicleId) => set({ selectedVehicleId: vehicleId, selectedTpsId: null }),
  selectTps: (tpsId) => set({ selectedTpsId: tpsId, selectedVehicleId: null }),

  toggleLayer: (layer) =>
    set((state) => {
      const next = new Set(state.activeLayers);
      if (next.has(layer)) next.delete(layer);
      else next.add(layer);
      return { activeLayers: next };
    }),

  setVehicleSearch: (vehicleSearch) => set({ vehicleSearch }),
  toggleVehiclePanel: () => set((s) => ({ isVehiclePanelOpen: !s.isVehiclePanelOpen })),
  toggleAlertPanel: () => set((s) => ({ isAlertPanelOpen: !s.isAlertPanelOpen })),
}));
