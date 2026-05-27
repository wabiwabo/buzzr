import api from '@/services/api';
import type { Schedule, ScheduleDetail } from './types';

export async function fetchTodayAdmin(): Promise<Schedule[]> {
  const { data } = await api.get<Schedule[]>('/schedules/today/all');
  return data;
}

export async function fetchActiveSchedules(): Promise<Schedule[]> {
  const { data } = await api.get<Schedule[]>('/schedules/active');
  return data;
}

export async function fetchScheduleDetail(id: string): Promise<ScheduleDetail> {
  const { data } = await api.get<ScheduleDetail>(`/schedules/${id}`);
  return {
    ...data,
    stops: data.stops?.map((s) => ({
      ...s,
      tps_latitude: s.tps_latitude != null ? Number(s.tps_latitude) : null,
      tps_longitude: s.tps_longitude != null ? Number(s.tps_longitude) : null,
    })) || [],
  };
}

export async function updateScheduleStatus(id: string, status: string): Promise<Schedule> {
  const { data } = await api.patch(`/schedules/${id}/status`, { status });
  return data;
}

export async function reassignSchedule(
  id: string,
  body: { driverId?: string; vehicleId?: string },
): Promise<Schedule> {
  const { data } = await api.patch(`/schedules/${id}/reassign`, body);
  return data;
}
