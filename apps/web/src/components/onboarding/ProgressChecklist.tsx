import React, { useState } from 'react';
import { Typography, Progress, Button } from 'antd';
import { CheckCircleFilled, RightOutlined, CloseOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

const { Text } = Typography;

export interface ChecklistItem {
  key: string;
  label: string;
  description: string;
  path: string;
  completed: boolean;
}

interface ProgressChecklistProps {
  items: ChecklistItem[];
  onDismiss: () => void;
  onItemClick?: (key: string) => void;
}

export const ProgressChecklist: React.FC<ProgressChecklistProps> = ({
  items,
  onDismiss,
  onItemClick,
}) => {
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState(true);
  const completedCount = items.filter((i) => i.completed).length;
  const pct = items.length > 0 ? Math.round((completedCount / items.length) * 100) : 0;

  if (!expanded) {
    return (
      <div
        onClick={() => setExpanded(true)}
        style={{
          padding: '8px 16px', cursor: 'pointer', borderTop: '1px solid #F3F4F6',
          display: 'flex', alignItems: 'center', gap: 8,
        }}
      >
        <Progress type="circle" percent={pct} size={24} strokeWidth={8} />
        <Text style={{ fontSize: 12 }}>Setup {completedCount}/{items.length}</Text>
      </div>
    );
  }

  return (
    <div style={{ borderTop: '1px solid #F3F4F6', padding: '12px 16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <Text strong style={{ fontSize: 13 }}>Setup Awal</Text>
        <Button type="text" size="small" icon={<CloseOutlined />} onClick={onDismiss} />
      </div>
      <Progress percent={pct} size="small" strokeColor="#2563EB" style={{ marginBottom: 8 }} />
      <Text type="secondary" style={{ fontSize: 11, display: 'block', marginBottom: 8 }}>
        {completedCount} dari {items.length} selesai
      </Text>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {items.map((item) => (
          <div
            key={item.key}
            onClick={() => {
              onItemClick?.(item.key);
              navigate(item.path);
            }}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '6px 8px', borderRadius: 6, cursor: 'pointer',
              background: item.completed ? '#F0FDF4' : 'transparent',
            }}
          >
            <CheckCircleFilled style={{ color: item.completed ? '#22C55E' : '#D1D5DB', fontSize: 14 }} />
            <div style={{ flex: 1 }}>
              <Text style={{ fontSize: 12, textDecoration: item.completed ? 'line-through' : 'none' }}>
                {item.label}
              </Text>
            </div>
            {!item.completed && <RightOutlined style={{ fontSize: 10, color: '#9CA3AF' }} />}
          </div>
        ))}
      </div>
    </div>
  );
};
