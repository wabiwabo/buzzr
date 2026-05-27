import React, { useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
  PieChart, Pie,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useSchedulePageStore, computeAnalytics } from '../store';
import { ScheduleKpiBar } from '../components/ScheduleKpiBar';
import { TYPE_LABELS, SCHEDULE_STATUS_LABELS, STATUS_COLOR_MAP } from '../types';

const TYPE_COLORS: Record<string, string> = {
  recurring: '#3B82F6',
  on_demand: '#22C55E',
};

export const AnalyticsTab: React.FC = () => {
  const { todaySchedules, isLoading } = useSchedulePageStore();
  const analytics = useMemo(() => computeAnalytics(todaySchedules), [todaySchedules]);

  const typeData = analytics.byType.map((d) => ({
    name: TYPE_LABELS[d.type] || d.type,
    value: d.count,
    fill: TYPE_COLORS[d.type] || '#9CA3AF',
  }));

  const statusData = analytics.byStatus.map((d) => ({
    name: SCHEDULE_STATUS_LABELS[d.status] || d.status,
    value: d.count,
    fill: STATUS_COLOR_MAP[d.status] || '#9CA3AF',
  }));

  const inProgressCount = analytics.byStatus.find((b) => b.status === 'in_progress')?.count || 0;

  return (
    <div className="space-y-4">
      <ScheduleKpiBar
        todayCount={analytics.todayCount}
        inProgressCount={inProgressCount}
        completedTodayCount={analytics.completedTodayCount}
        onTimePct={analytics.onTimePct}
        loading={isLoading}
      />

      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Distribusi Tipe</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={typeData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`}>
                  {typeData.map((d, i) => <Cell key={i} fill={d.fill} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Status Jadwal</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={statusData} layout="vertical">
                <XAxis type="number" hide />
                <YAxis type="category" dataKey="name" width={90} tick={{ fontSize: 12 }} />
                <Tooltip formatter={(value: number) => [`${value} jadwal`, 'Jumlah']} />
                <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                  {statusData.map((d, i) => <Cell key={i} fill={d.fill} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Rute Teratas (Top 10)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-[220px] overflow-y-auto">
              {analytics.topRoutes.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">Tidak ada data</p>
              )}
              {analytics.topRoutes.map((r, i) => (
                <div key={i} className="flex items-center justify-between gap-2 text-sm">
                  <span className="flex items-center gap-2 min-w-0">
                    <span className="text-xs text-muted-foreground tabular-nums w-4">{i + 1}.</span>
                    <span className="font-medium truncate">{r.route_name}</span>
                  </span>
                  <span className="text-xs text-muted-foreground tabular-nums">{r.count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Beban Kerja Pengemudi (Top 10)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-[220px] overflow-y-auto">
              {analytics.byDriver.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">Tidak ada data</p>
              )}
              {analytics.byDriver.map((d, i) => (
                <div key={i} className="flex items-center justify-between gap-2 text-sm">
                  <span className="flex items-center gap-2 min-w-0">
                    <span className="text-xs text-muted-foreground tabular-nums w-4">{i + 1}.</span>
                    <span className="font-medium truncate">{d.driver_name}</span>
                  </span>
                  <span className="text-xs text-muted-foreground tabular-nums">{d.count} jadwal</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
