// apps/web/src/pages/TpsPage/api.ts

import api from '@/services/api';
import type { TpsItem } from './types';

export async function fetchTpsMapData(): Promise<TpsItem[]> {
  const { data } = await api.get<TpsItem[]>('/tps/map-summary');
  return data.map((t) => ({
    ...t,
    latitude: Number(t.latitude),
    longitude: Number(t.longitude),
    capacity_tons: Number(t.capacity_tons),
    current_load_tons: Number(t.current_load_tons),
    fill_percent: Number(t.fill_percent),
  }));
}

export async function createTps(body: {
  name: string;
  type: string;
  address: string;
  latitude: number;
  longitude: number;
  areaId?: string;
  capacityTons: number;
}): Promise<TpsItem> {
  const { data } = await api.post('/tps', body);
  return data;
}

export async function updateTps(
  id: string,
  body: Partial<{
    name: string;
    type: string;
    status: string;
    address: string;
    latitude: number;
    longitude: number;
    areaId: string;
    capacityTons: number;
  }>,
): Promise<TpsItem> {
  const { data } = await api.patch(`/tps/${id}`, body);
  return data;
}
