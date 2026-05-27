import React from 'react';
import { MapPin } from 'lucide-react';
import type { ScheduleStop } from '../types';

interface ScheduleStopsProps {
  stops: ScheduleStop[];
}

export const ScheduleStops: React.FC<ScheduleStopsProps> = ({ stops }) => {
  if (stops.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-4">
        Tidak ada perhentian
      </p>
    );
  }

  return (
    <div className="space-y-0">
      {stops.map((stop, idx) => {
        const isLast = idx === stops.length - 1;
        return (
          <div key={stop.id} className="flex gap-3">
            <div className="flex flex-col items-center">
              <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-xs font-semibold text-primary tabular-nums">
                {stop.stop_order}
              </div>
              {!isLast && <div className="w-0.5 flex-1 bg-border min-h-[16px] my-1" />}
            </div>
            <div className="flex-1 pb-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-1.5 min-w-0">
                  <MapPin className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  <span className="text-sm font-medium truncate">{stop.tps_name || '—'}</span>
                </div>
                {stop.estimated_arrival && (
                  <span className="text-xs text-muted-foreground tabular-nums shrink-0">
                    {stop.estimated_arrival.slice(0, 5)}
                  </span>
                )}
              </div>
              {stop.tps_address && (
                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                  {stop.tps_address}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
