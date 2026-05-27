import React, { useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
  PieChart, Pie,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useFleetPageStore, computeAnalytics } from '../store';
import { FleetKpiBar } from '../components/FleetKpiBar';
import { VEHICLE_TYPE_LABELS, STATUS_COLOR, STATUS_LABEL_ID, type VehicleStatus } from '../types';

const TYPE_COLORS: Record<string, string> = {
  truck: '#3B82F6',
  cart: '#22C55E',
  motorcycle: '#EAB308',
};

export const AnalyticsTab: React.FC = () => {
  const { positions, isLoading, selectVehicle, setActiveTab } = useFleetPageStore();
  const analytics = useMemo(() => computeAnalytics(positions), [positions]);

  const typeData = analytics.byType.map((d) => ({
    name: VEHICLE_TYPE_LABELS[d.type] || d.type,
    value: d.count,
    fill: TYPE_COLORS[d.type] || '#9CA3AF',
  }));

  const statusData = analytics.byStatus.map((d) => ({
    name: STATUS_LABEL_ID[d.status as VehicleStatus] || d.status,
    value: d.count,
    fill: STATUS_COLOR[d.status as VehicleStatus] || '#9CA3AF',
  }));

  // Top 10 most-active vehicles (proxy: those with recent GPS update)
  const topActive = useMemo(() => {
    return [...positions]
      .filter((v) => v.last_update)
      .sort((a, b) => new Date(b.last_update!).getTime() - new Date(a.last_update!).getTime())
      .slice(0, 10);
  }, [positions]);

  const handleClick = (id: string) => {
    selectVehicle(id);
    setActiveTab('kelola');
  };

  return (
    <div className="space-y-4">
      <FleetKpiBar
        totalCount={analytics.totalCount}
        activeCount={analytics.activeCount}
        assignedCount={analytics.assignedCount}
        onlineCount={analytics.onlineCount}
        loading={isLoading}
      />

      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Armada per Tipe</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={typeData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  {typeData.map((d, i) => <Cell key={i} fill={d.fill} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Status Telemetri</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={statusData} layout="vertical">
                <XAxis type="number" hide />
                <YAxis type="category" dataKey="name" width={70} tick={{ fontSize: 12 }} />
                <Tooltip formatter={(value: number) => [`${value} kendaraan`, 'Jumlah']} />
                <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                  {statusData.map((d, i) => <Cell key={i} fill={d.fill} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Tingkat Penugasan</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={[
                    { name: 'Ditugaskan', value: analytics.assignedCount, fill: '#22C55E' },
                    { name: 'Belum Ditugaskan', value: analytics.totalCount - analytics.assignedCount, fill: '#9CA3AF' },
                  ].filter((d) => d.value > 0)}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  <Cell fill="#22C55E" />
                  <Cell fill="#9CA3AF" />
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Aktivitas Terbaru (Top 10)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {topActive.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Belum ada data telemetri
                </p>
              )}
              {topActive.map((v, i) => (
                <button
                  key={v.id}
                  className="flex items-center gap-3 w-full text-left hover:bg-muted/50 rounded-md px-2 py-1.5 transition-colors"
                  onClick={() => handleClick(v.id)}
                >
                  <span className="text-xs text-muted-foreground w-4 tabular-nums">{i + 1}.</span>
                  <span className="text-sm font-medium font-mono flex-1 truncate">{v.plate_number}</span>
                  <span className="text-xs text-muted-foreground">
                    {v.driver_name || 'Belum ditugaskan'}
                  </span>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
