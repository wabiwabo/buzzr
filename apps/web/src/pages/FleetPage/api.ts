import api from '@/services/api';
import type { Vehicle, FleetPosition } from './types';

export async function fetchFleetPositions(): Promise<FleetPosition[]> {
  const { data } = await api.get<FleetPosition[]>('/fleet/positions');
  return data.map((v) => ({
    ...v,
    capacity_tons: Number(v.capacity_tons),
    latitude: v.latitude != null ? Number(v.latitude) : null,
    longitude: v.longitude != null ? Number(v.longitude) : null,
    speed: v.speed != null ? Number(v.speed) : null,
  }));
}

export async function fetchVehicleDetail(id: string): Promise<Vehicle> {
  const { data } = await api.get<Vehicle>(`/fleet/${id}`);
  return data;
}

export async function createVehicle(body: {
  plateNumber: string;
  type: string;
  capacityTons: number;
}): Promise<Vehicle> {
  const { data } = await api.post('/fleet', body);
  return data;
}

export async function updateVehicle(
  id: string,
  body: Partial<{
    plateNumber: string;
    type: string;
    capacityTons: number;
    isActive: boolean;
  }>,
): Promise<Vehicle> {
  const { data } = await api.patch(`/fleet/${id}`, body);
  return data;
}

export async function assignDriver(vehicleId: string, driverId: string) {
  const { data } = await api.patch(`/fleet/${vehicleId}/assign`, { driverId });
  return data;
}

export async function unassignDriver(vehicleId: string) {
  const { data } = await api.patch(`/fleet/${vehicleId}/unassign`);
  return data;
}
