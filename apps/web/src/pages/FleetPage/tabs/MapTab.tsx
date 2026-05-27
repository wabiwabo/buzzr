import React, { useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { useFleetPageStore, computeAnalytics } from '../store';
import { FleetKpiBar } from '../components/FleetKpiBar';
import { FleetMap } from '../components/FleetMap';
import {
  VEHICLE_TYPE_OPTIONS, STATUS_COLOR, STATUS_LABEL_ID, deriveVehicleStatus,
  type VehicleStatus,
} from '../types';

const STATUS_OPTIONS: { value: VehicleStatus; label: string }[] = [
  { value: 'online', label: 'Bergerak' },
  { value: 'idle', label: 'Diam' },
  { value: 'offline', label: 'Offline' },
  { value: 'inactive', label: 'Nonaktif' },
];

export const MapTab: React.FC = () => {
  const {
    positions, isLoading, selectedVehicleId, selectVehicle,
    mapFilterTypes, mapFilterStatuses, toggleMapFilterType, toggleMapFilterStatus,
    setActiveTab,
  } = useFleetPageStore();

  const analytics = useMemo(() => computeAnalytics(positions), [positions]);

  const filtered = useMemo(() => {
    let result = positions;
    if (mapFilterTypes.size > 0) {
      result = result.filter((v) => mapFilterTypes.has(v.type));
    }
    if (mapFilterStatuses.size > 0) {
      result = result.filter((v) =>
        mapFilterStatuses.has(deriveVehicleStatus(v.is_active, v.speed, v.last_update)),
      );
    }
    return result;
  }, [positions, mapFilterTypes, mapFilterStatuses]);

  const handleVehicleClick = (id: string) => {
    selectVehicle(id);
    setActiveTab('kelola');
  };

  return (
    <div className="space-y-4">
      <FleetKpiBar
        totalCount={analytics.totalCount}
        activeCount={analytics.activeCount}
        assignedCount={analytics.assignedCount}
        onlineCount={analytics.onlineCount}
        loading={isLoading}
      />

      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs text-muted-foreground mr-1">Tipe:</span>
        {VEHICLE_TYPE_OPTIONS.map((opt) => {
          const active = mapFilterTypes.has(opt.value);
          return (
            <button
              key={opt.value}
              type="button"
              role="checkbox"
              aria-checked={active}
              onClick={() => toggleMapFilterType(opt.value)}
            >
              <Badge variant={active ? 'default' : 'outline'} className="cursor-pointer text-xs">
                {opt.label}
              </Badge>
            </button>
          );
        })}
        <span className="text-xs text-muted-foreground ml-3 mr-1">Status:</span>
        {STATUS_OPTIONS.map((opt) => {
          const active = mapFilterStatuses.has(opt.value);
          return (
            <button
              key={opt.value}
              type="button"
              role="checkbox"
              aria-checked={active}
              onClick={() => toggleMapFilterStatus(opt.value)}
            >
              <Badge variant={active ? 'default' : 'outline'} className="cursor-pointer text-xs">
                {opt.label}
              </Badge>
            </button>
          );
        })}
      </div>

      <div className="rounded-lg overflow-hidden border" style={{ height: 'calc(100vh - 340px)' }}>
        <FleetMap
          data={filtered}
          onVehicleClick={handleVehicleClick}
          selectedId={selectedVehicleId}
        />
      </div>

      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        {STATUS_OPTIONS.map((opt) => (
          <span key={opt.value} className="flex items-center gap-1.5">
            <span
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: STATUS_COLOR[opt.value] }}
            />
            {STATUS_LABEL_ID[opt.value]}
          </span>
        ))}
      </div>
    </div>
  );
};
