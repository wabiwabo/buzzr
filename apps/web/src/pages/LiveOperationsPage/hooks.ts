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
  const intervalRef = useRef<ReturnType<typeof setInterval>>();

  // WebSocket: real-time GPS updates
  useSocket('gps:position', (data: GpsUpdatePayload) => {
    useLiveOpsStore.getState().updateVehicleGps(data);
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
    const results = await Promise.allSettled([
      fetchFleetPositions(),
      fetchTpsMapSummary(),
      fetchActiveSchedules(),
      fetchDashboardKPIs(),
      fetchWasteHeatmap(),
    ]);

    const store = useLiveOpsStore.getState();

    const fleet = results[0].status === 'fulfilled' ? results[0].value : null;
    const tps = results[1].status === 'fulfilled' ? results[1].value : null;
    const schedules = results[2].status === 'fulfilled' ? results[2].value : null;
    const kpis = results[3].status === 'fulfilled' ? results[3].value : null;
    const heatmap = results[4].status === 'fulfilled' ? results[4].value : null;

    if (fleet) {
      const vehiclesWithStatus: VehicleWithStatus[] = fleet.map((v) => ({
        ...v,
        status: deriveVehicleStatus(v.speed, v.last_update),
      }));
      store.setVehicles(vehiclesWithStatus);

      if (tps) {
        const newAlerts = generateAlerts(vehiclesWithStatus, tps);
        mergeAlerts(store, newAlerts);
      }
    }

    if (tps) store.setTpsLocations(tps);
    if (schedules) store.setActiveSchedules(schedules);
    if (kpis) store.setKpis(kpis);
    if (heatmap) store.setHeatmapData(heatmap);

    // Log any failures
    for (const r of results) {
      if (r.status === 'rejected') {
        console.error('Failed to load live operations data:', r.reason);
      }
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

/** Merge new alerts with existing, preserving acknowledgment state */
function mergeAlerts(
  store: ReturnType<typeof useLiveOpsStore.getState>,
  newAlerts: LiveAlert[],
) {
  const existing = store.alerts;
  const acknowledgedIds = new Set(
    existing.filter((a) => a.acknowledged).map((a) => a.id),
  );

  const merged = newAlerts.map((a) =>
    acknowledgedIds.has(a.id) ? { ...a, acknowledged: true } : a,
  );

  store.setAlerts(merged);
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
