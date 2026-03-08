import React, { useState } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as ReTooltip,
  ResponsiveContainer, Legend, PieChart, Pie, Cell,
} from 'recharts';
import dayjs from 'dayjs';
import api from '../services/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { PageHeader, PageTransition } from '../components/common';
import { SmartTable } from '../components/data';
import { useTableState } from '../hooks/useTableState';
import { WASTE_COLORS, CHART_COLORS } from '../theme/tokens';

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
const COLORS = [CHART_COLORS[1], CHART_COLORS[0], CHART_COLORS[3], CHART_COLORS[2]];

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

  const driverColumns = [
    { title: 'Nama', dataIndex: 'name', sorter: true, width: 180 },
    { title: 'Total Trip', dataIndex: 'total_trips', sorter: true, width: 120 },
    { title: 'Checkpoint', dataIndex: 'total_checkpoints', sorter: true, width: 120 },
    {
      title: 'Volume (kg)', dataIndex: 'total_volume_kg', width: 140, sorter: true,
      render: (v: number) => Number(v || 0).toLocaleString('id-ID'),
    },
  ];

  const complaintPieData = complaintStats ? [
    { name: 'Selesai', value: complaintStats.resolved },
    { name: 'Ditolak', value: complaintStats.rejected },
    { name: 'Lainnya', value: complaintStats.total - complaintStats.resolved - complaintStats.rejected },
  ].filter((d) => d.value > 0) : [];

  return (
    <PageTransition>
    <div>
      <PageHeader
        title="Laporan & Analitik"
        description="Pantau performa operasional persampahan"
        breadcrumbs={[{ label: 'Dashboard', path: '/' }, { label: 'Laporan' }]}
        extra={
          <div className="flex items-center gap-2">
            <input
              type="date"
              className="flex h-8 rounded-md border border-input bg-background px-2 text-sm"
              value={dateRange[0]}
              onChange={(e) => setDateRange([e.target.value, dateRange[1]])}
            />
            <span className="text-sm text-muted-foreground">—</span>
            <input
              type="date"
              className="flex h-8 rounded-md border border-input bg-background px-2 text-sm"
              value={dateRange[1]}
              onChange={(e) => setDateRange([dateRange[0], e.target.value])}
            />
            <Button size="sm" onClick={handleFetch}>Tampilkan</Button>
          </div>
        }
      />

      <Tabs value={activeTab} onValueChange={handleTabChange} className="mb-4">
        <TabsList>
          <TabsTrigger value="waste">Volume Sampah</TabsTrigger>
          <TabsTrigger value="driver">Performa Driver</TabsTrigger>
          <TabsTrigger value="complaint">Statistik Laporan</TabsTrigger>
        </TabsList>
      </Tabs>

      {activeTab === 'waste' && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Trend Volume Sampah</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-[400px] w-full" />
            ) : wasteData.length > 0 ? (
              <ResponsiveContainer width="100%" height={400}>
                <AreaChart data={wasteData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <ReTooltip />
                  <Legend />
                  <Area type="monotone" dataKey="organic" name="Organik" stackId="1" fill={WASTE_COLORS.organic} stroke={WASTE_COLORS.organic} fillOpacity={0.6} />
                  <Area type="monotone" dataKey="inorganic" name="Anorganik" stackId="1" fill={WASTE_COLORS.inorganic} stroke={WASTE_COLORS.inorganic} fillOpacity={0.6} />
                  <Area type="monotone" dataKey="b3" name="B3" stackId="1" fill={WASTE_COLORS.b3} stroke={WASTE_COLORS.b3} fillOpacity={0.6} />
                  <Area type="monotone" dataKey="recyclable" name="Daur Ulang" stackId="1" fill={WASTE_COLORS.recyclable} stroke={WASTE_COLORS.recyclable} fillOpacity={0.6} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[400px]">
                <p className="text-sm text-muted-foreground">Klik "Tampilkan" untuk memuat data</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {activeTab === 'driver' && (
        <Card>
          <CardContent className="pt-6">
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
          </CardContent>
        </Card>
      )}

      {activeTab === 'complaint' && complaintStats && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="pt-4 pb-4">
                <p className="text-sm text-muted-foreground">Total Laporan</p>
                <p className="text-2xl font-semibold mt-1 tabular-nums">{complaintStats.total}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 pb-4">
                <p className="text-sm text-muted-foreground">Selesai</p>
                <p className="text-2xl font-semibold mt-1 tabular-nums text-positive">{complaintStats.resolved}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 pb-4">
                <p className="text-sm text-muted-foreground">Ditolak</p>
                <p className="text-2xl font-semibold mt-1 tabular-nums text-negative">{complaintStats.rejected}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 pb-4">
                <p className="text-sm text-muted-foreground">Rata-rata Resolusi</p>
                <p className="text-2xl font-semibold mt-1 tabular-nums">
                  {(complaintStats.avg_resolution_hours ?? 0).toFixed(1)} <span className="text-sm font-normal text-muted-foreground">jam</span>
                </p>
              </CardContent>
            </Card>
          </div>
          {complaintPieData.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Distribusi Status</CardTitle>
              </CardHeader>
              <CardContent>
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
              </CardContent>
            </Card>
          )}
        </>
      )}

      {activeTab === 'complaint' && !complaintStats && !loading && (
        <div className="flex items-center justify-center h-[300px]">
          <p className="text-sm text-muted-foreground">Klik "Tampilkan" untuk memuat statistik laporan</p>
        </div>
      )}
    </div>
    </PageTransition>
  );
};

export default ReportPage;
