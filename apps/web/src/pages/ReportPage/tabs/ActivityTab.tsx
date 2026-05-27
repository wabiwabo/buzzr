import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { fetchActivityFeed } from '../api';
import { ActivityList } from '../components/ActivityList';
import type { ActivityEvent } from '../types';

export const ActivityTab: React.FC = () => {
  const [events, setEvents] = useState<ActivityEvent[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchActivityFeed(50)
      .then((d) => { if (!cancelled) setEvents(d); })
      .catch((err) => {
        if (!cancelled) toast.error(err?.response?.data?.message || 'Gagal memuat aktivitas');
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium">
          Aktivitas Terbaru ({events.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
          </div>
        ) : (
          <ActivityList events={events} />
        )}
      </CardContent>
    </Card>
  );
};
