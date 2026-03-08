import React from 'react';
import { Card } from 'antd';
import { ProgressRing } from '../common';

interface AreaCollectionChartProps {
  loading?: boolean;
}

export const AreaCollectionChart: React.FC<AreaCollectionChartProps> = ({ loading }) => {
  return (
    <Card title="Ringkasan Performa" size="small" loading={loading}>
      <div style={{ display: 'flex', justifyContent: 'space-around', padding: '24px 0' }}>
        <ProgressRing value={87} label="Collection Rate" />
        <ProgressRing value={92} label="SLA Compliance" />
        <ProgressRing value={65} label="Kapasitas TPS" />
      </div>
    </Card>
  );
};
