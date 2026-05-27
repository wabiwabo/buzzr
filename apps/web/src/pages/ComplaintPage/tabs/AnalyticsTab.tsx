import React, { useMemo, useState, useEffect } from 'react';
import dayjs from 'dayjs';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ComplaintKpiBar } from '../components/ComplaintKpiBar';
import { fetchComplaintTimeseries, fetchComplaintStats } from '../api';
import type { ComplaintTimeseriesRow } from '../types';
import { STATUS_COLOR_MAP } from '../types';

export const AnalyticsTab: React.FC = () => {
  const [from, setFrom] = useState(() => dayjs().subtract(30, 'day').format('YYYY-MM-DD'));
  const [to, setTo] = useState(() => dayjs().format('YYYY-MM-DD'));
  const [timeseries, setTimeseries] = useState<ComplaintTimeseriesRow[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    Promise.all([
      fetchComplaintTimeseries(from, to),
      fetchComplaintStats(from, to),
    ])
      .then(([ts, st]) => {
        if (!cancelled) {
          setTimeseries(ts);
          setStats(st);
        }
      })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [from, to]);

  const kpis = useMemo(() => {
    if (!stats) return { total: 0, resolved: 0, avgHours: 0, resolvedPct: 0 };
    return {
      total: Number(stats.total) || 0,
      resolved: Number(stats.resolved) || 0,
      avgHours: Number(stats.avg_resolution_hours) || 0,
      resolvedPct: stats.total > 0
        ? Math.round((Number(stats.resolved) / Number(stats.total)) * 100)
        : 0,
    };
  }, [stats]);

  const slaBreach = useMemo(() => {
    return timeseries.reduce(
      (sum, r) => sum + (r.total - Math.round(r.total * r.sla_compliance_pct / 100)),
      0,
    );
  }, [timeseries]);

  const chartData = useMemo(() => timeseries.map((r) => ({
    date: dayjs(r.date).format('DD MMM'),
    total: r.total,
    resolved: r.resolved,
    avgHours: r.avg_resolution_hours ?? 0,
    slaPct: r.sla_compliance_pct,
  })), [timeseries]);

  const statusData = useMemo(() => {
    const totalResolved = timeseries.reduce((s, r) => s + r.resolved, 0);
    const totalAll = timeseries.reduce((s, r) => s + r.total, 0);
    const unresolved = totalAll - totalResolved;
    return [
      { name: 'Selesai', value: totalResolved, fill: STATUS_COLOR_MAP.resolved },
      { name: 'Belum Selesai', value: unresolved, fill: STATUS_COLOR_MAP.submitted },
    ].filter((d) => d.value > 0);
  }, [timeseries]);

  return (
    <div className="space-y-4">
      <div className="flex items-end gap-3">
        <div className="space-y-1">
          <Label className="text-xs">Dari</Label>
          <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="h-8 w-40 text-sm" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Sampai</Label>
          <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="h-8 w-40 text-sm" />
        </div>
      </div>

      <ComplaintKpiBar
        totalCount={kpis.total}
        slaBreach={slaBreach}
        avgResolutionHours={kpis.avgHours}
        resolvedPct={kpis.resolvedPct}
        loading={loading}
      />

      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Rata-rata Resolusi (jam)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={(value: number) => [`${value} jam`, 'Avg Resolusi']} />
                <Area type="monotone" dataKey="avgHours" stroke="#F59E0B" fill="#F59E0B" fillOpacity={0.15} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">SLA Compliance (%)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                <Tooltip formatter={(value: number) => [`${value}%`, 'SLA']} />
                <Area type="monotone" dataKey="slaPct" stroke="#22C55E" fill="#22C55E" fillOpacity={0.15} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Volume Harian</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="total" name="Total" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="resolved" name="Selesai" fill="#22C55E" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Distribusi Status</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={statusData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`}>
                  {statusData.map((d, i) => (
                    <Cell key={i} fill={d.fill} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
