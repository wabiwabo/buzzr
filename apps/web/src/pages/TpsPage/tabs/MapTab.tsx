// apps/web/src/pages/TpsPage/tabs/MapTab.tsx

import React, { useMemo } from 'react';
import { useTpsPageStore, computeAnalytics } from '../store';
import { TpsKpiBar } from '../components/TpsKpiBar';
import { TpsMap } from '../components/TpsMap';
import { TPS_TYPE_OPTIONS, TPS_STATUS_OPTIONS } from '../types';
import { Badge } from '@/components/ui/badge';

export const MapTab: React.FC = () => {
  const {
    allTps,
    isLoading,
    selectedTpsId,
    selectTps,
    mapFilterTypes,
    mapFilterStatuses,
    toggleMapFilterType,
    toggleMapFilterStatus,
    setActiveTab,
  } = useTpsPageStore();

  const analytics = useMemo(() => computeAnalytics(allTps), [allTps]);

  const filtered = useMemo(() => {
    let result = allTps;
    if (mapFilterTypes.size > 0) {
      result = result.filter((t) => mapFilterTypes.has(t.type));
    }
    if (mapFilterStatuses.size > 0) {
      result = result.filter((t) => mapFilterStatuses.has(t.status));
    }
    return result;
  }, [allTps, mapFilterTypes, mapFilterStatuses]);

  const handleTpsClick = (id: string) => {
    selectTps(id);
    setActiveTab('kelola');
  };

  return (
    <div className="space-y-4">
      <TpsKpiBar
        totalCount={analytics.totalCount}
        activeCount={analytics.activeCount}
        nearCapacityCount={analytics.nearCapacityCount}
        averageFillPercent={analytics.averageFillPercent}
        loading={isLoading}
      />

      {/* Filter chips */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs text-muted-foreground mr-1">Tipe:</span>
        {TPS_TYPE_OPTIONS.map((opt) => {
          const active = mapFilterTypes.has(opt.value);
          return (
            <button
              key={opt.value}
              type="button"
              role="checkbox"
              aria-checked={active}
              onClick={() => toggleMapFilterType(opt.value)}
            >
              <Badge
                variant={active ? 'default' : 'outline'}
                className="cursor-pointer text-xs"
              >
                {opt.label}
              </Badge>
            </button>
          );
        })}
        <span className="text-xs text-muted-foreground ml-3 mr-1">Status:</span>
        {TPS_STATUS_OPTIONS.map((opt) => {
          const active = mapFilterStatuses.has(opt.value);
          return (
            <button
              key={opt.value}
              type="button"
              role="checkbox"
              aria-checked={active}
              onClick={() => toggleMapFilterStatus(opt.value)}
            >
              <Badge
                variant={active ? 'default' : 'outline'}
                className="cursor-pointer text-xs"
              >
                {opt.label}
              </Badge>
            </button>
          );
        })}
      </div>

      {/* Map */}
      <div className="rounded-lg overflow-hidden border" style={{ height: 'calc(100vh - 340px)' }}>
        <TpsMap
          data={filtered}
          onTpsClick={handleTpsClick}
          selectedId={selectedTpsId}
        />
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-emerald-500" /> &lt;70%
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-amber-500" /> 70–89%
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-red-500" /> ≥90%
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-gray-400" /> Pemeliharaan
        </span>
      </div>
    </div>
  );
};
