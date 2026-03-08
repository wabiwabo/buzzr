import React from 'react';
import { Card, Typography } from 'antd';
import { useNavigate } from 'react-router-dom';
import { SEVERITY_COLORS } from '../../theme/colors';

const { Text } = Typography;

interface AttentionItem {
  severity: 'critical' | 'warning' | 'info';
  message: string;
  detail?: string;
  path: string;
}

interface AttentionQueueProps {
  items: AttentionItem[];
  loading?: boolean;
}

export const AttentionQueue: React.FC<AttentionQueueProps> = ({ items, loading }) => {
  const navigate = useNavigate();

  return (
    <Card
      title={<span>Perlu Perhatian <Text type="secondary" style={{ fontWeight: 400 }}>({items.length})</Text></span>}
      size="small"
      loading={loading}
      styles={{ body: { padding: 0, maxHeight: 380, overflowY: 'auto' } }}
    >
      {items.length === 0 ? (
        <div style={{ padding: 48, textAlign: 'center' }}>
          <Text type="secondary">Tidak ada masalah saat ini</Text>
        </div>
      ) : (
        items.map((item, i) => (
          <div
            key={i}
            onClick={() => navigate(item.path)}
            style={{
              padding: '12px 16px',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              cursor: 'pointer',
              borderBottom: '1px solid #F3F4F6',
              transition: 'background var(--duration-instant) ease',
            }}
            className="attention-queue-item"
          >
            <div style={{
              width: 8, height: 8, borderRadius: '50%',
              background: SEVERITY_COLORS[item.severity],
              flexShrink: 0,
            }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <Text style={{ fontSize: 13, display: 'block' }} ellipsis>{item.message}</Text>
              {item.detail && (
                <Text type="secondary" style={{ fontSize: 11 }}>{item.detail}</Text>
              )}
            </div>
          </div>
        ))
      )}
    </Card>
  );
};
