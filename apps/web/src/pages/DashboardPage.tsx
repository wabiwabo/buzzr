import React, { useEffect, useState } from 'react';
import { Row, Col, Card, Statistic, Spin, Alert } from 'antd';
import { BarChartOutlined, CarOutlined, AlertOutlined, DollarOutlined } from '@ant-design/icons';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import api from '../services/api';

interface DashboardSummary {
  totalWasteTodayKg: number;
  activeDrivers: number;
  pendingComplaints: number;
  collectionRate: number;
}

interface WasteDataPoint {
  date: string;
  total_kg: number;
  category?: string;
}

export default function DashboardPage() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [wasteData, setWasteData] = useState<WasteDataPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const fromDate = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0];
        const toDate = new Date().toISOString().split('T')[0];
        const [summaryRes, wasteRes] = await Promise.all([
          api.get('/reports/dashboard'),
          api.get('/reports/waste-volume', { params: { from: fromDate, to: toDate } }),
        ]);
        setSummary(summaryRes.data);
        // Aggregate waste data by date (sum across categories)
        const byDate: Record<string, number> = {};
        (wasteRes.data as WasteDataPoint[]).forEach((row) => {
          const d = row.date;
          byDate[d] = (byDate[d] || 0) + Number(row.total_kg);
        });
        setWasteData(Object.entries(byDate).map(([date, total_kg]) => ({ date, total_kg })));
      } catch (err: any) {
        setError(err.response?.data?.message || 'Gagal memuat data dashboard');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <Spin size="large" style={{ display: 'block', margin: '100px auto' }} />;
  if (error) return <Alert type="error" message={error} />;

  return (
    <>
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card>
            <Statistic title="Sampah Hari Ini" value={summary?.totalWasteTodayKg ?? 0} suffix="kg" prefix={<BarChartOutlined />} />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="Driver Aktif" value={summary?.activeDrivers ?? 0} prefix={<CarOutlined />} />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="Laporan Pending" value={summary?.pendingComplaints ?? 0} prefix={<AlertOutlined />} />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="Tingkat Koleksi" value={summary?.collectionRate ?? 0} suffix="%" prefix={<DollarOutlined />} />
          </Card>
        </Col>
      </Row>
      <Card title="Volume Sampah (7 Hari Terakhir)">
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={wasteData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="total_kg" stroke="#1890ff" name="Total (kg)" />
          </LineChart>
        </ResponsiveContainer>
      </Card>
    </>
  );
}
