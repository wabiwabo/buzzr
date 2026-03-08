import React from 'react';
import { Tag } from 'antd';

const STATUS_COLORS: Record<string, string> = {
  // TPS
  active: 'green',
  full: 'red',
  maintenance: 'orange',
  // Complaint
  submitted: 'blue',
  verified: 'cyan',
  assigned: 'orange',
  in_progress: 'gold',
  resolved: 'green',
  rejected: 'red',
  // Payment
  pending: 'orange',
  paid: 'green',
  failed: 'red',
  expired: 'default',
  refunded: 'purple',
  // Vehicle
  available: 'green',
  in_use: 'blue',
  // Schedule
  completed: 'green',
  cancelled: 'red',
  // User
  inactive: 'red',
};

interface StatusBadgeProps {
  status: string;
  label?: string;
  dot?: boolean;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, label, dot = false }) => {
  const color = STATUS_COLORS[status] || 'default';
  const displayLabel = label || status.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

  if (dot) {
    return (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
        <span
          className={status === 'active' ? 'status-dot-active' : undefined}
          style={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            backgroundColor: color === 'default' ? '#d9d9d9' : undefined,
            background: color !== 'default' ? `var(--ant-color-${color === 'green' ? 'success' : color === 'red' ? 'error' : color === 'orange' ? 'warning' : 'primary'})` : undefined,
          }}
        />
        <span>{displayLabel}</span>
      </span>
    );
  }

  return <Tag color={color}>{displayLabel}</Tag>;
};
