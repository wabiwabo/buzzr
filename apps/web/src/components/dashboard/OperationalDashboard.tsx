import React, { useEffect, useState } from 'react';
import { MapPin, CheckCircle, Clock } from 'lucide-react';
import dayjs from 'dayjs';
import api from '../../services/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { StatCard } from '../common';

interface ScheduleRecord {
  id: string;
  route_name: string;
  schedule_type: string;
  scheduled_date: string | null;
  start_time: string;
  status: string;
  stop_count?: number;
}

interface ComplaintRecord {
  id: string;
  category: string;
  description: string;
  status: string;
  created_at: string;
}

interface OperationalDashboardProps {
  role: string;
}

export const OperationalDashboard: React.FC<OperationalDashboardProps> = ({ role }) => {
  const [schedules, setSchedules] = useState<ScheduleRecord[]>([]);
  const [complaints, setComplaints] = useState<ComplaintRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      const results = await Promise.allSettled([
        api.get('/schedules'),
        api.get('/complaints'),
      ]);
      if (results[0].status === 'fulfilled') {
        setSchedules(Array.isArray(results[0].value.data) ? results[0].value.data : []);
      }
      if (results[1].status === 'fulfilled') {
        setComplaints(
          (Array.isArray(results[1].value.data) ? results[1].value.data : [])
            .filter((c: ComplaintRecord) => ['submitted', 'assigned', 'in_progress'].includes(c.status))
            .slice(0, 5)
        );
      }
      setLoading(false);
    };
    fetch();
  }, []);

  const todaySchedules = schedules.filter((s) =>
    s.schedule_type === 'recurring' || s.scheduled_date === dayjs().format('YYYY-MM-DD')
  );

  const statusVariant = (status: string) => {
    if (status === 'in_progress') return 'bg-info/10 text-info border-info/20';
    if (status === 'completed') return 'bg-positive/10 text-positive border-positive/20';
    return 'bg-neutral/10 text-neutral border-neutral/20';
  };

  const statusLabel = (status: string) => {
    if (status === 'in_progress') return 'Dalam Proses';
    if (status === 'completed') return 'Selesai';
    return 'Menunggu';
  };

  return (
    <div>
      <div className="mb-6">
        <h4 className="text-lg font-semibold">Tugas Hari Ini</h4>
        <p className="text-sm text-muted-foreground">{dayjs().format('dddd, D MMMM YYYY')}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <StatCard title="Rute Hari Ini" value={todaySchedules.length} prefix={<MapPin className="h-4 w-4 text-info" />} loading={loading} />
        <StatCard title="TPS Dikunjungi" value={todaySchedules.reduce((sum, s) => sum + (s.stop_count || 0), 0)} prefix={<CheckCircle className="h-4 w-4 text-positive" />} loading={loading} />
        <StatCard title="Keluhan Ditugaskan" value={complaints.length} prefix={<Clock className="h-4 w-4 text-warning" />} loading={loading} />
      </div>

      <Card className="mb-6">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">Jadwal Hari Ini</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => <Skeleton key={i} className="h-10 w-full" />)}
            </div>
          ) : todaySchedules.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">Tidak ada jadwal hari ini</p>
          ) : (
            todaySchedules.map((s) => (
              <div key={s.id} className="flex items-center gap-4 py-3 border-b last:border-0">
                <span className="text-xs font-medium text-muted-foreground w-12 tabular-nums">{s.start_time}</span>
                <span className="flex-1 text-sm">{s.route_name}</span>
                <Badge variant="outline" className={statusVariant(s.status)}>
                  {statusLabel(s.status)}
                </Badge>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {complaints.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Keluhan Ditugaskan</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {loading ? (
              <div className="space-y-3">
                {[1, 2].map((i) => <Skeleton key={i} className="h-10 w-full" />)}
              </div>
            ) : (
              complaints.map((c) => (
                <div key={c.id} className="py-3 border-b last:border-0">
                  <p className="text-sm">{c.description?.slice(0, 80) || c.category}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    SLA: {Math.max(0, 72 - dayjs().diff(dayjs(c.created_at), 'hour'))} jam tersisa
                  </p>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};
