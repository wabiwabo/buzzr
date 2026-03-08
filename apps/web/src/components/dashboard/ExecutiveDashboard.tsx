import React, { useEffect, useState } from 'react';
import { Trash2, Car, MapPin, AlertTriangle } from 'lucide-react';
import dayjs from 'dayjs';
import api from '../../services/api';
import { StatCard } from '../common';
import { AttentionQueue } from './AttentionQueue';
import { WasteTrendChart } from './WasteTrendChart';
import { DriverLeaderboard } from './DriverLeaderboard';
import { AreaCollectionChart } from './AreaCollectionChart';

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

interface WasteDataRow {
  date: string;
  organic: number;
  inorganic: number;
  b3: number;
  recyclable: number;
}

interface AttentionItem {
  severity: 'critical' | 'warning' | 'info';
  message: string;
  detail?: string;
  path: string;
}

interface TpsRecord {
  id: string;
  name: string;
  status: string;
}

interface ComplaintRecord {
  id: string;
  status: string;
  category: string;
  created_at: string;
}

export const ExecutiveDashboard: React.FC = () => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [wasteData, setWasteData] = useState<WasteDataRow[]>([]);
  const [attentionItems, setAttentionItems] = useState<AttentionItem[]>([]);
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

      const items: AttentionItem[] = [];
      if (overdueRes.status === 'fulfilled') {
        const overdue = Array.isArray(overdueRes.value.data) ? overdueRes.value.data : [];
        if (overdue.length > 0) {
          items.push({ severity: 'warning', message: `${overdue.length} pembayaran jatuh tempo`, path: '/payments' });
        }
      }
      if (tpsRes.status === 'fulfilled') {
        const tps: TpsRecord[] = Array.isArray(tpsRes.value.data) ? tpsRes.value.data : [];
        tps.filter((t) => t.status === 'full').forEach((t) => {
          items.push({ severity: 'critical', message: `TPS ${t.name} penuh`, path: '/tps' });
        });
      }
      if (complaintRes.status === 'fulfilled') {
        const complaints: ComplaintRecord[] = Array.isArray(complaintRes.value.data) ? complaintRes.value.data : [];
        complaints
          .filter((c) => c.status === 'submitted')
          .slice(0, 5)
          .forEach((c) => {
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
      <div className="mb-6">
        <h4 className="text-lg font-semibold">{greeting}</h4>
        <p className="text-sm text-muted-foreground">{dayjs().format('dddd, D MMMM YYYY')}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          title="Volume Hari Ini"
          value={`${(current?.totalWasteTodayKg || 0).toLocaleString('id-ID')} kg`}
          prefix={<Trash2 className="h-4 w-4 text-positive" />}
          trend={trends ? { value: trends.wasteChange, label: 'vs minggu lalu' } : undefined}
          loading={loading}
          navigateTo="/analytics"
        />
        <StatCard
          title="Driver Aktif"
          value={current?.activeDrivers || 0}
          prefix={<Car className="h-4 w-4 text-info" />}
          trend={trends ? { value: trends.driverChange, label: 'vs minggu lalu' } : undefined}
          loading={loading}
          navigateTo="/fleet"
        />
        <StatCard
          title="Collection Rate"
          value={`${current?.collectionRate || 0}%`}
          prefix={<MapPin className="h-4 w-4 text-positive" />}
          loading={loading}
          navigateTo="/analytics"
        />
        <StatCard
          title="Keluhan Pending"
          value={current?.pendingComplaints || 0}
          prefix={<AlertTriangle className="h-4 w-4 text-negative" />}
          trend={trends ? { value: trends.complaintChange, label: 'vs minggu lalu' } : undefined}
          loading={loading}
          navigateTo="/complaints"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_0.7fr] gap-4 mb-6">
        <WasteTrendChart data={wasteData} loading={loading} />
        <AttentionQueue items={attentionItems} loading={loading} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_0.7fr] gap-4">
        <AreaCollectionChart loading={loading} />
        <DriverLeaderboard loading={loading} />
      </div>
    </div>
  );
};
