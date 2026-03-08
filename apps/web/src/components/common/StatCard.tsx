import React from 'react';
import { Card, Statistic, Typography } from 'antd';
import { ArrowUpOutlined, ArrowDownOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

const { Text } = Typography;

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

  const handleClick = () => {
    if (navigateTo) navigate(navigateTo);
  };

  const trendColor = trend
    ? trend.value > 0 ? '#52c41a' : trend.value < 0 ? '#ff4d4f' : 'rgba(0,0,0,0.45)'
    : undefined;

  const TrendIcon = trend
    ? trend.value > 0 ? ArrowUpOutlined : trend.value < 0 ? ArrowDownOutlined : null
    : null;

  return (
    <Card
      className={navigateTo ? 'glass-card stat-card-clickable' : 'glass-card'}
      onClick={handleClick}
      loading={loading}
      size="small"
      style={{ height: '100%' }}
    >
      <Statistic
        title={title}
        value={formatter ? formatter(value) : value}
        prefix={prefix}
        suffix={suffix}
        valueStyle={{ fontSize: 28, fontWeight: 600, ...valueStyle }}
      />
      {trend && (
        <div style={{ marginTop: 4 }}>
          {TrendIcon && <TrendIcon style={{ color: trendColor, fontSize: 12, marginRight: 4 }} />}
          <Text style={{ color: trendColor, fontSize: 12 }}>
            {Math.abs(trend.value)}%
          </Text>
          {trend.label && (
            <Text style={{ color: 'rgba(0,0,0,0.45)', fontSize: 12, marginLeft: 4 }}>
              {trend.label}
            </Text>
          )}
        </div>
      )}
    </Card>
  );
};
