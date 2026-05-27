import React from 'react';
import { CalendarDays, Play, CheckCircle, TrendingUp } from 'lucide-react';
import { StatCard } from '@/components/common';

interface ScheduleKpiBarProps {
  todayCount: number;
  inProgressCount: number;
  completedTodayCount: number;
  onTimePct: number;
  loading?: boolean;
}

export const ScheduleKpiBar: React.FC<ScheduleKpiBarProps> = ({
  todayCount,
  inProgressCount,
  completedTodayCount,
  onTimePct,
  loading = false,
}) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <StatCard
        title="Jadwal Hari Ini"
        value={todayCount}
        prefix={<CalendarDays className="h-4 w-4" />}
        loading={loading}
      />
      <StatCard
        title="Sedang Berjalan"
        value={inProgressCount}
        prefix={<Play className="h-4 w-4" />}
        loading={loading}
      />
      <StatCard
        title="Selesai Hari Ini"
        value={completedTodayCount}
        prefix={<CheckCircle className="h-4 w-4" />}
        loading={loading}
      />
      <StatCard
        title="Tingkat Penyelesaian"
        value={onTimePct}
        suffix="%"
        prefix={<TrendingUp className="h-4 w-4" />}
        loading={loading}
      />
    </div>
  );
};
