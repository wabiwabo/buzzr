import { useEffect, useRef, useCallback } from 'react';
import { useSocket } from '@/hooks/useSocket';
import { getSocket, connectSocket } from '@/services/socket';
import { useLiveOpsStore, deriveVehicleStatus } from './store';
import {
  fetchFleetPositions,
  fetchTpsMapSummary,
  fetchActiveSchedules,
  fetchDashboardKPIs,
  fetchWasteHeatmap,
} from './api';
import type { GpsUpdatePayload, LiveAlert, VehicleWithStatus, TpsMapItem } from './types';

const POLL_INTERVAL_MS = 30_000;

export function useLiveData() {
  const store = useLiveOpsStore();
  const intervalRef = useRef<ReturnType<typeof setInterval>>();

  // WebSocket: real-time GPS updates
  useSocket('gps:position', (data: GpsUpdatePayload) => {
    store.updateVehicleGps(data);
  });

  // Subscribe to tenant tracking room on mount
  useEffect(() => {
    connectSocket();
    const socket = getSocket();
    const tenantSlug = localStorage.getItem('tenantSlug') || 'dlh-demo';
    const tenantSchema = tenantSlug.replace(/-/g, '_');
    socket.emit('tracking:subscribe', { tenantSchema });
  }, []);

  const loadAllData = useCallback(async () => {
    try {
      const [fleet, tps, schedules, kpis, heatmap] = await Promise.all([
        fetchFleetPositions(),
        fetchTpsMapSummary(),
        fetchActiveSchedules(),
        fetchDashboardKPIs(),
        fetchWasteHeatmap(),
      ]);

      const vehiclesWithStatus: VehicleWithStatus[] = fleet.map((v) => ({
        ...v,
        status: deriveVehicleStatus(v.speed, v.last_update),
      }));

      store.setVehicles(vehiclesWithStatus);
      store.setTpsLocations(tps);
      store.setActiveSchedules(schedules);
      store.setKpis(kpis);
      store.setHeatmapData(heatmap);

      const alerts = generateAlerts(vehiclesWithStatus, tps);
      store.setAlerts(alerts);
    } catch (err) {
      console.error('Failed to load live operations data:', err);
    }
  }, []);

  // Initial load + polling
  useEffect(() => {
    loadAllData();
    intervalRef.current = setInterval(loadAllData, POLL_INTERVAL_MS);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [loadAllData]);

  return { refresh: loadAllData };
}

function generateAlerts(
  vehicles: VehicleWithStatus[],
  tps: TpsMapItem[],
): LiveAlert[] {
  const alerts: LiveAlert[] = [];

  for (const t of tps) {
    if (t.fill_percent >= 90) {
      alerts.push({
        id: `tps-cap-${t.id}`,
        type: 'tps_capacity',
        severity: 'critical',
        title: `${t.name} hampir penuh`,
        message: `Kapasitas ${t.fill_percent}% — perlu pengangkutan segera`,
        sourceId: t.id,
        sourceType: 'tps',
        latitude: t.latitude,
        longitude: t.longitude,
        timestamp: new Date(),
        acknowledged: false,
      });
    }
  }

  for (const v of vehicles) {
    if (v.status === 'offline' && v.driver_id) {
      alerts.push({
        id: `veh-off-${v.id}`,
        type: 'vehicle_offline',
        severity: 'warning',
        title: `${v.plate_number} offline`,
        message: `Tidak ada sinyal GPS dari ${v.driver_name || 'pengemudi'}`,
        sourceId: v.id,
        sourceType: 'vehicle',
        latitude: v.latitude ?? undefined,
        longitude: v.longitude ?? undefined,
        timestamp: new Date(),
        acknowledged: false,
      });
    }
  }

  return alerts;
}
