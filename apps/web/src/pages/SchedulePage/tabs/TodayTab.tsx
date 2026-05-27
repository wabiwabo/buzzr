import React, { useMemo } from 'react';
import { Clock, Truck, User as UserIcon } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { StatusBadge } from '@/components/common';
import { useSchedulePageStore, computeAnalytics } from '../store';
import { updateScheduleStatus } from '../api';
import { ScheduleKpiBar } from '../components/ScheduleKpiBar';
import type { Schedule } from '../types';
import { TYPE_LABELS, SCHEDULE_STATUS_LABELS } from '../types';

const STATUS_GROUPS: { id: string; title: string }[] = [
  { id: 'pending', title: 'Menunggu' },
  { id: 'in_progress', title: 'Berjalan' },
  { id: 'completed', title: 'Selesai' },
  { id: 'cancelled', title: 'Dibatalkan' },
];

export const TodayTab: React.FC = () => {
  const { todaySchedules, isLoading, invalidateData, selectSchedule, setActiveTab } = useSchedulePageStore();
  const analytics = useMemo(() => computeAnalytics(todaySchedules), [todaySchedules]);
  const inProgressCount = analytics.byStatus.find((b) => b.status === 'in_progress')?.count || 0;

  const grouped = useMemo(() => {
    const m = new Map<string, Schedule[]>();
    for (const g of STATUS_GROUPS) m.set(g.id, []);
    for (const s of todaySchedules) {
      const arr = m.get(s.status) || [];
      arr.push(s);
      m.set(s.status, arr);
    }
    return m;
  }, [todaySchedules]);

  const handleStatusChange = async (id: string, status: string) => {
    try {
      await updateScheduleStatus(id, status);
      toast.success('Status diperbarui');
      invalidateData();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Gagal memperbarui status');
    }
  };

  const handleCardClick = (id: string) => {
    selectSchedule(id);
    setActiveTab('kelola');
  };

  return (
    <div className="space-y-4">
      <ScheduleKpiBar
        todayCount={analytics.todayCount}
        inProgressCount={inProgressCount}
        completedTodayCount={analytics.completedTodayCount}
        onTimePct={analytics.onTimePct}
        loading={isLoading}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {STATUS_GROUPS.map((group) => {
          const items = grouped.get(group.id) || [];
          return (
            <div key={group.id} className="space-y-2">
              <div className="flex items-center gap-2 px-1">
                <h3 className="text-sm font-semibold">{group.title}</h3>
                <Badge variant="secondary" className="text-xs">{items.length}</Badge>
              </div>
              <div className="space-y-2 min-h-[100px]">
                {items.length === 0 && (
                  <p className="text-xs text-muted-foreground text-center py-4">Kosong</p>
                )}
                {items.map((s) => (
                  <Card key={s.id} className="cursor-pointer hover:bg-muted/30 transition-colors"
                    onClick={() => handleCardClick(s.id)}>
                    <CardContent className="p-3 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-sm font-medium line-clamp-1">{s.route_name}</span>
                        <StatusBadge status={s.status} />
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1 tabular-nums">
                          <Clock className="h-3 w-3" />
                          {(s.start_time || '').slice(0, 5)}
                        </span>
                        {s.driver_name && (
                          <span className="flex items-center gap-1 truncate">
                            <UserIcon className="h-3 w-3" />
                            {s.driver_name}
                          </span>
                        )}
                        {s.vehicle_plate && (
                          <span className="flex items-center gap-1 font-mono">
                            <Truck className="h-3 w-3" />
                            {s.vehicle_plate}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <Badge variant="outline" className="text-[10px]">
                          {TYPE_LABELS[s.schedule_type] || s.schedule_type}
                        </Badge>
                        {s.stop_count != null && (
                          <span className="text-muted-foreground">{s.stop_count} perhentian</span>
                        )}
                      </div>
                      {/* Quick actions per status */}
                      {s.status === 'pending' && (
                        <Button size="sm" variant="outline" className="w-full text-xs h-7"
                          onClick={(e) => { e.stopPropagation(); handleStatusChange(s.id, 'in_progress'); }}>
                          Mulai
                        </Button>
                      )}
                      {s.status === 'in_progress' && (
                        <Button size="sm" variant="outline" className="w-full text-xs h-7"
                          onClick={(e) => { e.stopPropagation(); handleStatusChange(s.id, 'completed'); }}>
                          Tandai Selesai
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
