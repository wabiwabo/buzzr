import React, { useMemo } from 'react';
import { Search, ChevronLeft, ChevronRight, Truck } from 'lucide-react';
import { useLiveOpsStore } from '../store';
import type { VehicleWithStatus } from '../types';

const statusDot: Record<string, string> = {
  moving: 'bg-emerald-500',
  idle: 'bg-yellow-500',
  offline: 'bg-gray-400',
  alert: 'bg-red-500',
};

const statusLabel: Record<string, string> = {
  moving: 'Bergerak',
  idle: 'Diam',
  offline: 'Offline',
  alert: 'Peringatan',
};

export const VehiclePanel: React.FC = () => {
  const {
    vehicles,
    selectedVehicleId,
    selectVehicle,
    vehicleSearch,
    setVehicleSearch,
    isVehiclePanelOpen,
    toggleVehiclePanel,
  } = useLiveOpsStore();

  const filtered = useMemo(() => {
    if (!vehicleSearch) return vehicles;
    const q = vehicleSearch.toLowerCase();
    return vehicles.filter(
      (v) =>
        v.plate_number.toLowerCase().includes(q) ||
        (v.driver_name && v.driver_name.toLowerCase().includes(q)),
    );
  }, [vehicles, vehicleSearch]);

  // Sort: moving first, then idle, then offline
  const sorted = useMemo(() => {
    const order: Record<string, number> = { alert: 0, moving: 1, idle: 2, offline: 3 };
    return [...filtered].sort((a, b) => (order[a.status] ?? 9) - (order[b.status] ?? 9));
  }, [filtered]);

  if (!isVehiclePanelOpen) {
    return (
      <button
        onClick={toggleVehiclePanel}
        className="absolute top-16 left-2 z-40 bg-white rounded-lg shadow-lg p-2 hover:bg-gray-50"
        title="Buka panel kendaraan"
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    );
  }

  return (
    <div className="absolute top-14 left-2 bottom-2 z-40 w-72 bg-white rounded-lg shadow-lg flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b">
        <div className="flex items-center gap-2">
          <Truck className="h-4 w-4 text-gray-600" />
          <span className="text-sm font-semibold">Kendaraan</span>
          <span className="text-xs text-gray-400">({vehicles.length})</span>
        </div>
        <button onClick={toggleVehiclePanel} className="p-1 hover:bg-gray-100 rounded">
          <ChevronLeft className="h-4 w-4" />
        </button>
      </div>

      {/* Search */}
      <div className="px-3 py-2 border-b">
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
          <input
            type="text"
            placeholder="Cari plat / pengemudi..."
            value={vehicleSearch}
            onChange={(e) => setVehicleSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Vehicle list */}
      <div className="flex-1 overflow-y-auto">
        {sorted.map((v) => (
          <button
            key={v.id}
            onClick={() => selectVehicle(v.id === selectedVehicleId ? null : v.id)}
            className={`w-full text-left px-3 py-2.5 border-b border-gray-50 hover:bg-gray-50 transition-colors ${
              v.id === selectedVehicleId ? 'bg-blue-50 border-l-2 border-l-blue-500' : ''
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">{v.plate_number}</span>
              <div className="flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${statusDot[v.status]}`} />
                <span className="text-[10px] text-gray-500">{statusLabel[v.status]}</span>
              </div>
            </div>
            <div className="flex items-center justify-between mt-0.5">
              <span className="text-xs text-gray-500">{v.driver_name || 'Tanpa pengemudi'}</span>
              {v.speed != null && v.status === 'moving' && (
                <span className="text-[10px] text-gray-400">{v.speed.toFixed(0)} km/h</span>
              )}
            </div>
          </button>
        ))}
        {sorted.length === 0 && (
          <div className="flex items-center justify-center h-20 text-xs text-gray-400">
            Tidak ada kendaraan ditemukan
          </div>
        )}
      </div>

      {/* Status summary */}
      <div className="px-3 py-2 border-t bg-gray-50 flex items-center gap-3 text-[10px] text-gray-500">
        <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> {vehicles.filter((v) => v.status === 'moving').length}</span>
        <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-yellow-500" /> {vehicles.filter((v) => v.status === 'idle').length}</span>
        <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-gray-400" /> {vehicles.filter((v) => v.status === 'offline').length}</span>
      </div>
    </div>
  );
};
