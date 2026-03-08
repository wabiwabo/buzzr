import React from 'react';
import { ResponsiveContainer, LineChart, Line, Tooltip } from 'recharts';

interface SparklineProps {
  data: number[];
  color?: string;
  height?: number;
  showTooltip?: boolean;
}

export const Sparkline: React.FC<SparklineProps> = ({
  data,
  color = '#2563EB',
  height = 32,
  showTooltip = true,
}) => {
  const chartData = data.map((value, index) => ({ index, value }));

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={chartData}>
        <Line
          type="monotone"
          dataKey="value"
          stroke={color}
          strokeWidth={1.5}
          dot={false}
          isAnimationActive={true}
          animationDuration={600}
        />
        {showTooltip && (
          <Tooltip
            contentStyle={{
              fontSize: 11,
              padding: '4px 8px',
              borderRadius: 4,
              border: '1px solid #e5e7eb',
            }}
            formatter={(value: number) => [value.toLocaleString('id-ID'), '']}
            labelFormatter={() => ''}
          />
        )}
      </LineChart>
    </ResponsiveContainer>
  );
};
