import React, { useEffect, useState, useMemo } from 'react';
import dayjs from 'dayjs';
import { toast } from 'sonner';
import api from '../services/api';
import { PageHeader, PageTransition } from '../components/common';
import { WasteTrendChart, CollectionRateChart, StatusDonutChart } from '../components/charts';

const AnalyticsPage: React.FC = () => {
  const [dateRange, setDateRange] = useState<[string, string]>([
    dayjs().subtract(30, 'day').format('YYYY-MM-DD'),
    dayjs().format('YYYY-MM-DD'),
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
      toast.error('Gagal memuat data analytics');
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData(dateRange[0], dateRange[1]);
  }, [dateRange[0], dateRange[1]]);

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

      <div className="flex items-center gap-2 mb-6">
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
      </div>

      <h3 className="text-base font-semibold mb-4">Volume & Koleksi</h3>
      <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-4 mb-8">
        <WasteTrendChart data={wasteData} loading={loading} />
        <CollectionRateChart data={[]} loading={loading} />
      </div>

      <h3 className="text-base font-semibold mb-4">Keluhan & SLA</h3>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8">
        <StatusDonutChart
          title="Distribusi Status Keluhan"
          data={complaintStats}
          centerLabel="Total"
          loading={loading}
        />
      </div>
    </div>
    </PageTransition>
  );
};

export default AnalyticsPage;
