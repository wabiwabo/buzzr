import React, { useState } from 'react';
import { Card, DatePicker, Tabs, Row, Col, Statistic, Button, Space } from 'antd';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as ReTooltip,
  ResponsiveContainer, Legend, PieChart, Pie, Cell,
} from 'recharts';
import dayjs from 'dayjs';
import type { ColumnsType } from 'antd/es/table';
import api from '../services/api';
import { PageHeader } from '../components/common';
import { SmartTable } from '../components/data';
import { useTableState } from '../hooks/useTableState';

const { RangePicker } = DatePicker;

interface WasteRow {
  date: string;
  category: string;
  total_kg: number;
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
  organic: 'Organik', inorganic: 'Anorganik', b3: 'B3', recyclable: 'Daur Ulang',
};
const COLORS = ['#52c41a', '#1677ff', '#ff4d4f', '#faad14'];

const ReportPage: React.FC = () => {
  const driverTableState = useTableState<DriverPerf>({ searchFields: ['name'] });
  const [dateRange, setDateRange] = useState<[string, string]>([
    dayjs().subtract(30, 'day').format('YYYY-MM-DD'),
    dayjs().format('YYYY-MM-DD'),
  ]);
  const [activeTab, setActiveTab] = useState('waste');
  const [wasteData, setWasteData] = useState<any[]>([]);
  const [complaintStats, setComplaintStats] = useState<ComplaintStats | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchReport = async (tab: string, from: string, to: string) => {
    setLoading(true);
    try {
      if (tab === 'waste') {
        const res = await api.get('/reports/waste-volume', { params: { from, to } });
        const raw = Array.isArray(res.data) ? res.data : [];
        const byDate: Record<string, any> = {};
        raw.forEach((r: WasteRow) => {
          const date = r.date?.slice(0, 10) || 'unknown';
          if (!byDate[date]) byDate[date] = { date, organic: 0, inorganic: 0, b3: 0, recyclable: 0 };
          const key = r.category in categoryLabels ? r.category : 'recyclable';
          byDate[date][key] += Number(r.total_kg || 0);
        });
        setWasteData(Object.values(byDate).sort((a: any, b: any) => a.date.localeCompare(b.date)));
      } else if (tab === 'driver') {
        const res = await api.get('/reports/driver-performance', { params: { from, to } });
        driverTableState.setData(Array.isArray(res.data) ? res.data : []);
      } else if (tab === 'complaint') {
        const res = await api.get('/reports/complaints', { params: { from, to } });
        setComplaintStats(res.data);
      }
    } catch { /* silent */ }
    setLoading(false);
  };

  const handleFetch = () => fetchReport(activeTab, dateRange[0], dateRange[1]);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    fetchReport(tab, dateRange[0], dateRange[1]);
  };

  const driverColumns: ColumnsType<DriverPerf> = [
    { title: 'Nama', dataIndex: 'name', sorter: true, width: 180 },
    { title: 'Total Trip', dataIndex: 'total_trips', sorter: true, width: 120 },
    { title: 'Checkpoint', dataIndex: 'total_checkpoints', sorter: true, width: 120 },
    {
      title: 'Volume (kg)', dataIndex: 'total_volume_kg', width: 140, sorter: true,
      render: (v) => Number(v || 0).toLocaleString('id-ID'),
    },
  ];

  const complaintPieData = complaintStats ? [
    { name: 'Selesai', value: complaintStats.resolved },
    { name: 'Ditolak', value: complaintStats.rejected },
    { name: 'Lainnya', value: complaintStats.total - complaintStats.resolved - complaintStats.rejected },
  ].filter((d) => d.value > 0) : [];

  return (
    <div>
      <PageHeader
        title="Laporan & Analitik"
        description="Pantau performa operasional persampahan"
        breadcrumbs={[{ label: 'Dashboard', path: '/' }, { label: 'Laporan' }]}
        extra={
          <Space>
            <RangePicker
              defaultValue={[dayjs(dateRange[0]), dayjs(dateRange[1])]}
              onChange={(_, dates) => setDateRange(dates as [string, string])}
            />
            <Button type="primary" onClick={handleFetch}>Tampilkan</Button>
          </Space>
        }
      />

      <Tabs activeKey={activeTab} onChange={handleTabChange} items={[
        { key: 'waste', label: 'Volume Sampah' },
        { key: 'driver', label: 'Performa Driver' },
        { key: 'complaint', label: 'Statistik Laporan' },
      ]} style={{ marginBottom: 16 }} />

      {activeTab === 'waste' && (
        <Card title="Trend Volume Sampah" className="glass-card" size="small" loading={loading}>
          {wasteData.length > 0 ? (
            <ResponsiveContainer width="100%" height={400}>
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
            <div style={{ textAlign: 'center', padding: 48, color: 'rgba(0,0,0,0.45)' }}>
              Klik "Tampilkan" untuk memuat data
            </div>
          )}
        </Card>
      )}

      {activeTab === 'driver' && (
        <Card className="glass-card" size="small">
          <SmartTable<DriverPerf>
            tableState={driverTableState}
            columns={driverColumns}
            searchPlaceholder="Cari nama driver..."
            exportFileName="performa-driver"
            exportColumns={[
              { title: 'Nama', dataIndex: 'name' },
              { title: 'Total Trip', dataIndex: 'total_trips' },
              { title: 'Checkpoint', dataIndex: 'total_checkpoints' },
              { title: 'Volume (kg)', dataIndex: 'total_volume_kg' },
            ]}
            emptyTitle="Tidak ada data"
            emptyDescription="Klik 'Tampilkan' untuk memuat data performa driver"
          />
        </Card>
      )}

      {activeTab === 'complaint' && complaintStats && (
        <>
          <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
            <Col xs={24} sm={6}>
              <Card className="glass-card"><Statistic title="Total Laporan" value={complaintStats.total} /></Card>
            </Col>
            <Col xs={24} sm={6}>
              <Card className="glass-card"><Statistic title="Selesai" value={complaintStats.resolved} valueStyle={{ color: '#52c41a' }} /></Card>
            </Col>
            <Col xs={24} sm={6}>
              <Card className="glass-card"><Statistic title="Ditolak" value={complaintStats.rejected} valueStyle={{ color: '#ff4d4f' }} /></Card>
            </Col>
            <Col xs={24} sm={6}>
              <Card className="glass-card"><Statistic title="Rata-rata Resolusi" value={complaintStats.avg_resolution_hours ?? 0} suffix="jam" precision={1} /></Card>
            </Col>
          </Row>
          {complaintPieData.length > 0 && (
            <Card title="Distribusi Status" className="glass-card" size="small">
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie data={complaintPieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
                    {complaintPieData.map((_, idx) => (
                      <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                    ))}
                  </Pie>
                  <Legend />
                  <ReTooltip />
                </PieChart>
              </ResponsiveContainer>
            </Card>
          )}
        </>
      )}

      {activeTab === 'complaint' && !complaintStats && !loading && (
        <div style={{ textAlign: 'center', padding: 48, color: 'rgba(0,0,0,0.45)' }}>
          Klik "Tampilkan" untuk memuat statistik laporan
        </div>
      )}
    </div>
  );
};

export default ReportPage;
