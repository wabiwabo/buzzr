import React from 'react';
import { useNavigate } from 'react-router-dom';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface StatCardProps {
  title: string;
  value: number | string;
  prefix?: React.ReactNode;
  suffix?: string;
  trend?: { value: number; label?: string };
  navigateTo?: string;
  loading?: boolean;
  formatter?: (value: number | string) => string;
  valueStyle?: React.CSSProperties;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  prefix,
  suffix,
  trend,
  navigateTo,
  loading = false,
  formatter,
  valueStyle,
}) => {
  const navigate = useNavigate();

  if (loading) {
    return (
      <Card className="h-full">
        <CardContent className="pt-4 pb-4 space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-8 w-16" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card
      className={cn('h-full', navigateTo && 'cursor-pointer hover:bg-surface-hover transition-colors')}
      onClick={() => navigateTo && navigate(navigateTo)}
    >
      <CardContent className="pt-4 pb-4">
        <p className="text-sm text-muted-foreground">{title}</p>
        <div className="flex items-baseline gap-1.5 mt-1">
          {prefix && <span className="text-muted-foreground">{prefix}</span>}
          <span className="text-[28px] font-semibold leading-none tabular-nums" style={valueStyle}>
            {formatter ? formatter(value) : value}
          </span>
          {suffix && <span className="text-sm text-muted-foreground">{suffix}</span>}
        </div>
        {trend && (
          <div className="flex items-center gap-1 mt-1">
            {trend.value > 0 && <TrendingUp className="h-3 w-3 text-positive" />}
            {trend.value < 0 && <TrendingDown className="h-3 w-3 text-negative" />}
            <span className={cn(
              'text-xs tabular-nums',
              trend.value > 0 ? 'text-positive' : trend.value < 0 ? 'text-negative' : 'text-muted-foreground',
            )}>
              {Math.abs(trend.value)}%
            </span>
            {trend.label && <span className="text-xs text-muted-foreground">{trend.label}</span>}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
