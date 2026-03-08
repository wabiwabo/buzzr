import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { WASTE_COLORS } from '../../theme/tokens';

interface WasteTrendChartProps {
  data: any[];
  loading?: boolean;
}

export const WasteTrendChart: React.FC<WasteTrendChartProps> = ({ data, loading }) => {
  const chartData = useMemo(() => {
    const byDate: Record<string, any> = {};
    data.forEach((r: any) => {
      const date = r.date?.slice(0, 10) || 'unknown';
      if (!byDate[date]) byDate[date] = { date, organic: 0, inorganic: 0, b3: 0, recyclable: 0 };
      const key = ['organic', 'inorganic', 'b3', 'recyclable'].includes(r.category) ? r.category : 'recyclable';
      byDate[date][key] += Number(r.total_kg || 0);
    });
    return Object.values(byDate).sort((a: any, b: any) => a.date.localeCompare(b.date));
  }, [data]);

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium">Tren Volume Sampah</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-[340px] w-full" />
        ) : chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={340}>
            <AreaChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend />
              <Area type="monotone" dataKey="organic" name="Organik" stackId="1" fill={WASTE_COLORS.organic} stroke={WASTE_COLORS.organic} fillOpacity={0.6} />
              <Area type="monotone" dataKey="inorganic" name="Anorganik" stackId="1" fill={WASTE_COLORS.inorganic} stroke={WASTE_COLORS.inorganic} fillOpacity={0.6} />
              <Area type="monotone" dataKey="b3" name="B3" stackId="1" fill={WASTE_COLORS.b3} stroke={WASTE_COLORS.b3} fillOpacity={0.6} />
              <Area type="monotone" dataKey="recyclable" name="Daur Ulang" stackId="1" fill={WASTE_COLORS.recyclable} stroke={WASTE_COLORS.recyclable} fillOpacity={0.6} />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-[340px]">
            <p className="text-sm text-muted-foreground">Memuat data...</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
