export interface Vehicle {
  id: string;
  plate_number: string;
  type: string;
  capacity_tons: number;
  driver_id: string | null;
  driver_name: string | null;
  is_active: boolean;
  created_at: string;
  updated_at?: string;
}

export interface FleetPosition extends Vehicle {
  driver_phone: string | null;
  latitude: number | null;
  longitude: number | null;
  speed: number | null;
  last_update: string | null;
}

export interface FleetAnalytics {
  totalCount: number;
  activeCount: number;
  assignedCount: number;
  onlineCount: number;
  byType: { type: string; count: number }[];
  byStatus: { status: string; count: number }[];
}

export type FleetTab = 'kelola' | 'peta' | 'analitik';

export const VEHICLE_TYPE_LABELS: Record<string, string> = {
  truck: 'Truk',
  cart: 'Gerobak',
  motorcycle: 'Motor',
};

export const VEHICLE_TYPE_OPTIONS = Object.entries(VEHICLE_TYPE_LABELS).map(
  ([value, label]) => ({ value, label }),
);

export type VehicleStatus = 'online' | 'idle' | 'offline' | 'inactive';

// Derive status from speed + last_update timestamp
export function deriveVehicleStatus(
  isActive: boolean,
  speed: number | null,
  lastUpdate: string | null,
): VehicleStatus {
  if (!isActive) return 'inactive';
  if (!lastUpdate) return 'offline';
  const ageMs = Date.now() - new Date(lastUpdate).getTime();
  if (ageMs > 30 * 60 * 1000) return 'offline'; // >30min stale
  if (speed != null && speed > 5) return 'online';
  return 'idle';
}

export const STATUS_COLOR: Record<VehicleStatus, string> = {
  online: '#22C55E',
  idle: '#F59E0B',
  offline: '#9CA3AF',
  inactive: '#6B7280',
};

export const STATUS_LABEL_ID: Record<VehicleStatus, string> = {
  online: 'Bergerak',
  idle: 'Diam',
  offline: 'Offline',
  inactive: 'Nonaktif',
};
