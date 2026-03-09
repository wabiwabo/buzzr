// apps/web/src/pages/TpsPage/tabs/AnalyticsTab.tsx

import React, { useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
  PieChart, Pie,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useTpsPageStore, computeAnalytics } from '../store';
import { TpsKpiBar } from '../components/TpsKpiBar';
import { CapacityBar } from '../components/CapacityBar';

const TYPE_LABELS: Record<string, string> = {
  tps: 'TPS',
  tps3r: 'TPS3R',
  bank_sampah: 'Bank Sampah',
};

const STATUS_LABELS: Record<string, string> = {
  active: 'Aktif',
  full: 'Penuh',
  maintenance: 'Pemeliharaan',
};

const TYPE_COLORS: Record<string, string> = {
  tps: '#3B82F6',
  tps3r: '#22C55E',
  bank_sampah: '#EAB308',
};

const STATUS_COLORS: Record<string, string> = {
  active: '#22C55E',
  full: '#EF4444',
  maintenance: '#F59E0B',
};

export const AnalyticsTab: React.FC = () => {
  const { allTps, isLoading, selectTps, setActiveTab } = useTpsPageStore();
  const analytics = useMemo(() => computeAnalytics(allTps), [allTps]);

  const typeData = analytics.byType.map((d) => ({
    name: TYPE_LABELS[d.type] || d.type,
    value: d.count,
    fill: TYPE_COLORS[d.type] || '#9CA3AF',
  }));

  const statusData = analytics.byStatus.map((d) => ({
    name: STATUS_LABELS[d.status] || d.status,
    value: d.count,
    fill: STATUS_COLORS[d.status] || '#9CA3AF',
  }));

  const handleTopFilledClick = (id: string) => {
    selectTps(id);
    setActiveTab('kelola');
  };

  return (
    <div className="space-y-4">
      <TpsKpiBar
        totalCount={analytics.totalCount}
        activeCount={analytics.activeCount}
        nearCapacityCount={analytics.nearCapacityCount}
        averageFillPercent={analytics.averageFillPercent}
        loading={isLoading}
      />

      <div className="grid grid-cols-2 gap-4">
        {/* Fill Distribution */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Distribusi Beban</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={analytics.fillDistribution} layout="vertical">
                <XAxis type="number" hide />
                <YAxis type="category" dataKey="bracket" width={70} tick={{ fontSize: 12 }} />
                <Tooltip
                  formatter={(value: number) => [`${value} TPS`, 'Jumlah']}
                />
                <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                  {analytics.fillDistribution.map((d, i) => (
                    <Cell key={i} fill={d.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* TPS by Type */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">TPS per Tipe</CardTitle>
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
                  {typeData.map((d, i) => (
                    <Cell key={i} fill={d.fill} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* TPS by Status */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Status TPS</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  {statusData.map((d, i) => (
                    <Cell key={i} fill={d.fill} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Top 10 Near Capacity */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">TPS Hampir Penuh (Top 10)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {analytics.topFilled.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Tidak ada data
                </p>
              )}
              {analytics.topFilled.map((t, i) => (
                <button
                  key={t.id}
                  className="flex items-center gap-3 w-full text-left hover:bg-muted/50 rounded-md px-2 py-1.5 transition-colors"
                  onClick={() => handleTopFilledClick(t.id)}
                >
                  <span className="text-xs text-muted-foreground w-4 tabular-nums">
                    {i + 1}.
                  </span>
                  <span className="text-sm font-medium flex-1 truncate">{t.name}</span>
                  <div className="w-24">
                    <CapacityBar current={t.current_load_tons} max={t.capacity_tons} size="sm" />
                  </div>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
