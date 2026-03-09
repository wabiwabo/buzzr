import api from '@/services/api';
import type { VehiclePosition, TpsMapItem, ActiveSchedule, DashboardKPIs } from './types';

export async function fetchFleetPositions(): Promise<VehiclePosition[]> {
  const { data } = await api.get<VehiclePosition[]>('/fleet/positions');
  return data;
}

export async function fetchTpsMapSummary(): Promise<TpsMapItem[]> {
  const { data } = await api.get<TpsMapItem[]>('/tps/map-summary');
  return data;
}

export async function fetchActiveSchedules(): Promise<ActiveSchedule[]> {
  const { data } = await api.get<ActiveSchedule[]>('/schedules/active');
  return data;
}

export async function fetchDashboardKPIs(): Promise<DashboardKPIs> {
  const { data } = await api.get<DashboardKPIs>('/reports/dashboard');
  return data;
}

export async function fetchWasteHeatmap(): Promise<{ latitude: number; longitude: number; total_kg: number }[]> {
  const { data } = await api.get('/reports/heatmap');
  return data;
}

export async function fetchPendingComplaints(): Promise<any[]> {
  const { data } = await api.get('/complaints', { params: { status: 'submitted' } });
  return Array.isArray(data) ? data : data.data || [];
}

export async function reassignSchedule(scheduleId: string, body: { driverId: string; vehicleId: string }) {
  const { data } = await api.patch(`/schedules/${scheduleId}/reassign`, body);
  return data;
}

export async function sendDriverMessage(body: { driverId: string; title: string; body: string }) {
  const { data } = await api.post('/notifications/push', body);
  return data;
}
