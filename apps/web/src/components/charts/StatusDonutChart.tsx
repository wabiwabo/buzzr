import React from 'react';
import { Card, Typography } from 'antd';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { CHART_COLORS } from '../../theme/colors';

const { Text } = Typography;

interface StatusSegment {
  name: string;
  value: number;
  color?: string;
}

interface StatusDonutChartProps {
  title: string;
  data: StatusSegment[];
  centerLabel?: string;
  centerValue?: number | string;
  loading?: boolean;
  onSegmentClick?: (name: string) => void;
}

export const StatusDonutChart: React.FC<StatusDonutChartProps> = ({
  title,
  data,
  centerLabel,
  centerValue,
  loading = false,
  onSegmentClick,
}) => {
  const total = data.reduce((sum, d) => sum + d.value, 0);

  return (
    <Card title={title} size="small" loading={loading}>
      <div style={{ position: 'relative' }}>
        <ResponsiveContainer width="100%" height={220}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={80}
              dataKey="value"
              animationDuration={600}
              onClick={(entry) => onSegmentClick?.(entry.name)}
              cursor="pointer"
            >
              {data.map((entry, index) => (
                <Cell key={index} fill={entry.color || CHART_COLORS[index % CHART_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #E5E7EB' }}
              formatter={(value: number, name: string) => [`${value} (${total > 0 ? Math.round((value / total) * 100) : 0}%)`, name]}
            />
          </PieChart>
        </ResponsiveContainer>
        {(centerLabel || centerValue !== undefined) && (
          <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center' }}>
            <div style={{ fontSize: 22, fontWeight: 600, color: '#1F2937' }}>{centerValue ?? total}</div>
            {centerLabel && <Text type="secondary" style={{ fontSize: 11 }}>{centerLabel}</Text>}
          </div>
        )}
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 16px', justifyContent: 'center', marginTop: 8 }}>
        {data.map((entry, index) => (
          <div key={index} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: entry.color || CHART_COLORS[index % CHART_COLORS.length] }} />
            <Text type="secondary">{entry.name}: {entry.value}</Text>
          </div>
        ))}
      </div>
    </Card>
  );
};
