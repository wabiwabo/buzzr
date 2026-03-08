import React from 'react';
import { Typography } from 'antd';

const { Text } = Typography;

interface Option {
  value: string;
  label: string;
  icon?: React.ReactNode;
  description?: string;
}

interface VisualSelectorProps {
  options: Option[];
  value?: string;
  onChange?: (value: string) => void;
}

export const VisualSelector: React.FC<VisualSelectorProps> = ({ options, value, onChange }) => (
  <div style={{ display: 'flex', gap: 12 }}>
    {options.map((opt) => {
      const selected = value === opt.value;
      return (
        <div
          key={opt.value}
          onClick={() => onChange?.(opt.value)}
          style={{
            flex: 1,
            padding: '12px 16px',
            borderRadius: 8,
            border: `2px solid ${selected ? '#2563EB' : '#E5E7EB'}`,
            background: selected ? '#EFF6FF' : '#FAFAFA',
            cursor: 'pointer',
            textAlign: 'center',
            transition: 'all var(--duration-fast) ease',
          }}
        >
          {opt.icon && <div style={{ fontSize: 20, marginBottom: 4 }}>{opt.icon}</div>}
          <Text strong style={{ fontSize: 13, color: selected ? '#2563EB' : '#1F2937' }}>
            {opt.label}
          </Text>
          {opt.description && (
            <Text type="secondary" style={{ fontSize: 11, display: 'block' }}>
              {opt.description}
            </Text>
          )}
        </div>
      );
    })}
  </div>
);
