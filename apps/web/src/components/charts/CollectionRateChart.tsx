import React from 'react';
import { Card, Typography } from 'antd';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, Cell,
} from 'recharts';

const { Text } = Typography;

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
  if (rate >= target) return '#22C55E';
  if (rate >= target * 0.8) return '#F59E0B';
  return '#EF4444';
};

export const CollectionRateChart: React.FC<CollectionRateChartProps> = ({
  data,
  target = 85,
  loading = false,
  onBarClick,
}) => {
  const sorted = [...data].sort((a, b) => b.rate - a.rate);

  return (
    <Card title="Tingkat Pengumpulan per Area" size="small" loading={loading}>
      {sorted.length > 0 ? (
        <ResponsiveContainer width="100%" height={Math.max(200, sorted.length * 40)}>
          <BarChart data={sorted} layout="vertical" onClick={(e) => e?.activeLabel && onBarClick?.(String(e.activeLabel))}>
            <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" horizontal={false} />
            <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11 }} tickFormatter={(v) => `${v}%`} />
            <YAxis type="category" dataKey="area" width={120} tick={{ fontSize: 11 }} />
            <Tooltip
              contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #E5E7EB' }}
              formatter={(value: number) => [`${value}%`, 'Tingkat Pengumpulan']}
            />
            <ReferenceLine x={target} stroke="#6B7280" strokeDasharray="4 4" label={{ value: `Target ${target}%`, fontSize: 10, fill: '#6B7280' }} />
            <Bar dataKey="rate" radius={[0, 4, 4, 0]} animationDuration={600}>
              {sorted.map((entry, index) => (
                <Cell key={index} fill={getBarColor(entry.rate, target)} cursor="pointer" />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      ) : (
        <div style={{ textAlign: 'center', padding: 48 }}>
          <Text type="secondary">Tidak ada data area</Text>
        </div>
      )}
    </Card>
  );
};
