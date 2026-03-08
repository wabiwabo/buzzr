import React from 'react';
import { Tag } from 'antd';
import { STATUS_COLORS as SEMANTIC } from '../../theme/colors';

const STATUS_COLOR_MAP: Record<string, string> = {
  // TPS
  active: SEMANTIC.positive,
  full: SEMANTIC.negative,
  maintenance: SEMANTIC.warning,
  // Complaint
  submitted: SEMANTIC.info,
  verified: '#06B6D4',
  assigned: SEMANTIC.warning,
  in_progress: '#EAB308',
  resolved: SEMANTIC.positive,
  rejected: SEMANTIC.negative,
  // Payment
  pending: SEMANTIC.warning,
  paid: SEMANTIC.positive,
  failed: SEMANTIC.negative,
  expired: SEMANTIC.neutral,
  refunded: '#8B5CF6',
  // Vehicle
  available: SEMANTIC.positive,
  in_use: SEMANTIC.info,
  // Schedule
  completed: SEMANTIC.positive,
  cancelled: SEMANTIC.negative,
  // User
  inactive: SEMANTIC.negative,
};

interface StatusBadgeProps {
  status: string;
  label?: string;
  dot?: boolean;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, label, dot = false }) => {
  const color = STATUS_COLOR_MAP[status] || SEMANTIC.neutral;
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
            backgroundColor: color,
          }}
        />
        <span>{displayLabel}</span>
      </span>
    );
  }

  return <Tag color={color}>{displayLabel}</Tag>;
};
