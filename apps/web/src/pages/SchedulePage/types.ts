export interface Schedule {
  id: string;
  vehicle_id: string | null;
  vehicle_plate: string | null;
  driver_id: string | null;
  driver_name: string | null;
  route_name: string;
  schedule_type: string;
  recurring_days: number[] | null;
  scheduled_date: string | null;
  start_time: string;
  status: string;
  stop_count?: number;
}

export interface ScheduleStop {
  id: string;
  tps_id: string;
  stop_order: number;
  estimated_arrival: string | null;
  tps_name: string;
  tps_address: string | null;
  tps_latitude: number | null;
  tps_longitude: number | null;
}

export interface ScheduleDetail extends Schedule {
  stops: ScheduleStop[];
}

export interface ScheduleAnalytics {
  totalCount: number;
  todayCount: number;
  completedTodayCount: number;
  onTimePct: number;
  byType: { type: string; count: number }[];
  byStatus: { status: string; count: number }[];
  topRoutes: { route_name: string; count: number }[];
  byDriver: { driver_name: string; count: number }[];
}

export type ScheduleTab = 'kelola' | 'hari-ini' | 'analitik';

export const TYPE_LABELS: Record<string, string> = {
  recurring: 'Rutin',
  on_demand: 'Sesuai Permintaan',
};

export const TYPE_OPTIONS = Object.entries(TYPE_LABELS).map(
  ([value, label]) => ({ value, label }),
);

export const SCHEDULE_STATUS_LABELS: Record<string, string> = {
  pending: 'Menunggu',
  in_progress: 'Berjalan',
  completed: 'Selesai',
  cancelled: 'Dibatalkan',
};

export const SCHEDULE_STATUS_OPTIONS = Object.entries(SCHEDULE_STATUS_LABELS).map(
  ([value, label]) => ({ value, label }),
);

export const STATUS_COLOR_MAP: Record<string, string> = {
  pending: '#9CA3AF',
  in_progress: '#F59E0B',
  completed: '#22C55E',
  cancelled: '#EF4444',
};

export const DAY_NAMES = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

export function formatRecurringDays(days: number[] | null): string {
  if (!days || days.length === 0) return '-';
  return days.map((d) => DAY_NAMES[d] || d).join(', ');
}
