import React, { useState, useMemo } from 'react';
import dayjs from 'dayjs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, Brush,
} from 'recharts';
import { WASTE_COLORS } from '../../theme/tokens';

type Period = 'daily' | 'weekly' | 'monthly';

interface WasteTrendChartProps {
  data: Array<{
    date: string;
    organic: number;
    inorganic: number;
    b3: number;
    recyclable: number;
  }>;
  loading?: boolean;
  onBarClick?: (date: string) => void;
}

const periodLabels: Record<Period, string> = {
  daily: 'Harian',
  weekly: 'Mingguan',
  monthly: 'Bulanan',
};

export const WasteTrendChart: React.FC<WasteTrendChartProps> = ({
  data,
  loading = false,
  onBarClick,
}) => {
  const [period, setPeriod] = useState<Period>('daily');

  const aggregatedData = useMemo(() => {
    if (period === 'daily') return data;

    const grouped: Record<string, { date: string; organic: number; inorganic: number; b3: number; recyclable: number }> = {};
    data.forEach((row) => {
      const d = dayjs(row.date);
      const key = period === 'weekly'
        ? d.startOf('week').format('YYYY-MM-DD')
        : d.format('YYYY-MM');
      if (!grouped[key]) grouped[key] = { date: key, organic: 0, inorganic: 0, b3: 0, recyclable: 0 };
      grouped[key].organic += row.organic;
      grouped[key].inorganic += row.inorganic;
      grouped[key].b3 += row.b3;
      grouped[key].recyclable += row.recyclable;
    });
    return Object.values(grouped).sort((a, b) => a.date.localeCompare(b.date));
  }, [data, period]);

  const formatDate = (value: string) => {
    if (!value) return '';
    if (period === 'monthly') return dayjs(value).format('MMM YY');
    const d = new Date(value);
    return `${d.getDate()}/${d.getMonth() + 1}`;
  };

  const formatTooltip = (value: number) => [`${value.toLocaleString('id-ID')} kg`, ''];

  return (
    <Card className="h-full">
      <CardHeader className="pb-3 flex-row items-center justify-between">
        <CardTitle className="text-sm font-medium">Trend Volume Sampah</CardTitle>
        <ToggleGroup type="single" value={period} onValueChange={(v) => v && setPeriod(v as Period)} size="sm">
          {Object.entries(periodLabels).map(([value, label]) => (
            <ToggleGroupItem key={value} value={value} className="text-xs px-2.5">
              {label}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-[320px] w-full" />
        ) : aggregatedData.length > 0 ? (
          <ResponsiveContainer width="100%" height={320}>
            <AreaChart data={aggregatedData} onClick={(e) => e?.activeLabel && onBarClick?.(String(e.activeLabel))}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={formatDate} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${v} kg`} />
              <Tooltip
                contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid hsl(var(--border))' }}
                formatter={formatTooltip}
                labelFormatter={(l) => `Tanggal: ${l}`}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Area type="monotone" dataKey="organic" name="Organik" stackId="1" fill={WASTE_COLORS.organic} stroke={WASTE_COLORS.organic} fillOpacity={0.6} animationDuration={600} />
              <Area type="monotone" dataKey="inorganic" name="Anorganik" stackId="1" fill={WASTE_COLORS.inorganic} stroke={WASTE_COLORS.inorganic} fillOpacity={0.6} animationDuration={600} />
              <Area type="monotone" dataKey="b3" name="B3" stackId="1" fill={WASTE_COLORS.b3} stroke={WASTE_COLORS.b3} fillOpacity={0.6} animationDuration={600} />
              <Area type="monotone" dataKey="recyclable" name="Daur Ulang" stackId="1" fill={WASTE_COLORS.recyclable} stroke={WASTE_COLORS.recyclable} fillOpacity={0.6} animationDuration={600} />
              <Brush dataKey="date" height={20} stroke="hsl(var(--primary))" tickFormatter={formatDate} />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-[320px]">
            <p className="text-sm text-muted-foreground">Tidak ada data volume sampah</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
