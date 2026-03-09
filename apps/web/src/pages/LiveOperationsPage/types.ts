export interface VehiclePosition {
  id: string;
  plate_number: string;
  type: string;
  capacity_tons: number;
  driver_id: string | null;
  driver_name: string | null;
  driver_phone: string | null;
  latitude: number | null;
  longitude: number | null;
  speed: number | null;
  last_update: string | null;
  is_active: boolean;
}

export type VehicleStatus = 'moving' | 'idle' | 'offline' | 'alert';

export interface VehicleWithStatus extends VehiclePosition {
  status: VehicleStatus;
}

export interface TpsMapItem {
  id: string;
  name: string;
  type: string;
  status: string;
  capacity_tons: number;
  current_load_tons: number;
  latitude: number;
  longitude: number;
  fill_percent: number;
}

export interface ActiveSchedule {
  id: string;
  route_name: string;
  schedule_type: string;
  status: string;
  start_time: string;
  driver_id: string;
  driver_name: string;
  vehicle_id: string;
  vehicle_plate: string;
  stops: ScheduleStop[] | null;
}

export interface ScheduleStop {
  id: string;
  tps_id: string;
  tps_name: string;
  stop_order: number;
  estimated_arrival: string | null;
}

export interface LiveAlert {
  id: string;
  type: 'tps_capacity' | 'vehicle_offline' | 'route_delayed' | 'sla_breach' | 'missed_stop';
  severity: 'critical' | 'warning';
  title: string;
  message: string;
  sourceId: string;
  sourceType: 'vehicle' | 'tps' | 'schedule' | 'complaint';
  latitude?: number;
  longitude?: number;
  timestamp: Date;
  acknowledged: boolean;
}

export interface DashboardKPIs {
  totalWasteTodayKg: number;
  activeDrivers: number;
  pendingComplaints: number;
  collectionRate: number;
}

export type MapLayer = 'vehicles' | 'tps' | 'routes' | 'heatmap' | 'areas' | 'complaints';

export interface GpsUpdatePayload {
  vehicleId: string;
  driverId: string;
  latitude: number;
  longitude: number;
  speed: number;
  timestamp: string;
}

export interface HeatmapPoint {
  latitude: number;
  longitude: number;
  total_kg: number;
}
