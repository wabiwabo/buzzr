import React, { useEffect, useState } from 'react';
import { Row, Col, Card, List, Button, Tag, Typography, Space } from 'antd';
import {
  CarOutlined, EnvironmentOutlined, AlertOutlined,
  DollarOutlined, DeleteOutlined, ArrowRightOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as ReTooltip,
  ResponsiveContainer, Legend,
} from 'recharts';
import api from '../services/api';
import { PageHeader, StatCard, InfoTooltip } from '../components/common';
import { MapView } from '../components/map';
import { ActivityFeed } from '../components/feedback';
import type { MapMarker } from '../components/map';
import type { ActivityItem } from '../components/feedback/ActivityFeed';

const { Text } = Typography;

interface DashboardData {
  totalWasteTodayKg: number;
  activeDrivers: number;
  pendingComplaints: number;
  collectionRate: number;
}

interface AttentionItem {
  id: string;
  type: 'complaint' | 'payment' | 'tps';
  title: string;
  subtitle: string;
  severity: 'high' | 'medium' | 'low';
}

const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [overdueAmount, setOverdueAmount] = useState(0);
  const [attentionItems, setAttentionItems] = useState<AttentionItem[]>([]);
  const [mapMarkers, setMapMarkers] = useState<MapMarker[]>([]);
  const [wasteData, setWasteData] = useState<any[]>([]);
  const [activityItems, setActivityItems] = useState<ActivityItem[]>([]);

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [dashRes, overdueRes, tpsRes, wasteRes] = await Promise.allSettled([
        api.get('/reports/dashboard'),
        api.get('/payments/overdue'),
        api.get('/tps'),
        api.get('/reports/waste-volume'),
      ]);

      if (dashRes.status === 'fulfilled') {
        setDashboard(dashRes.value.data);
      }

      if (overdueRes.status === 'fulfilled') {
        const overdue = Array.isArray(overdueRes.value.data) ? overdueRes.value.data : [];
        setOverdueAmount(overdue.reduce((sum: number, p: any) => sum + Number(p.amount || 0), 0));

        const paymentAttention: AttentionItem[] = overdue.slice(0, 3).map((p: any) => ({
          id: p.id,
          type: 'payment' as const,
          title: `Retribusi ${p.user_name || p.user_id?.slice(0, 8)}`,
          subtitle: `Rp${Number(p.amount).toLocaleString('id-ID')}`,
          severity: 'medium' as const,
        }));
        setAttentionItems((prev) => [...prev.filter((i) => i.type !== 'payment'), ...paymentAttention]);
      }

      if (tpsRes.status === 'fulfilled') {
        const tpsList = Array.isArray(tpsRes.value.data) ? tpsRes.value.data : [];
        const markers: MapMarker[] = tpsList
          .filter((t: any) => t.latitude && t.longitude)
          .map((t: any) => ({
            id: t.id,
            lat: Number(t.latitude),
            lng: Number(t.longitude),
            type: 'tps' as const,
            label: t.name,
            status: t.status,
            detail: `${t.current_load_tons || 0}/${t.capacity_tons} ton`,
          }));
        setMapMarkers(markers);

        const fullTps: AttentionItem[] = tpsList
          .filter((t: any) => {
            const load = Number(t.current_load_tons || 0);
            const cap = Number(t.capacity_tons || 1);
            return cap > 0 && (load / cap) > 0.9;
          })
          .slice(0, 3)
          .map((t: any) => ({
            id: t.id,
            type: 'tps' as const,
            title: t.name,
            subtitle: `${Math.round((Number(t.current_load_tons) / Number(t.capacity_tons)) * 100)}% kapasitas`,
            severity: 'high' as const,
          }));
        setAttentionItems((prev) => [...prev.filter((i) => i.type !== 'tps'), ...fullTps]);
      }

      if (wasteRes.status === 'fulfilled') {
        const raw = Array.isArray(wasteRes.value.data) ? wasteRes.value.data : [];
        const byDate: Record<string, any> = {};
        raw.forEach((r: any) => {
          const date = r.date?.slice(0, 10) || 'unknown';
          if (!byDate[date]) byDate[date] = { date, organic: 0, inorganic: 0, b3: 0, recyclable: 0 };
          const key = r.category === 'organic' ? 'organic'
            : r.category === 'inorganic' ? 'inorganic'
            : r.category === 'b3' ? 'b3' : 'recyclable';
          byDate[date][key] += Number(r.total_kg || 0);
        });
        setWasteData(Object.values(byDate).sort((a: any, b: any) => a.date.localeCompare(b.date)));
      }
    } catch {
      // handled by individual results
    }
    setLoading(false);
  };

  const severityColors = { high: '#ff4d4f', medium: '#faad14', low: '#1677ff' };

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description="Pantau operasional persampahan secara real-time"
      />

      {/* Row 1: StatCards */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={4}>
          <StatCard
            title="Driver Aktif"
            value={dashboard?.activeDrivers ?? 0}
            prefix={<CarOutlined style={{ color: '#722ed1' }} />}
            navigateTo="/fleet"
            loading={loading}
          />
        </Col>
        <Col xs={24} sm={12} lg={5}>
          <StatCard
            title="TPS Penuh"
            value={mapMarkers.filter((m) => m.status === 'full').length}
            prefix={<EnvironmentOutlined style={{ color: '#ff4d4f' }} />}
            navigateTo="/tps"
            loading={loading}
            valueStyle={mapMarkers.some((m) => m.status === 'full') ? { color: '#ff4d4f' } : undefined}
          />
        </Col>
        <Col xs={24} sm={12} lg={5}>
          <StatCard
            title="Complaint Baru"
            value={dashboard?.pendingComplaints ?? 0}
            prefix={<AlertOutlined style={{ color: '#1677ff' }} />}
            navigateTo="/complaints"
            loading={loading}
          />
        </Col>
        <Col xs={24} sm={12} lg={5}>
          <StatCard
            title="Tunggakan"
            value={`Rp${overdueAmount.toLocaleString('id-ID')}`}
            prefix={<DollarOutlined style={{ color: '#faad14' }} />}
            navigateTo="/payments"
            loading={loading}
          />
        </Col>
        <Col xs={24} sm={12} lg={5}>
          <StatCard
            title="Volume Hari Ini"
            value={dashboard?.totalWasteTodayKg ?? 0}
            suffix="kg"
            prefix={<DeleteOutlined style={{ color: '#52c41a' }} />}
            loading={loading}
          />
        </Col>
      </Row>

      {/* Row 2: Map + Attention Queue */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} lg={14}>
          <MapView
            markers={mapMarkers}
            title="Peta Real-time"
            height={360}
            loading={loading}
          />
        </Col>
        <Col xs={24} lg={10}>
          <Card
            title={
              <span>
                Butuh Perhatian
                <InfoTooltip text="Item yang memerlukan tindakan segera" />
              </span>
            }
            className="glass-card"
            size="small"
            style={{ height: '100%' }}
            styles={{ body: { maxHeight: 360, overflowY: 'auto' } }}
          >
            {attentionItems.length === 0 && !loading ? (
              <div style={{ textAlign: 'center', padding: 24 }}>
                <Text type="secondary">Semua beres! Tidak ada yang memerlukan perhatian.</Text>
              </div>
            ) : (
              <List
                loading={loading}
                dataSource={attentionItems}
                renderItem={(item) => (
                  <List.Item
                    style={{ cursor: 'pointer', padding: '10px 0' }}
                    onClick={() => {
                      if (item.type === 'complaint') navigate('/complaints');
                      if (item.type === 'payment') navigate('/payments');
                      if (item.type === 'tps') navigate('/tps');
                    }}
                  >
                    <Space>
                      <div
                        style={{
                          width: 6,
                          height: 6,
                          borderRadius: '50%',
                          backgroundColor: severityColors[item.severity],
                        }}
                      />
                      <div>
                        <Text style={{ fontSize: 13 }}>{item.title}</Text>
                        <br />
                        <Text type="secondary" style={{ fontSize: 11 }}>{item.subtitle}</Text>
                      </div>
                    </Space>
                    <ArrowRightOutlined style={{ color: 'rgba(0,0,0,0.25)', fontSize: 12 }} />
                  </List.Item>
                )}
              />
            )}
          </Card>
        </Col>
      </Row>

      {/* Row 3: Trend Chart + Activity Feed */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} lg={14}>
          <Card title="Trend Volume Sampah" className="glass-card" size="small">
            {wasteData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={wasteData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <ReTooltip />
                  <Legend />
                  <Area type="monotone" dataKey="organic" name="Organik" stackId="1" fill="#52c41a" stroke="#52c41a" fillOpacity={0.6} />
                  <Area type="monotone" dataKey="inorganic" name="Anorganik" stackId="1" fill="#1677ff" stroke="#1677ff" fillOpacity={0.6} />
                  <Area type="monotone" dataKey="b3" name="B3" stackId="1" fill="#ff4d4f" stroke="#ff4d4f" fillOpacity={0.6} />
                  <Area type="monotone" dataKey="recyclable" name="Daur Ulang" stackId="1" fill="#faad14" stroke="#faad14" fillOpacity={0.6} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ textAlign: 'center', padding: 48 }}>
                <Text type="secondary">Tidak ada data volume sampah</Text>
              </div>
            )}
          </Card>
        </Col>
        <Col xs={24} lg={10}>
          <ActivityFeed items={activityItems} loading={loading} />
        </Col>
      </Row>

      {/* Row 4: Weekly Summary */}
      <Row gutter={[16, 16]}>
        <Col span={24}>
          <Card title="Ringkasan Mingguan" className="glass-card" size="small">
            <Row gutter={16}>
              {[
                { label: 'Collection Rate', value: dashboard?.collectionRate ?? 0, suffix: '%', color: '#52c41a' },
                { label: 'Complaint Pending', value: dashboard?.pendingComplaints ?? 0, suffix: '', color: '#1677ff' },
                { label: 'Volume Minggu Ini', value: dashboard?.totalWasteTodayKg ?? 0, suffix: ' kg', color: '#722ed1' },
              ].map((item, i) => (
                <Col key={i} xs={24} sm={8}>
                  <div style={{ textAlign: 'center', padding: '12px 0' }}>
                    <Text type="secondary" style={{ fontSize: 12 }}>{item.label}</Text>
                    <div style={{ fontSize: 28, fontWeight: 600, color: item.color }}>
                      {item.value}{item.suffix}
                    </div>
                  </div>
                </Col>
              ))}
            </Row>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default DashboardPage;
