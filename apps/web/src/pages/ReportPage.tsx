import React, { useState } from 'react';
import { Card, DatePicker, Tabs, Table, Row, Col, Statistic, Spin, Alert, Button, Space } from 'antd';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import dayjs from 'dayjs';
import type { ColumnsType } from 'antd/es/table';
import api from '../services/api';

const { RangePicker } = DatePicker;

interface WasteRow {
  date: string;
  category: string;
  total_kg: number;
  total_records: number;
}

interface DriverPerf {
  id: string;
  name: string;
  total_trips: number;
  total_checkpoints: number;
  total_volume_kg: number;
}

interface ComplaintStats {
  total: number;
  resolved: number;
  rejected: number;
  avg_resolution_hours: number | null;
}

const categoryLabels: Record<string, string> = {
  organic: 'Organik',
  inorganic: 'Anorganik',
  b3: 'B3',
  recyclable: 'Daur Ulang',
};

const COLORS = ['#1890ff', '#52c41a', '#faad14', '#f5222d'];

export default function ReportPage() {
  const [dateRange, setDateRange] = useState<[string, string]>([
    dayjs().subtract(30, 'day').format('YYYY-MM-DD'),
    dayjs().format('YYYY-MM-DD'),
  ]);
  const [activeTab, setActiveTab] = useState('waste');
  const [wasteData, setWasteData] = useState<WasteRow[]>([]);
  const [driverData, setDriverData] = useState<DriverPerf[]>([]);
  const [complaintStats, setComplaintStats] = useState<ComplaintStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchReport = async (tab: string, from: string, to: string) => {
    try {
      setLoading(true);
      setError(null);
      if (tab === 'waste') {
        const res = await api.get('/reports/waste-volume', { params: { from, to } });
        setWasteData(res.data);
      } else if (tab === 'driver') {
        const res = await api.get('/reports/driver-performance', { params: { from, to } });
        setDriverData(res.data);
      } else if (tab === 'complaint') {
        const res = await api.get('/reports/complaints', { params: { from, to } });
        setComplaintStats(res.data);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Gagal memuat laporan');
    } finally {
      setLoading(false);
    }
  };

  const handleDateChange = (_: any, dates: [string, string]) => {
    setDateRange(dates);
  };

  const handleFetch = () => {
    fetchReport(activeTab, dateRange[0], dateRange[1]);
  };

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    fetchReport(tab, dateRange[0], dateRange[1]);
  };

  // Aggregate waste data by category for bar chart
  const wasteByCategory = Object.entries(
    wasteData.reduce<Record<string, number>>((acc, row) => {
      const cat = row.category || 'unknown';
      acc[cat] = (acc[cat] || 0) + Number(row.total_kg);
      return acc;
    }, {}),
  ).map(([category, total_kg]) => ({ category: categoryLabels[category] || category, total_kg }));

  const driverColumns: ColumnsType<DriverPerf> = [
    { title: 'Nama', dataIndex: 'name', key: 'name' },
    { title: 'Total Trip', dataIndex: 'total_trips', key: 'total_trips' },
    { title: 'Total Checkpoint', dataIndex: 'total_checkpoints', key: 'total_checkpoints' },
    {
      title: 'Volume (kg)', dataIndex: 'total_volume_kg', key: 'total_volume_kg',
      render: (v: number) => Number(v || 0).toLocaleString('id-ID'),
      sorter: (a, b) => Number(a.total_volume_kg || 0) - Number(b.total_volume_kg || 0),
      defaultSortOrder: 'descend',
    },
  ];

  // Complaint pie data
  const complaintPieData = complaintStats ? [
    { name: 'Selesai', value: complaintStats.resolved },
    { name: 'Ditolak', value: complaintStats.rejected },
    { name: 'Lainnya', value: complaintStats.total - complaintStats.resolved - complaintStats.rejected },
  ].filter((d) => d.value > 0) : [];

  const tabItems = [
    { key: 'waste', label: 'Volume Sampah' },
    { key: 'driver', label: 'Performa Driver' },
    { key: 'complaint', label: 'Statistik Laporan' },
  ];

  return (
    <>
      <Space style={{ marginBottom: 16 }}>
        <RangePicker
          defaultValue={[dayjs(dateRange[0]), dayjs(dateRange[1])]}
          onChange={handleDateChange}
        />
        <Button type="primary" onClick={handleFetch}>Tampilkan</Button>
      </Space>

      <Tabs activeKey={activeTab} onChange={handleTabChange} items={tabItems} style={{ marginBottom: 16 }} />

      {error && <Alert type="error" message={error} style={{ marginBottom: 16 }} />}

      {loading ? (
        <Spin size="large" style={{ display: 'block', margin: '50px auto' }} />
      ) : (
        <>
          {activeTab === 'waste' && (
            <Card title="Volume Sampah per Kategori">
              {wasteByCategory.length > 0 ? (
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={wasteByCategory}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="category" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="total_kg" fill="#1890ff" name="Total (kg)" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <Alert type="info" message="Tidak ada data untuk periode ini" />
              )}
            </Card>
          )}

          {activeTab === 'driver' && (
            <Card title="Performa Driver">
              <Table columns={driverColumns} dataSource={driverData} rowKey="id" pagination={{ pageSize: 10 }} />
            </Card>
          )}

          {activeTab === 'complaint' && complaintStats && (
            <>
              <Row gutter={16} style={{ marginBottom: 24 }}>
                <Col span={6}>
                  <Card><Statistic title="Total Laporan" value={complaintStats.total} /></Card>
                </Col>
                <Col span={6}>
                  <Card><Statistic title="Selesai" value={complaintStats.resolved} valueStyle={{ color: '#3f8600' }} /></Card>
                </Col>
                <Col span={6}>
                  <Card><Statistic title="Ditolak" value={complaintStats.rejected} valueStyle={{ color: '#cf1322' }} /></Card>
                </Col>
                <Col span={6}>
                  <Card>
                    <Statistic title="Rata-rata Resolusi" value={complaintStats.avg_resolution_hours ?? 0} suffix="jam"
                      precision={1} />
                  </Card>
                </Col>
              </Row>
              {complaintPieData.length > 0 && (
                <Card title="Distribusi Status Laporan">
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie data={complaintPieData} dataKey="value" nameKey="name" cx="50%" cy="50%"
                        outerRadius={100} label>
                        {complaintPieData.map((_, idx) => (
                          <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                        ))}
                      </Pie>
                      <Legend />
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </Card>
              )}
            </>
          )}

          {activeTab === 'complaint' && !complaintStats && (
            <Alert type="info" message="Klik 'Tampilkan' untuk memuat data" />
          )}
        </>
      )}
    </>
  );
}
