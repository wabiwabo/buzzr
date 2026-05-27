import React from 'react';
import { Truck, CheckCircle, Users, Wifi } from 'lucide-react';
import { StatCard } from '@/components/common';

interface FleetKpiBarProps {
  totalCount: number;
  activeCount: number;
  assignedCount: number;
  onlineCount: number;
  loading?: boolean;
}

export const FleetKpiBar: React.FC<FleetKpiBarProps> = ({
  totalCount,
  activeCount,
  assignedCount,
  onlineCount,
  loading = false,
}) => {
  const assignedPct = totalCount > 0 ? Math.round((assignedCount / totalCount) * 100) : 0;
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <StatCard
        title="Total Armada"
        value={totalCount}
        prefix={<Truck className="h-4 w-4" />}
        loading={loading}
      />
      <StatCard
        title="Aktif"
        value={activeCount}
        prefix={<CheckCircle className="h-4 w-4" />}
        loading={loading}
      />
      <StatCard
        title="Ditugaskan"
        value={assignedCount}
        suffix={`(${assignedPct}%)`}
        prefix={<Users className="h-4 w-4" />}
        loading={loading}
      />
      <StatCard
        title="Online Sekarang"
        value={onlineCount}
        prefix={<Wifi className="h-4 w-4" />}
        loading={loading}
      />
    </div>
  );
};
