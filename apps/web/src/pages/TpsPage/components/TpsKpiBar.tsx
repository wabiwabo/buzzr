// apps/web/src/pages/TpsPage/components/TpsKpiBar.tsx

import React from 'react';
import { MapPin, CheckCircle, AlertTriangle, Activity } from 'lucide-react';
import { StatCard } from '@/components/common';

interface TpsKpiBarProps {
  totalCount: number;
  activeCount: number;
  nearCapacityCount: number;
  averageFillPercent: number;
  loading?: boolean;
}

export const TpsKpiBar: React.FC<TpsKpiBarProps> = ({
  totalCount,
  activeCount,
  nearCapacityCount,
  averageFillPercent,
  loading = false,
}) => {
  return (
    <div className="grid grid-cols-4 gap-4">
      <StatCard
        title="Total TPS"
        value={totalCount}
        prefix={<MapPin className="h-4 w-4" />}
        loading={loading}
      />
      <StatCard
        title="Aktif"
        value={activeCount}
        prefix={<CheckCircle className="h-4 w-4" />}
        loading={loading}
      />
      <StatCard
        title="Hampir Penuh"
        value={nearCapacityCount}
        prefix={<AlertTriangle className="h-4 w-4" />}
        loading={loading}
        valueStyle={nearCapacityCount > 0 ? { color: 'var(--negative)' } : undefined}
      />
      <StatCard
        title="Rata-rata Beban"
        value={averageFillPercent}
        suffix="%"
        prefix={<Activity className="h-4 w-4" />}
        loading={loading}
      />
    </div>
  );
};
