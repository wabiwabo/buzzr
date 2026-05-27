import React, { useEffect, useMemo, useState } from 'react';
import dayjs from 'dayjs';
import { toast } from 'sonner';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip as ReTooltip,
  ResponsiveContainer, Legend, CartesianGrid,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useReportPageStore } from '../store';
import { fetchWasteVolume, fetchHeatmap } from '../api';
import { WasteHeatmap } from '../components/WasteHeatmap';
import { WASTE_CATEGORY_LABELS, formatKg } from '../types';
import type { WasteRow, HeatmapPoint } from '../types';
import { WASTE_COLORS } from '@/theme/tokens';

export const WasteTab: React.FC = () => {
  const { from, to } = useReportPageStore();
  const [waste, setWaste] = useState<WasteRow[]>([]);
  const [heatmap, setHeatmap] = useState<HeatmapPoint[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    Promise.all([fetchWasteVolume(from, to), fetchHeatmap()])
      .then(([w, h]) => {
        if (cancelled) return;
        setWaste(w);
        setHeatmap(h);
      })
      .catch((err) => {
        if (!cancelled) toast.error(err?.response?.data?.message || 'Gagal memuat data sampah');
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [from, to]);

  const chartData = useMemo(() => {
    const byDate: Record<string, any> = {};
    waste.forEach((r) => {
      const date = r.date?.slice(0, 10) || 'unknown';
      if (!byDate[date]) byDate[date] = { date, organic: 0, inorganic: 0, b3: 0, recyclable: 0 };
      const key = r.category in WASTE_CATEGORY_LABELS ? r.category : 'recyclable';
      byDate[date][key] += r.total_kg;
    });
    return Object.values(byDate).sort((a: any, b: any) => a.date.localeCompare(b.date));
  }, [waste]);

  const totalKg = useMemo(() => waste.reduce((s, r) => s + r.total_kg, 0), [waste]);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">
            Volume Sampah · <span className="tabular-nums">{formatKg(totalKg)} kg</span> total
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-[300px] w-full" />
          ) : chartData.length === 0 ? (
            <div className="flex items-center justify-center h-[300px]">
              <p className="text-sm text-muted-foreground">Tidak ada data untuk rentang tanggal ini</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={(d) => dayjs(d).format('DD MMM')} />
                <YAxis tick={{ fontSize: 11 }} />
                <ReTooltip
                  labelFormatter={(d) => dayjs(d as string).format('DD MMMM YYYY')}
                  formatter={(v: number) => [`${formatKg(v)} kg`, '']}
                />
                <Legend />
                <Area type="monotone" dataKey="organic" name="Organik" stackId="1" fill={WASTE_COLORS.organic} stroke={WASTE_COLORS.organic} fillOpacity={0.6} />
                <Area type="monotone" dataKey="inorganic" name="Anorganik" stackId="1" fill={WASTE_COLORS.inorganic} stroke={WASTE_COLORS.inorganic} fillOpacity={0.6} />
                <Area type="monotone" dataKey="b3" name="B3" stackId="1" fill={WASTE_COLORS.b3} stroke={WASTE_COLORS.b3} fillOpacity={0.6} />
                <Area type="monotone" dataKey="recyclable" name="Daur Ulang" stackId="1" fill={WASTE_COLORS.recyclable} stroke={WASTE_COLORS.recyclable} fillOpacity={0.6} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">Heatmap Volume per Lokasi (30 hari terakhir)</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-[400px] w-full" />
          ) : heatmap.length === 0 ? (
            <div className="flex items-center justify-center h-[400px]">
              <p className="text-sm text-muted-foreground">Belum ada data heatmap</p>
            </div>
          ) : (
            <div className="rounded-md overflow-hidden border">
              <WasteHeatmap points={heatmap} height="400px" />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
