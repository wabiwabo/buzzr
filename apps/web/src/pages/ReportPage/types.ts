export interface WasteRow {
  date: string;
  category: string;
  total_kg: number;
  total_records: number;
}

export interface DriverPerf {
  id: string;
  name: string;
  total_trips: number;
  total_checkpoints: number;
  total_volume_kg: number;
}

export interface ComplaintStats {
  total: number;
  resolved: number;
  rejected: number;
  avg_resolution_hours: number | null;
}

export interface ComplaintTimeseriesRow {
  date: string;
  total: number;
  resolved: number;
  avg_resolution_hours: number | null;
  sla_compliance_pct: number;
}

export interface PaymentTimeseriesRow {
  date: string;
  total_invoices: number;
  paid_invoices: number;
  revenue: number;
  collection_rate: number;
}

export interface HeatmapPoint {
  latitude: number;
  longitude: number;
  total_kg: number;
}

export interface ActivityEvent {
  type: 'complaint' | 'schedule' | 'payment' | string;
  message: string;
  id: string;
  timestamp: string;
}

export type ReportTab = 'sampah' | 'driver' | 'pengaduan' | 'pembayaran' | 'aktivitas';

export const WASTE_CATEGORY_LABELS: Record<string, string> = {
  organic: 'Organik',
  inorganic: 'Anorganik',
  b3: 'B3',
  recyclable: 'Daur Ulang',
};

export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);
}

export function formatKg(value: number): string {
  return new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 }).format(value);
}
