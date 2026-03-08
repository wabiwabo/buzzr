import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, Cell,
} from 'recharts';

interface AreaRate {
  area: string;
  rate: number;
}

interface CollectionRateChartProps {
  data: AreaRate[];
  target?: number;
  loading?: boolean;
  onBarClick?: (area: string) => void;
}

const getBarColor = (rate: number, target: number): string => {
  if (rate >= target) return 'var(--color-positive)';
  if (rate >= target * 0.8) return 'var(--color-warning)';
  return 'var(--color-negative)';
};

export const CollectionRateChart: React.FC<CollectionRateChartProps> = ({
  data,
  target = 85,
  loading = false,
  onBarClick,
}) => {
  const sorted = [...data].sort((a, b) => b.rate - a.rate);

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium">Tingkat Pengumpulan per Area</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-[200px] w-full" />
        ) : sorted.length > 0 ? (
          <ResponsiveContainer width="100%" height={Math.max(200, sorted.length * 40)}>
            <BarChart data={sorted} layout="vertical" onClick={(e) => e?.activeLabel && onBarClick?.(String(e.activeLabel))}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
              <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11 }} tickFormatter={(v) => `${v}%`} />
              <YAxis type="category" dataKey="area" width={120} tick={{ fontSize: 11 }} />
              <Tooltip
                contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid hsl(var(--border))' }}
                formatter={(value: number) => [`${value}%`, 'Tingkat Pengumpulan']}
              />
              <ReferenceLine x={target} stroke="hsl(var(--muted-foreground))" strokeDasharray="4 4" label={{ value: `Target ${target}%`, fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
              <Bar dataKey="rate" radius={[0, 4, 4, 0]} animationDuration={600}>
                {sorted.map((entry, index) => (
                  <Cell key={index} fill={getBarColor(entry.rate, target)} cursor="pointer" />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-[200px]">
            <p className="text-sm text-muted-foreground">Tidak ada data area</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
