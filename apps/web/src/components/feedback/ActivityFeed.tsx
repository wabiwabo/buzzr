import React from 'react';
import { Timeline, Typography, Card, Button } from 'antd';
import {
  UserOutlined, CarOutlined, AlertOutlined,
  DollarOutlined, CheckCircleOutlined, ClockCircleOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/id';

dayjs.extend(relativeTime);
dayjs.locale('id');

export interface ActivityItem {
  id: string;
  type: 'complaint' | 'driver' | 'payment' | 'tps' | 'user' | 'schedule';
  message: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

const typeIcons: Record<string, React.ReactNode> = {
  complaint: <AlertOutlined style={{ color: '#1677ff' }} />,
  driver: <CarOutlined style={{ color: '#722ed1' }} />,
  payment: <DollarOutlined style={{ color: '#52c41a' }} />,
  tps: <CheckCircleOutlined style={{ color: '#faad14' }} />,
  user: <UserOutlined style={{ color: '#13c2c2' }} />,
  schedule: <ClockCircleOutlined style={{ color: '#eb2f96' }} />,
};

interface ActivityFeedProps {
  items: ActivityItem[];
  loading?: boolean;
  onViewAll?: () => void;
  maxItems?: number;
}

export const ActivityFeed: React.FC<ActivityFeedProps> = ({
  items,
  loading = false,
  onViewAll,
  maxItems = 8,
}) => {
  const displayed = items.slice(0, maxItems);

  return (
    <Card
      title="Aktivitas Terbaru"
      loading={loading}
      size="small"
      className="glass-card"
      extra={onViewAll && <Button type="link" size="small" onClick={onViewAll}>Lihat semua</Button>}
      style={{ height: '100%' }}
      styles={{ body: { maxHeight: 400, overflowY: 'auto' } }}
    >
      <Timeline
        items={displayed.map((item) => ({
          dot: typeIcons[item.type] || <ClockCircleOutlined />,
          children: (
            <div>
              <Typography.Text style={{ fontSize: 13 }}>{item.message}</Typography.Text>
              <br />
              <Typography.Text type="secondary" style={{ fontSize: 11 }}>
                {dayjs(item.timestamp).fromNow()}
              </Typography.Text>
            </div>
          ),
        }))}
      />
    </Card>
  );
};
