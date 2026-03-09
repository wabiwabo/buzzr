import React, { useMemo, useState } from 'react';
import { X, Phone, MessageSquare } from 'lucide-react';
import { useLiveOpsStore } from '../store';
import { sendDriverMessage } from '../api';

const statusColors: Record<string, string> = {
  moving: 'text-emerald-600 bg-emerald-50',
  idle: 'text-yellow-600 bg-yellow-50',
  offline: 'text-gray-600 bg-gray-100',
  alert: 'text-red-600 bg-red-50',
};

const statusLabels: Record<string, string> = {
  moving: 'Bergerak',
  idle: 'Diam',
  offline: 'Offline',
  alert: 'Peringatan',
};

export const VehicleDetail: React.FC = () => {
  const { vehicles, activeSchedules, selectedVehicleId, selectVehicle } = useLiveOpsStore();
  const [sending, setSending] = useState(false);

  const vehicle = useMemo(
    () => vehicles.find((v) => v.id === selectedVehicleId),
    [vehicles, selectedVehicleId],
  );

  const schedule = useMemo(
    () => activeSchedules.find((s) => s.vehicle_id === selectedVehicleId),
    [activeSchedules, selectedVehicleId],
  );

  if (!vehicle) return null;

  const handleCallDriver = () => {
    if (vehicle.driver_phone) {
      window.open(`tel:${vehicle.driver_phone}`, '_self');
    }
  };

  const handleMessageDriver = async () => {
    if (!vehicle.driver_id) return;
    setSending(true);
    try {
      await sendDriverMessage({
        driverId: vehicle.driver_id,
        title: 'Pesan dari Dispatcher',
        body: 'Mohon segera konfirmasi status Anda.',
      });
    } catch (err) {
      console.error('Failed to send message:', err);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="absolute top-14 left-[calc(theme(spacing.72)+theme(spacing.4))] z-40 w-80 bg-white rounded-lg shadow-lg overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b">
        <div>
          <p className="text-sm font-semibold">{vehicle.plate_number}</p>
          <p className="text-xs text-gray-500">{vehicle.type}</p>
        </div>
        <button onClick={() => selectVehicle(null)} className="p-1 hover:bg-gray-200 rounded">
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Driver info */}
      <div className="px-4 py-3 border-b">
        <p className="text-xs text-gray-500">Pengemudi</p>
        <p className="text-sm font-medium">{vehicle.driver_name || 'Tidak ditugaskan'}</p>
        <div className="flex items-center gap-2 mt-2">
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[vehicle.status]}`}>
            {statusLabels[vehicle.status]}
          </span>
          {vehicle.speed != null && vehicle.status === 'moving' && (
            <span className="text-xs text-gray-500">{vehicle.speed.toFixed(1)} km/h</span>
          )}
        </div>
      </div>

      {/* Route progress */}
      {schedule && (
        <div className="px-4 py-3 border-b">
          <p className="text-xs text-gray-500">Rute Aktif</p>
          <p className="text-sm font-medium">{schedule.route_name}</p>
          {schedule.stops && (
            <div className="flex items-center gap-1 mt-2 overflow-x-auto">
              {schedule.stops.map((stop, i) => (
                <React.Fragment key={stop.id}>
                  <div className="flex flex-col items-center min-w-[40px]">
                    <div className="w-3 h-3 rounded-full border-2 border-blue-500 bg-white" />
                    <span className="text-[8px] text-gray-400 mt-0.5 truncate max-w-[50px]">
                      {stop.tps_name?.split(' ')[0] || `Stop ${stop.stop_order}`}
                    </span>
                  </div>
                  {i < schedule.stops!.length - 1 && (
                    <div className="flex-1 h-0.5 bg-blue-200 min-w-[12px]" />
                  )}
                </React.Fragment>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="px-4 py-3 space-y-2">
        <div className="flex items-center gap-2">
          {vehicle.driver_phone && (
            <button
              onClick={handleCallDriver}
              className="flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs bg-emerald-50 text-emerald-700 rounded-md hover:bg-emerald-100"
            >
              <Phone className="h-3.5 w-3.5" /> Telepon
            </button>
          )}
          {vehicle.driver_id && (
            <button
              onClick={handleMessageDriver}
              disabled={sending}
              className="flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs bg-blue-50 text-blue-700 rounded-md hover:bg-blue-100 disabled:opacity-50"
            >
              <MessageSquare className="h-3.5 w-3.5" /> {sending ? '...' : 'Pesan'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
