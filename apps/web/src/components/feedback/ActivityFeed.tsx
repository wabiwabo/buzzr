import React from 'react';
import {
  AlertTriangle, Car, DollarSign, CheckCircle, User, Clock,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/id';

dayjs.extend(relativeTime);
dayjs.locale('id');

export interface ActivityItem {
  id: string;
  type: 'complaint' | 'driver' | 'payment' | 'tps' | 'user' | 'schedule';
  message: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

const typeIcons: Record<string, React.ReactNode> = {
  complaint: <AlertTriangle className="h-3.5 w-3.5 text-info" />,
  driver: <Car className="h-3.5 w-3.5 text-purple-500" />,
  payment: <DollarSign className="h-3.5 w-3.5 text-positive" />,
  tps: <CheckCircle className="h-3.5 w-3.5 text-warning" />,
  user: <User className="h-3.5 w-3.5 text-cyan-500" />,
  schedule: <Clock className="h-3.5 w-3.5 text-pink-500" />,
};

interface ActivityFeedProps {
  items: ActivityItem[];
  loading?: boolean;
  onViewAll?: () => void;
  maxItems?: number;
}

export const ActivityFeed: React.FC<ActivityFeedProps> = ({
  items,
  loading = false,
  onViewAll,
  maxItems = 8,
}) => {
  const displayed = items.slice(0, maxItems);

  return (
    <Card className="h-full">
      <CardHeader className="pb-3 flex-row items-center justify-between">
        <CardTitle className="text-sm font-medium">Aktivitas Terbaru</CardTitle>
        {onViewAll && (
          <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={onViewAll}>
            Lihat semua
          </Button>
        )}
      </CardHeader>
      <CardContent className="max-h-[400px] overflow-y-auto">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-8 w-full" />)}
          </div>
        ) : (
          <div className="space-y-3">
            {displayed.map((item, i) => (
              <div key={item.id} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div className="mt-0.5">{typeIcons[item.type] || <Clock className="h-3.5 w-3.5" />}</div>
                  {i < displayed.length - 1 && <div className="w-px flex-1 bg-border mt-1" />}
                </div>
                <div className="pb-3">
                  <p className="text-sm">{item.message}</p>
                  <p className="text-xs text-muted-foreground">{dayjs(item.timestamp).fromNow()}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
