import React, { useEffect, useState, useMemo } from 'react';
import { Row, Col, DatePicker, Space, Typography, message } from 'antd';
import dayjs, { Dayjs } from 'dayjs';
import api from '../services/api';
import { PageHeader, PageTransition } from '../components/common';
import { WasteTrendChart, CollectionRateChart, StatusDonutChart } from '../components/charts';

const { RangePicker } = DatePicker;
const { Text } = Typography;

const AnalyticsPage: React.FC = () => {
  const [dateRange, setDateRange] = useState<[Dayjs, Dayjs]>([
    dayjs().subtract(30, 'day'),
    dayjs(),
  ]);
  const [wasteRaw, setWasteRaw] = useState<Array<{ date: string; category: string; total_kg: number }>>([]);
  const [complaintStats, setComplaintStats] = useState<Array<{ name: string; value: number; color?: string }>>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async (from: string, to: string) => {
    setLoading(true);
    try {
      const [wasteRes, complaintRes] = await Promise.allSettled([
        api.get('/reports/waste-volume', { params: { from, to } }),
        api.get('/complaints', { params: { from, to } }),
      ]);

      if (wasteRes.status === 'fulfilled') {
        setWasteRaw(Array.isArray(wasteRes.value.data) ? wasteRes.value.data : []);
      }

      if (complaintRes.status === 'fulfilled') {
        const complaints: Array<{ status: string }> = Array.isArray(complaintRes.value.data) ? complaintRes.value.data : [];
        const statusCounts: Record<string, number> = {};
        complaints.forEach((c) => {
          statusCounts[c.status] = (statusCounts[c.status] || 0) + 1;
        });
        const statusLabels: Record<string, string> = {
          submitted: 'Baru', verified: 'Terverifikasi', assigned: 'Ditugaskan',
          in_progress: 'Dalam Proses', resolved: 'Selesai', rejected: 'Ditolak',
        };
        const statusColors: Record<string, string> = {
          submitted: '#3B82F6', verified: '#06B6D4', assigned: '#F59E0B',
          in_progress: '#EAB308', resolved: '#22C55E', rejected: '#EF4444',
        };
        setComplaintStats(
          Object.entries(statusCounts).map(([status, value]) => ({
            name: statusLabels[status] || status,
            value,
            color: statusColors[status],
          }))
        );
      }
    } catch {
      message.error('Gagal memuat data analytics');
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData(dateRange[0].format('YYYY-MM-DD'), dateRange[1].format('YYYY-MM-DD'));
  }, [dateRange[0].valueOf(), dateRange[1].valueOf()]);

  const wasteData = useMemo(() => {
    const byDate: Record<string, { date: string; organic: number; inorganic: number; b3: number; recyclable: number }> = {};
    wasteRaw.forEach((r) => {
      const date = r.date?.slice(0, 10) || 'unknown';
      if (!byDate[date]) byDate[date] = { date, organic: 0, inorganic: 0, b3: 0, recyclable: 0 };
      const key = (['organic', 'inorganic', 'b3', 'recyclable'] as const).find((k) => k === r.category) || 'recyclable';
      byDate[date][key] += Number(r.total_kg || 0);
    });
    return Object.values(byDate).sort((a, b) => a.date.localeCompare(b.date));
  }, [wasteRaw]);

  return (
    <PageTransition>
    <div>
      <PageHeader
        title="Analytics Hub"
        description="Analisis data operasional persampahan"
        breadcrumbs={[{ label: 'Dashboard', path: '/' }, { label: 'Analytics' }]}
      />

      <Space style={{ marginBottom: 24 }}>
        <RangePicker
          value={dateRange}
          onChange={(dates) => {
            if (dates && dates[0] && dates[1]) {
              setDateRange([dates[0], dates[1]]);
            }
          }}
          format="DD MMM YYYY"
        />
      </Space>

      <Text strong style={{ fontSize: 16, display: 'block', marginBottom: 16 }}>Volume & Koleksi</Text>
      <Row gutter={[16, 16]} style={{ marginBottom: 32 }}>
        <Col xs={24} lg={16}>
          <WasteTrendChart data={wasteData} loading={loading} />
        </Col>
        <Col xs={24} lg={8}>
          <CollectionRateChart data={[]} loading={loading} />
        </Col>
      </Row>

      <Text strong style={{ fontSize: 16, display: 'block', marginBottom: 16 }}>Keluhan & SLA</Text>
      <Row gutter={[16, 16]} style={{ marginBottom: 32 }}>
        <Col xs={24} lg={8}>
          <StatusDonutChart
            title="Distribusi Status Keluhan"
            data={complaintStats}
            centerLabel="Total"
            loading={loading}
          />
        </Col>
      </Row>
    </div>
    </PageTransition>
  );
};

export default AnalyticsPage;
