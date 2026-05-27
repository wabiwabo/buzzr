import React, { useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { STATUS_LABELS } from '@/theme/tokens';
import { useComplaintPageStore, computeAnalytics } from '../store';
import { ComplaintKpiBar } from '../components/ComplaintKpiBar';
import { ComplaintMap } from '../components/ComplaintMap';
import { CATEGORY_OPTIONS, STATUS_COLOR_MAP } from '../types';

const COMPLAINT_STATUS_OPTIONS = ['submitted', 'verified', 'assigned', 'in_progress', 'resolved', 'rejected']
  .map((value) => ({ value, label: STATUS_LABELS[value] || value }));

export const MapTab: React.FC = () => {
  const {
    mapComplaints,
    isLoading,
    filterStatuses,
    filterCategories,
    toggleFilterStatus,
    toggleFilterCategory,
  } = useComplaintPageStore();

  const analytics = useMemo(() => computeAnalytics(mapComplaints), [mapComplaints]);

  const filtered = useMemo(() => {
    let result = mapComplaints;
    if (filterStatuses.size > 0) {
      result = result.filter((c) => filterStatuses.has(c.status));
    }
    if (filterCategories.size > 0) {
      result = result.filter((c) => filterCategories.has(c.category));
    }
    return result;
  }, [mapComplaints, filterStatuses, filterCategories]);

  return (
    <div className="space-y-4">
      <ComplaintKpiBar
        totalCount={analytics.totalCount}
        slaBreach={analytics.slaBreach}
        avgResolutionHours={analytics.avgResolutionHours}
        resolvedPct={analytics.resolvedPct}
        loading={isLoading}
      />

      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs text-muted-foreground mr-1">Kategori:</span>
        {CATEGORY_OPTIONS.map((opt) => {
          const active = filterCategories.has(opt.value);
          return (
            <button key={opt.value} type="button" role="checkbox" aria-checked={active} onClick={() => toggleFilterCategory(opt.value)}>
              <Badge variant={active ? 'default' : 'outline'} className="cursor-pointer text-xs">{opt.label}</Badge>
            </button>
          );
        })}
        <span className="text-xs text-muted-foreground ml-3 mr-1">Status:</span>
        {COMPLAINT_STATUS_OPTIONS.map((opt) => {
          const active = filterStatuses.has(opt.value);
          return (
            <button key={opt.value} type="button" role="checkbox" aria-checked={active} onClick={() => toggleFilterStatus(opt.value)}>
              <Badge variant={active ? 'default' : 'outline'} className="cursor-pointer text-xs">{opt.label}</Badge>
            </button>
          );
        })}
      </div>

      <div className="rounded-lg overflow-hidden border" style={{ height: 'calc(100vh - 340px)' }}>
        <ComplaintMap data={filtered} />
      </div>

      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full" style={{ backgroundColor: STATUS_COLOR_MAP.resolved }} /> Selesai
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full" style={{ backgroundColor: STATUS_COLOR_MAP.in_progress }} /> Proses
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full" style={{ backgroundColor: STATUS_COLOR_MAP.assigned }} /> Ditugaskan
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full" style={{ backgroundColor: STATUS_COLOR_MAP.submitted }} /> Baru
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-red-600 animate-pulse" /> SLA Breach
        </span>
      </div>
    </div>
  );
};
