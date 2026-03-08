import React, { useEffect, useState } from 'react';
import { Row, Col, Typography } from 'antd';
import { CarOutlined, EnvironmentOutlined, AlertOutlined, DeleteOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import api from '../../services/api';
import { StatCard } from '../common';
import { AttentionQueue } from './AttentionQueue';
import { WasteTrendChart } from './WasteTrendChart';
import { DriverLeaderboard } from './DriverLeaderboard';
import { AreaCollectionChart } from './AreaCollectionChart';

const { Title, Text } = Typography;

interface DashboardData {
  current: {
    totalWasteTodayKg: number;
    activeDrivers: number;
    pendingComplaints: number;
    collectionRate: number;
  };
  trends: {
    wasteChange: number;
    driverChange: number;
    complaintChange: number;
  };
}

export const ExecutiveDashboard: React.FC = () => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [wasteData, setWasteData] = useState<any[]>([]);
  const [attentionItems, setAttentionItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      const [dashRes, wasteRes, overdueRes, tpsRes, complaintRes] = await Promise.allSettled([
        api.get('/reports/dashboard', { params: { compare: 'prev_week' } }),
        api.get('/reports/waste-volume'),
        api.get('/payments/overdue'),
        api.get('/tps'),
        api.get('/complaints'),
      ]);

      if (dashRes.status === 'fulfilled') setData(dashRes.value.data);
      if (wasteRes.status === 'fulfilled') setWasteData(Array.isArray(wasteRes.value.data) ? wasteRes.value.data : []);

      const items: any[] = [];
      if (overdueRes.status === 'fulfilled') {
        const overdue = Array.isArray(overdueRes.value.data) ? overdueRes.value.data : [];
        if (overdue.length > 0) {
          items.push({ severity: 'warning', message: `${overdue.length} pembayaran jatuh tempo`, path: '/payments' });
        }
      }
      if (tpsRes.status === 'fulfilled') {
        const tps = Array.isArray(tpsRes.value.data) ? tpsRes.value.data : [];
        tps.filter((t: any) => t.status === 'full').forEach((t: any) => {
          items.push({ severity: 'critical', message: `TPS ${t.name} penuh`, path: '/tps' });
        });
      }
      if (complaintRes.status === 'fulfilled') {
        const complaints = Array.isArray(complaintRes.value.data) ? complaintRes.value.data : [];
        complaints
          .filter((c: any) => c.status === 'submitted')
          .slice(0, 5)
          .forEach((c: any) => {
            const hoursOld = dayjs().diff(dayjs(c.created_at), 'hour');
            items.push({
              severity: hoursOld > 48 ? 'critical' : hoursOld > 24 ? 'warning' : 'info',
              message: `Keluhan: ${c.category || 'Lainnya'}`,
              detail: `${hoursOld} jam lalu`,
              path: '/complaints',
            });
          });
      }
      setAttentionItems(items);
      setLoading(false);
    };
    fetchAll();
  }, []);

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return 'Selamat pagi';
    if (h < 15) return 'Selamat siang';
    if (h < 18) return 'Selamat sore';
    return 'Selamat malam';
  })();

  const current = data?.current;
  const trends = data?.trends;

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Title level={4} style={{ margin: 0 }}>{greeting}</Title>
        <Text type="secondary">{dayjs().format('dddd, D MMMM YYYY')}</Text>
      </div>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            title="Volume Hari Ini"
            value={`${(current?.totalWasteTodayKg || 0).toLocaleString('id-ID')} kg`}
            prefix={<DeleteOutlined style={{ color: '#22C55E' }} />}
            trend={trends ? { value: trends.wasteChange, label: 'vs minggu lalu' } : undefined}
            loading={loading}
            navigateTo="/analytics"
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            title="Driver Aktif"
            value={current?.activeDrivers || 0}
            prefix={<CarOutlined style={{ color: '#3B82F6' }} />}
            trend={trends ? { value: trends.driverChange, label: 'vs minggu lalu' } : undefined}
            loading={loading}
            navigateTo="/fleet"
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            title="Collection Rate"
            value={`${current?.collectionRate || 0}%`}
            prefix={<EnvironmentOutlined style={{ color: '#22C55E' }} />}
            loading={loading}
            navigateTo="/analytics"
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            title="Keluhan Pending"
            value={current?.pendingComplaints || 0}
            prefix={<AlertOutlined style={{ color: '#EF4444' }} />}
            trend={trends ? { value: trends.complaintChange, label: 'vs minggu lalu' } : undefined}
            loading={loading}
            navigateTo="/complaints"
          />
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} lg={14}>
          <WasteTrendChart data={wasteData} loading={loading} />
        </Col>
        <Col xs={24} lg={10}>
          <AttentionQueue items={attentionItems} loading={loading} />
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={14}>
          <AreaCollectionChart loading={loading} />
        </Col>
        <Col xs={24} lg={10}>
          <DriverLeaderboard loading={loading} />
        </Col>
      </Row>
    </div>
  );
};
