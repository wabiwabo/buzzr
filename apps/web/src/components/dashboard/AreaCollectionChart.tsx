import React, { useEffect, useState } from 'react';
import { Card, Typography } from 'antd';
import api from '../../services/api';
import { ProgressRing } from '../common';

const { Text } = Typography;

interface PerformanceData {
  collectionRate: number;
  slaCompliance: number;
  tpsCapacity: number;
}

interface AreaCollectionChartProps {
  loading?: boolean;
}

export const AreaCollectionChart: React.FC<AreaCollectionChartProps> = ({ loading: parentLoading }) => {
  const [data, setData] = useState<PerformanceData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await api.get('/reports/dashboard');
        if (res.data?.current) {
          const tps = await api.get('/tps').catch(() => ({ data: [] }));
          const tpsList = Array.isArray(tps.data) ? tps.data : [];
          const totalCap = tpsList.reduce((s: number, t: any) => s + Number(t.capacity_tons || 0), 0);
          const totalLoad = tpsList.reduce((s: number, t: any) => s + Number(t.current_load_tons || 0), 0);
          setData({
            collectionRate: res.data.current.collectionRate || 0,
            slaCompliance: 0,
            tpsCapacity: totalCap > 0 ? Math.round((totalLoad / totalCap) * 100) : 0,
          });
        }
      } catch { /* silent */ }
      setLoading(false);
    };
    fetch();
  }, []);

  const isLoading = parentLoading || loading;

  return (
    <Card
      title="Ringkasan Performa"
      size="small"
      loading={isLoading}
      extra={!data && !isLoading ? <Text type="secondary" style={{ fontSize: 11 }}>Data belum tersedia</Text> : undefined}
    >
      <div style={{ display: 'flex', justifyContent: 'space-around', padding: '24px 0' }}>
        <ProgressRing value={data?.collectionRate ?? 0} label="Collection Rate" />
        <ProgressRing value={data?.slaCompliance ?? 0} label="SLA Compliance" />
        <ProgressRing value={data?.tpsCapacity ?? 0} label="Kapasitas TPS" />
      </div>
    </Card>
  );
};
