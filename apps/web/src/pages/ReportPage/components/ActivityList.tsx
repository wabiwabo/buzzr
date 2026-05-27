import React from 'react';
import dayjs from 'dayjs';
import { AlertCircle, Calendar, Wallet } from 'lucide-react';
import type { ActivityEvent } from '../types';

const ICONS: Record<string, React.ElementType> = {
  complaint: AlertCircle,
  schedule: Calendar,
  payment: Wallet,
};

const COLORS: Record<string, string> = {
  complaint: 'text-info',
  schedule: 'text-warning',
  payment: 'text-positive',
};

interface ActivityListProps {
  events: ActivityEvent[];
}

export const ActivityList: React.FC<ActivityListProps> = ({ events }) => {
  if (events.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-8">
        Tidak ada aktivitas dalam 7 hari terakhir
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {events.map((event, idx) => {
        const Icon = ICONS[event.type] || AlertCircle;
        const colorClass = COLORS[event.type] || 'text-muted-foreground';
        return (
          <div key={`${event.id}-${idx}`} className="flex items-start gap-3 pb-3 border-b last:border-0">
            <Icon className={`h-4 w-4 mt-0.5 shrink-0 ${colorClass}`} />
            <div className="flex-1 min-w-0">
              <p className="text-sm">{event.message}</p>
              <p className="text-xs text-muted-foreground tabular-nums mt-0.5">
                {dayjs(event.timestamp).format('DD MMM YYYY, HH:mm')}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
};
