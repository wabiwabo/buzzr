import api from '@/services/api';
import type { MapComplaint, ComplaintDetail, ComplaintTimeseriesRow } from './types';

export async function fetchComplaintMapData(): Promise<MapComplaint[]> {
  const { data } = await api.get<MapComplaint[]>('/complaints/map-summary');
  return data.map((c) => ({
    ...c,
    latitude: Number(c.latitude),
    longitude: Number(c.longitude),
  }));
}

export async function fetchComplaintDetail(id: string): Promise<ComplaintDetail> {
  const { data } = await api.get<ComplaintDetail>(`/complaints/${id}`);
  return data;
}

export async function fetchComplaintTimeseries(
  from: string,
  to: string,
): Promise<ComplaintTimeseriesRow[]> {
  const { data } = await api.get<ComplaintTimeseriesRow[]>('/reports/complaints/timeseries', {
    params: { from, to },
  });
  return data.map((r) => ({
    ...r,
    total: Number(r.total),
    resolved: Number(r.resolved),
    avg_resolution_hours: r.avg_resolution_hours != null ? Number(r.avg_resolution_hours) : null,
    sla_compliance_pct: Number(r.sla_compliance_pct),
  }));
}

export async function fetchComplaintStats(from: string, to: string) {
  const { data } = await api.get('/reports/complaints', { params: { from, to } });
  return data;
}
