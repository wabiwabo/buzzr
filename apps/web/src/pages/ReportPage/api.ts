import api from '@/services/api';
import type {
  WasteRow, DriverPerf, ComplaintStats, ComplaintTimeseriesRow,
  PaymentTimeseriesRow, HeatmapPoint, ActivityEvent,
} from './types';

export async function fetchWasteVolume(from: string, to: string): Promise<WasteRow[]> {
  const { data } = await api.get<WasteRow[]>('/reports/waste-volume', { params: { from, to } });
  return data.map((r) => ({ ...r, total_kg: Number(r.total_kg), total_records: Number(r.total_records) }));
}

export async function fetchDriverPerformance(from: string, to: string): Promise<DriverPerf[]> {
  const { data } = await api.get<DriverPerf[]>('/reports/driver-performance', { params: { from, to } });
  return data.map((r) => ({
    ...r,
    total_trips: Number(r.total_trips),
    total_checkpoints: Number(r.total_checkpoints),
    total_volume_kg: Number(r.total_volume_kg) || 0,
  }));
}

export async function fetchComplaintStats(from: string, to: string): Promise<ComplaintStats> {
  const { data } = await api.get<ComplaintStats>('/reports/complaints', { params: { from, to } });
  return {
    ...data,
    total: Number(data.total) || 0,
    resolved: Number(data.resolved) || 0,
    rejected: Number(data.rejected) || 0,
    avg_resolution_hours: data.avg_resolution_hours != null ? Number(data.avg_resolution_hours) : null,
  };
}

export async function fetchComplaintTimeseries(from: string, to: string): Promise<ComplaintTimeseriesRow[]> {
  const { data } = await api.get<ComplaintTimeseriesRow[]>('/reports/complaints/timeseries', { params: { from, to } });
  return data.map((r) => ({
    ...r,
    total: Number(r.total),
    resolved: Number(r.resolved),
    avg_resolution_hours: r.avg_resolution_hours != null ? Number(r.avg_resolution_hours) : null,
    sla_compliance_pct: Number(r.sla_compliance_pct),
  }));
}

export async function fetchPaymentTimeseries(from: string, to: string): Promise<PaymentTimeseriesRow[]> {
  const { data } = await api.get<PaymentTimeseriesRow[]>('/reports/payments/timeseries', { params: { from, to } });
  return data.map((r) => ({
    ...r,
    total_invoices: Number(r.total_invoices),
    paid_invoices: Number(r.paid_invoices),
    revenue: Number(r.revenue),
    collection_rate: Number(r.collection_rate),
  }));
}

export async function fetchHeatmap(): Promise<HeatmapPoint[]> {
  const { data } = await api.get<HeatmapPoint[]>('/reports/heatmap');
  return data.map((p) => ({
    latitude: Number(p.latitude),
    longitude: Number(p.longitude),
    total_kg: Number(p.total_kg),
  }));
}

export async function fetchActivityFeed(limit = 30): Promise<ActivityEvent[]> {
  const { data } = await api.get<ActivityEvent[]>('/reports/activity-feed', { params: { limit } });
  return data;
}
