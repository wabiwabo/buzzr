import React, { useMemo } from 'react';
import { useLiveOpsStore } from '../store';

export const RouteTimeline: React.FC = () => {
  const { activeSchedules, selectedVehicleId } = useLiveOpsStore();

  const schedule = useMemo(
    () => activeSchedules.find((s) => s.vehicle_id === selectedVehicleId),
    [activeSchedules, selectedVehicleId],
  );

  if (!schedule || !schedule.stops || schedule.stops.length === 0) return null;

  return (
    <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-30 bg-white rounded-lg shadow-lg px-4 py-3 max-w-lg">
      <p className="text-xs text-gray-500 mb-2">
        {schedule.route_name} — {schedule.driver_name}
      </p>
      <div className="flex items-center gap-0">
        {schedule.stops.map((stop, i) => (
          <React.Fragment key={stop.id}>
            <div className="flex flex-col items-center">
              <div className="w-4 h-4 rounded-full border-2 border-blue-500 bg-white flex items-center justify-center">
                <span className="text-[8px] font-bold text-blue-500">{stop.stop_order}</span>
              </div>
              <span className="text-[8px] text-gray-400 mt-1 max-w-[60px] truncate text-center">
                {stop.tps_name || `Stop ${stop.stop_order}`}
              </span>
              {stop.estimated_arrival && (
                <span className="text-[7px] text-gray-300">{stop.estimated_arrival}</span>
              )}
            </div>
            {i < schedule.stops!.length - 1 && (
              <div className="flex-1 h-0.5 bg-blue-200 min-w-[20px] mt-[-12px]" />
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};
