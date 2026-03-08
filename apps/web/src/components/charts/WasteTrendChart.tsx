import React, { useState, useMemo } from 'react';
import { Card, Segmented, Typography } from 'antd';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, Brush,
} from 'recharts';
import { WASTE_COLORS } from '../../theme/colors';

const { Text } = Typography;

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

  const formatDate = (value: string) => {
    if (!value) return '';
    const d = new Date(value);
    return `${d.getDate()}/${d.getMonth() + 1}`;
  };

  const formatTooltip = (value: number) => [`${value.toLocaleString('id-ID')} kg`, ''];

  return (
    <Card
      title="Trend Volume Sampah"
      size="small"
      loading={loading}
      extra={
        <Segmented
          size="small"
          options={Object.entries(periodLabels).map(([value, label]) => ({ value, label }))}
          value={period}
          onChange={(v) => setPeriod(v as Period)}
        />
      }
    >
      {data.length > 0 ? (
        <ResponsiveContainer width="100%" height={320}>
          <AreaChart data={data} onClick={(e) => e?.activeLabel && onBarClick?.(String(e.activeLabel))}>
            <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
            <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={formatDate} />
            <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${v} kg`} />
            <Tooltip
              contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #E5E7EB' }}
              formatter={formatTooltip}
              labelFormatter={(l) => `Tanggal: ${l}`}
            />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Area type="monotone" dataKey="organic" name="Organik" stackId="1" fill={WASTE_COLORS.organic} stroke={WASTE_COLORS.organic} fillOpacity={0.6} animationDuration={600} />
            <Area type="monotone" dataKey="inorganic" name="Anorganik" stackId="1" fill={WASTE_COLORS.inorganic} stroke={WASTE_COLORS.inorganic} fillOpacity={0.6} animationDuration={600} />
            <Area type="monotone" dataKey="b3" name="B3" stackId="1" fill={WASTE_COLORS.b3} stroke={WASTE_COLORS.b3} fillOpacity={0.6} animationDuration={600} />
            <Area type="monotone" dataKey="recyclable" name="Daur Ulang" stackId="1" fill={WASTE_COLORS.recyclable} stroke={WASTE_COLORS.recyclable} fillOpacity={0.6} animationDuration={600} />
            <Brush dataKey="date" height={20} stroke="#2563EB" tickFormatter={formatDate} />
          </AreaChart>
        </ResponsiveContainer>
      ) : (
        <div style={{ textAlign: 'center', padding: 48 }}>
          <Text type="secondary">Tidak ada data volume sampah</Text>
        </div>
      )}
    </Card>
  );
};
