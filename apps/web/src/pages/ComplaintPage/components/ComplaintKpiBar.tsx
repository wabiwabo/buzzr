import React from 'react';
import { AlertCircle, AlertTriangle, Clock, CheckCircle2 } from 'lucide-react';
import { StatCard } from '@/components/common';

interface ComplaintKpiBarProps {
  totalCount: number;
  slaBreach: number;
  avgResolutionHours: number;
  resolvedPct: number;
  loading?: boolean;
}

export const ComplaintKpiBar: React.FC<ComplaintKpiBarProps> = ({
  totalCount,
  slaBreach,
  avgResolutionHours,
  resolvedPct,
  loading = false,
}) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <StatCard
        title="Total Pengaduan"
        value={totalCount}
        prefix={<AlertCircle className="h-4 w-4" />}
        loading={loading}
      />
      <StatCard
        title="SLA Breach"
        value={slaBreach}
        prefix={<AlertTriangle className="h-4 w-4" />}
        loading={loading}
        valueStyle={slaBreach > 0 ? { color: 'var(--color-negative)' } : undefined}
      />
      <StatCard
        title="Rata-rata Resolusi"
        value={avgResolutionHours}
        suffix="jam"
        prefix={<Clock className="h-4 w-4" />}
        loading={loading}
      />
      <StatCard
        title="Tingkat Selesai"
        value={resolvedPct}
        suffix="%"
        prefix={<CheckCircle2 className="h-4 w-4" />}
        loading={loading}
      />
    </div>
  );
};
