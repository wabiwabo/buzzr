export interface Complaint {
  id: string;
  category: string;
  description: string;
  status: string;
  address: string;
  latitude: number;
  longitude: number;
  rating: number | null;
  created_at: string;
  resolved_at: string | null;
  reporter_name: string;
  assignee_name: string | null;
}

export interface ComplaintDetail extends Complaint {
  attachments: { id: string; file_url: string; file_type: string; created_at: string }[];
}

export interface MapComplaint {
  id: string;
  latitude: number;
  longitude: number;
  status: string;
  category: string;
  created_at: string;
}

export interface ComplaintTimeseriesRow {
  date: string;
  total: number;
  resolved: number;
  avg_resolution_hours: number | null;
  sla_compliance_pct: number;
}

export interface ComplaintAnalytics {
  totalCount: number;
  slaBreach: number;
  avgResolutionHours: number;
  resolvedPct: number;
  byCategory: { category: string; count: number }[];
  byStatus: { status: string; count: number }[];
  topAreas: { address: string; count: number; avgHours: number }[];
}

export type ComplaintTab = 'triage' | 'peta' | 'analitik';

export const CATEGORY_LABELS: Record<string, string> = {
  illegal_dumping: 'Pembuangan Ilegal',
  tps_full: 'TPS Penuh',
  missed_pickup: 'Tidak Diangkut',
  other: 'Lainnya',
};

export const CATEGORY_OPTIONS = Object.entries(CATEGORY_LABELS).map(
  ([value, label]) => ({ value, label }),
);

export const STATUS_COLOR_MAP: Record<string, string> = {
  submitted: '#EF4444',
  verified: '#3B82F6',
  assigned: '#3B82F6',
  in_progress: '#F59E0B',
  resolved: '#22C55E',
  rejected: '#6B7280',
};
