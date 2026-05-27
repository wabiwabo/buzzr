import React, { useEffect, useMemo, useState } from 'react';
import dayjs from 'dayjs';
import { toast } from 'sonner';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useReportPageStore } from '../store';
import { fetchComplaintStats, fetchComplaintTimeseries } from '../api';
import type { ComplaintStats, ComplaintTimeseriesRow } from '../types';
import { CHART_COLORS } from '@/theme/tokens';

const COLORS = [CHART_COLORS[1], CHART_COLORS[0], CHART_COLORS[3], CHART_COLORS[2]];

export const ComplaintTab: React.FC = () => {
  const { from, to } = useReportPageStore();
  const [stats, setStats] = useState<ComplaintStats | null>(null);
  const [series, setSeries] = useState<ComplaintTimeseriesRow[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    Promise.all([fetchComplaintStats(from, to), fetchComplaintTimeseries(from, to)])
      .then(([s, ts]) => {
        if (cancelled) return;
        setStats(s);
        setSeries(ts);
      })
      .catch((err) => {
        if (!cancelled) toast.error(err?.response?.data?.message || 'Gagal memuat statistik laporan');
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [from, to]);

  const pieData = useMemo(() => {
    if (!stats) return [];
    return [
      { name: 'Selesai', value: stats.resolved },
      { name: 'Ditolak', value: stats.rejected },
      { name: 'Lainnya', value: Math.max(0, stats.total - stats.resolved - stats.rejected) },
    ].filter((d) => d.value > 0);
  }, [stats]);

  const chartData = useMemo(() => series.map((r) => ({
    date: dayjs(r.date).format('DD MMM'),
    total: r.total,
    resolved: r.resolved,
    slaPct: r.sla_compliance_pct,
    avgHours: r.avg_resolution_hours ?? 0,
  })), [series]);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        {loading || !stats ? (
          <>
            {Array.from({ length: 4 }).map((_, i) => (
              <Card key={i}><CardContent className="pt-4 pb-4"><Skeleton className="h-16 w-full" /></CardContent></Card>
            ))}
          </>
        ) : (
          <>
            <Card><CardContent className="pt-4 pb-4">
              <p className="text-sm text-muted-foreground">Total Laporan</p>
              <p className="text-2xl font-semibold mt-1 tabular-nums">{stats.total}</p>
            </CardContent></Card>
            <Card><CardContent className="pt-4 pb-4">
              <p className="text-sm text-muted-foreground">Selesai</p>
              <p className="text-2xl font-semibold mt-1 tabular-nums text-positive">{stats.resolved}</p>
            </CardContent></Card>
            <Card><CardContent className="pt-4 pb-4">
              <p className="text-sm text-muted-foreground">Ditolak</p>
              <p className="text-2xl font-semibold mt-1 tabular-nums text-negative">{stats.rejected}</p>
            </CardContent></Card>
            <Card><CardContent className="pt-4 pb-4">
              <p className="text-sm text-muted-foreground">Rata-rata Resolusi</p>
              <p className="text-2xl font-semibold mt-1 tabular-nums">
                {(stats.avg_resolution_hours ?? 0).toFixed(1)} <span className="text-sm font-normal text-muted-foreground">jam</span>
              </p>
            </CardContent></Card>
          </>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Volume Laporan Harian</CardTitle></CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-[220px] w-full" /> : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="total" name="Total" fill="#9CA3AF" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="resolved" name="Selesai" fill="#22C55E" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">SLA Compliance (%)</CardTitle></CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-[220px] w-full" /> : (
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v: number) => [`${v}%`, 'SLA']} />
                  <Area type="monotone" dataKey="slaPct" stroke="#22C55E" fill="#22C55E" fillOpacity={0.15} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {pieData.length > 0 && (
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Distribusi Status</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                    {pieData.map((_, idx) => <Cell key={idx} fill={COLORS[idx % COLORS.length]} />)}
                  </Pie>
                  <Legend />
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Rata-rata Resolusi (jam)</CardTitle></CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-[220px] w-full" /> : (
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v: number) => [`${v} jam`, 'Resolusi']} />
                  <Area type="monotone" dataKey="avgHours" stroke="#F59E0B" fill="#F59E0B" fillOpacity={0.15} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
