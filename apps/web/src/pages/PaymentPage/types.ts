export interface Transaction {
  id: string;
  user_id: string | null;
  user_name?: string | null;
  type: string;
  amount: number;
  status: string;
  payment_method: string | null;
  external_id: string | null;
  reference_id: string | null;
  description: string | null;
  paid_at: string | null;
  expired_at: string | null;
  created_at: string;
}

export interface OverdueInvoice extends Transaction {
  // overdue endpoint already filters by expired/pending + past expired_at
  days_overdue?: number;
}

export interface PaymentTimeseriesRow {
  date: string;
  total_invoices: number;
  paid_invoices: number;
  revenue: number;
  collection_rate: number;
}

export interface PaymentAnalytics {
  totalRevenue: number;
  paidCount: number;
  pendingCount: number;
  collectionRate: number;
  byStatus: { status: string; count: number; amount: number }[];
  byType: { type: string; count: number; amount: number }[];
  byMethod: { method: string; count: number; amount: number }[];
}

export type PaymentTab = 'kelola' | 'analitik';

export const TYPE_LABELS: Record<string, string> = {
  retribution: 'Retribusi',
  reward: 'Reward',
  top_up: 'Top Up',
  withdrawal: 'Penarikan',
};

export const TYPE_OPTIONS = Object.entries(TYPE_LABELS).map(
  ([value, label]) => ({ value, label }),
);

export const PAYMENT_STATUS_LABELS: Record<string, string> = {
  pending: 'Menunggu',
  paid: 'Dibayar',
  failed: 'Gagal',
  expired: 'Kadaluarsa',
  refunded: 'Dikembalikan',
};

export const PAYMENT_STATUS_OPTIONS = Object.entries(PAYMENT_STATUS_LABELS).map(
  ([value, label]) => ({ value, label }),
);

export const STATUS_COLOR_MAP: Record<string, string> = {
  pending: '#9CA3AF',
  paid: '#22C55E',
  failed: '#EF4444',
  expired: '#F59E0B',
  refunded: '#8B5CF6',
};

export const TYPE_COLOR_MAP: Record<string, string> = {
  retribution: '#3B82F6',
  reward: '#22C55E',
  top_up: '#EAB308',
  withdrawal: '#EF4444',
};

export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);
}
