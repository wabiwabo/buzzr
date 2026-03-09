// apps/web/src/pages/TpsPage/types.ts

export interface TpsItem {
  id: string;
  name: string;
  type: string;
  status: string;
  address: string;
  area_id: string;
  capacity_tons: number;
  current_load_tons: number;
  fill_percent: number;
  latitude: number;
  longitude: number;
  qr_code: string;
  created_at: string;
  updated_at: string;
}

export interface TpsAnalytics {
  totalCount: number;
  activeCount: number;
  nearCapacityCount: number;
  averageFillPercent: number;
  byType: { type: string; count: number }[];
  byStatus: { status: string; count: number }[];
  fillDistribution: { bracket: string; count: number; color: string }[];
  topFilled: TpsItem[];
}

export type TpsTab = 'peta' | 'kelola' | 'analitik';

export const TPS_TYPE_LABELS: Record<string, string> = {
  tps: 'TPS',
  tps3r: 'TPS3R',
  bank_sampah: 'Bank Sampah',
};

export const TPS_STATUS_LABELS: Record<string, string> = {
  active: 'Aktif',
  full: 'Penuh',
  maintenance: 'Pemeliharaan',
};

export const TPS_TYPE_OPTIONS = Object.entries(TPS_TYPE_LABELS).map(
  ([value, label]) => ({ value, label }),
);

export const TPS_STATUS_OPTIONS = Object.entries(TPS_STATUS_LABELS).map(
  ([value, label]) => ({ value, label }),
);
