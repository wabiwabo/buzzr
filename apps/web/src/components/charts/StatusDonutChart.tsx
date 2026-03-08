import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { CHART_COLORS } from '../../theme/tokens';

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
    <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-[220px] w-full" />
        ) : (
          <>
            <div className="relative">
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
                    contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid hsl(var(--border))' }}
                    formatter={(value: number, name: string) => [`${value} (${total > 0 ? Math.round((value / total) * 100) : 0}%)`, name]}
                  />
                </PieChart>
              </ResponsiveContainer>
              {(centerLabel || centerValue !== undefined) && (
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
                  <div className="text-[22px] font-semibold">{centerValue ?? total}</div>
                  {centerLabel && <span className="text-xs text-muted-foreground">{centerLabel}</span>}
                </div>
              )}
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-2 justify-center mt-2">
              {data.map((entry, index) => (
                <div key={index} className="flex items-center gap-1.5 text-xs">
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ background: entry.color || CHART_COLORS[index % CHART_COLORS.length] }}
                  />
                  <span className="text-muted-foreground">{entry.name}: {entry.value}</span>
                </div>
              ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};
