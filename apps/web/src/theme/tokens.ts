// Semantic color constants for use in JS/TSX (mirrors CSS theme vars)
export const WASTE_COLORS = {
  organic: 'var(--color-organic)',
  inorganic: 'var(--color-inorganic)',
  b3: 'var(--color-b3)',
  recyclable: 'var(--color-recyclable)',
} as const;

export const STATUS_COLORS = {
  positive: 'var(--color-positive)',
  negative: 'var(--color-negative)',
  warning: 'var(--color-warning)',
  info: 'var(--color-info)',
  neutral: 'var(--color-neutral)',
} as const;

export const SEVERITY_COLORS = {
  critical: 'var(--color-severity-critical)',
  warning: 'var(--color-severity-warning)',
  info: 'var(--color-severity-info)',
} as const;

export const SLA_COLORS = {
  normal: 'var(--color-sla-normal)',
  warning: 'var(--color-sla-warning)',
  critical: 'var(--color-sla-critical)',
} as const;

export const CHART_COLORS = [
  '#2563EB', '#22C55E', '#F59E0B', '#EF4444',
  '#8B5CF6', '#EC4899', '#14B8A6', '#F97316',
] as const;

// Status label maps (Indonesian)
export const STATUS_LABELS: Record<string, string> = {
  submitted: 'Baru',
  verified: 'Terverifikasi',
  assigned: 'Ditugaskan',
  in_progress: 'Dalam Proses',
  resolved: 'Selesai',
  rejected: 'Ditolak',
  active: 'Aktif',
  inactive: 'Nonaktif',
  maintenance: 'Pemeliharaan',
  available: 'Tersedia',
  in_use: 'Digunakan',
  full: 'Penuh',
  pending: 'Menunggu',
  paid: 'Dibayar',
  failed: 'Gagal',
  overdue: 'Terlambat',
};

// Priority labels
export const PRIORITY_LABELS: Record<string, string> = {
  p1: 'P1 Kritis',
  p2: 'P2 Tinggi',
  p3: 'P3 Normal',
  p4: 'P4 Rendah',
};

// Valid status transitions
export const STATUS_TRANSITIONS: Record<string, string[]> = {
  submitted: ['verified', 'rejected'],
  verified: ['assigned', 'rejected'],
  assigned: ['in_progress'],
  in_progress: ['resolved', 'rejected'],
  resolved: [],
  rejected: [],
};
