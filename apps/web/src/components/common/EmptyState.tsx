import React from 'react';
import { Button, Empty, Typography } from 'antd';
import { PlusOutlined, SearchOutlined, InboxOutlined } from '@ant-design/icons';

const { Text } = Typography;

interface EmptyStateProps {
  type?: 'no-data' | 'no-results' | 'success';
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: React.ReactNode;
}

const defaultIcons = {
  'no-data': <InboxOutlined style={{ fontSize: 48, color: 'rgba(0,0,0,0.25)' }} />,
  'no-results': <SearchOutlined style={{ fontSize: 48, color: 'rgba(0,0,0,0.25)' }} />,
  'success': null,
};

export const EmptyState: React.FC<EmptyStateProps> = ({
  type = 'no-data',
  title,
  description,
  actionLabel,
  onAction,
  icon,
}) => (
  <Empty
    image={icon || defaultIcons[type] || Empty.PRESENTED_IMAGE_SIMPLE}
    imageStyle={{ height: 80 }}
    description={
      <div>
        <Text strong style={{ fontSize: 15 }}>{title}</Text>
        {description && (
          <div>
            <Text type="secondary" style={{ fontSize: 13 }}>{description}</Text>
          </div>
        )}
      </div>
    }
    style={{ padding: '48px 0' }}
  >
    {actionLabel && onAction && (
      <Button type="primary" icon={<PlusOutlined />} onClick={onAction}>
        {actionLabel}
      </Button>
    )}
  </Empty>
);
