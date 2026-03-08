import React, { useEffect, useState } from 'react';
import { Card, Typography, Progress } from 'antd';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import api from '../../services/api';

const { Text } = Typography;

interface DriverRecord {
  id: string;
  name: string;
  total_volume_kg: number;
}

interface DriverLeaderboardProps {
  loading?: boolean;
}

export const DriverLeaderboard: React.FC<DriverLeaderboardProps> = ({ loading: parentLoading }) => {
  const navigate = useNavigate();
  const [drivers, setDrivers] = useState<DriverRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await api.get('/reports/driver-performance', {
          params: {
            from: dayjs().subtract(7, 'day').format('YYYY-MM-DD'),
            to: dayjs().format('YYYY-MM-DD'),
          },
        });
        setDrivers(Array.isArray(res.data) ? res.data.slice(0, 5) : []);
      } catch { /* empty */ }
      setLoading(false);
    };
    fetch();
  }, []);

  const maxVolume = Math.max(...drivers.map((d) => Number(d.total_volume_kg || 0)), 1);

  return (
    <Card title="Top Driver" size="small" loading={parentLoading || loading}>
      {drivers.map((d, i) => (
        <div
          key={d.id}
          style={{
            display: 'flex', alignItems: 'center', gap: 12,
            padding: '8px 0',
            borderBottom: i < drivers.length - 1 ? '1px solid #F3F4F6' : 'none',
            cursor: 'pointer',
          }}
          onClick={() => navigate('/fleet')}
        >
          <Text style={{ width: 20, fontSize: 13, color: '#9CA3AF', textAlign: 'center' }}>
            {i + 1}
          </Text>
          <div style={{ flex: 1, minWidth: 0 }}>
            <Text style={{ fontSize: 13, display: 'block' }} ellipsis>{d.name}</Text>
            <Progress
              percent={Math.round((Number(d.total_volume_kg || 0) / maxVolume) * 100)}
              size="small"
              showInfo={false}
              strokeColor="#2563EB"
              style={{ margin: 0 }}
            />
          </div>
          <Text style={{ fontSize: 12, color: '#6B7280', flexShrink: 0 }}>
            {Number(d.total_volume_kg || 0).toLocaleString('id-ID')} kg
          </Text>
        </div>
      ))}
      {drivers.length === 0 && (
        <div style={{ padding: 24, textAlign: 'center' }}>
          <Text type="secondary">Belum ada data</Text>
        </div>
      )}
    </Card>
  );
};
