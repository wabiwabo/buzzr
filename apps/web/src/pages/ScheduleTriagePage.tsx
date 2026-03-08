import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import api from '@/services/api';
import { TriageLayout } from '@/components/triage';
import { FilterSidebar } from '@/components/triage/FilterSidebar';
import type { TriageRowData } from '@/components/triage/TriageListRow';
import type { TriagePreviewData } from '@/components/triage/TriagePreview';
import { useFacetedFilter } from '@/hooks/useFacetedFilter';
import { useTriageSelection } from '@/hooks/useTriageSelection';
import { useTriageKeyboard } from '@/hooks/useTriageKeyboard';
import { useSavedViews } from '@/hooks/useSavedViews';
import { STATUS_LABELS } from '@/theme/tokens';
import { toast } from 'sonner';

interface ApiSchedule {
  id: string;
  route_name: string;
  vehicle_id: string;
  vehicle_plate?: string;
  driver_id: string;
  driver_name?: string;
  schedule_type: string;
  recurring_days: number[] | null;
  scheduled_date: string | null;
  start_time: string;
  status: string;
}

const TYPE_LABELS: Record<string, string> = {
  recurring: 'Rutin',
  on_demand: 'Sesuai Permintaan',
};

const DAY_NAMES = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

const SEVERITY_MAP: Record<string, 'critical' | 'warning' | 'info'> = {
  cancelled: 'critical',
  in_progress: 'warning',
  active: 'info',
  completed: 'info',
};

const FACET_DIMENSIONS = [
  { key: 'status', label: 'Status', getValue: (item: Record<string, unknown>) => item.status as string },
  { key: 'schedule_type', label: 'Tipe', getValue: (item: Record<string, unknown>) => item.schedule_type as string },
];

const GROUP_BY_OPTIONS = [
  { value: 'none', label: 'Tidak ada' },
  { value: 'status', label: 'Status' },
  { value: 'schedule_type', label: 'Tipe' },
];

const DEFAULT_VIEWS: Array<{ id: string; name: string; filters: Record<string, string[]> }> = [
  { id: 'all', name: 'Semua', filters: {} },
  { id: 'active', name: 'Aktif', filters: { status: ['active', 'in_progress'] } },
  { id: 'completed', name: 'Selesai', filters: { status: ['completed'] } },
];

function formatDays(days: number[] | null): string {
  if (!days || days.length === 0) return '';
  return days.map((d) => DAY_NAMES[d] || d).join(', ');
}

function mapToRowData(schedule: ApiSchedule): TriageRowData & Record<string, unknown> {
  const datePart = schedule.scheduled_date
    ? new Date(schedule.scheduled_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })
    : formatDays(schedule.recurring_days);
  return {
    id: schedule.id,
    title: schedule.route_name,
    meta: `${TYPE_LABELS[schedule.schedule_type] || schedule.schedule_type} · ${schedule.driver_name || '-'} · ${datePart} ${schedule.start_time}`,
    severity: SEVERITY_MAP[schedule.status] || 'info',
    createdAt: schedule.scheduled_date || new Date().toISOString(),
    assigneeName: schedule.driver_name || undefined,
    isUnread: schedule.status === 'active',
    status: schedule.status,
    schedule_type: schedule.schedule_type,
  };
}

function mapToPreviewData(schedule: ApiSchedule): TriagePreviewData {
  return {
    id: schedule.id,
    title: schedule.route_name,
    description: `${TYPE_LABELS[schedule.schedule_type] || schedule.schedule_type}\nWaktu: ${schedule.start_time}\n${schedule.scheduled_date ? `Tanggal: ${new Date(schedule.scheduled_date).toLocaleDateString('id-ID')}` : `Hari: ${formatDays(schedule.recurring_days)}`}`,
    status: schedule.status,
    category: TYPE_LABELS[schedule.schedule_type] || schedule.schedule_type,
    assigneeName: schedule.driver_name || undefined,
    createdAt: schedule.scheduled_date || new Date().toISOString(),
  };
}

export default function ScheduleTriagePage() {
  const searchRef = useRef<HTMLInputElement>(null);
  const [schedules, setSchedules] = useState<ApiSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [groupBy, setGroupBy] = useState('none');

  const rowItems = useMemo(() => schedules.map(mapToRowData), [schedules]);

  const { filtered, facetCounts, search, setSearch, toggleFilter, removeFilter, resetFilters, activeFilters } =
    useFacetedFilter({ items: rowItems, dimensions: FACET_DIMENSIONS, searchFields: ['title', 'meta'] });

  const { selectedId, checkedIds, select, selectNext, selectPrev, toggleCheck, checkRange, clearChecked } =
    useTriageSelection({ items: filtered as TriageRowData[], getId: (item) => item.id });

  const { views, activeViewId, selectView } = useSavedViews('schedules', DEFAULT_VIEWS);

  const previewData = useMemo(() => {
    if (!selectedId) return null;
    const s = schedules.find((s) => s.id === selectedId);
    return s ? mapToPreviewData(s) : null;
  }, [selectedId, schedules]);

  const fetchSchedules = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/schedules');
      setSchedules(res.data);
    } catch {
      toast.error('Gagal memuat data jadwal');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchSchedules(); }, [fetchSchedules]);

  useTriageKeyboard({
    onNext: selectNext, onPrev: selectPrev,
    onTogglePreview: () => {}, onOpenDetail: () => {},
    onAssign: () => {}, onStatusChange: () => {},
    onResolve: () => {}, onReject: () => {},
    onAddNote: () => {}, onCyclePriority: () => {},
    onFocusSearch: () => searchRef.current?.focus(),
    onShowHelp: () => {}, onToggleSidebar: () => {},
    onClearSelection: clearChecked,
  });

  return (
    <div className="p-4">
      <div className="mb-4">
        <h1 className="text-xl font-semibold">Jadwal</h1>
        <p className="text-sm text-muted-foreground">{filtered.length} dari {rowItems.length} jadwal</p>
      </div>
      <TriageLayout
        items={filtered as TriageRowData[]} loading={loading}
        selectedId={selectedId} checkedIds={checkedIds}
        onSelect={select} onCheck={toggleCheck} onShiftClick={checkRange} onClearChecked={clearChecked}
        search={search} onSearchChange={setSearch} searchRef={searchRef}
        groupBy={groupBy} onGroupByChange={setGroupBy} groupByOptions={GROUP_BY_OPTIONS}
        activeFilters={activeFilters} onRemoveFilter={removeFilter}
        onRefresh={fetchSchedules} onShowHelp={() => {}}
        onBulkAssign={() => {}} onBulkStatus={() => {}}
        previewData={previewData}
        onStatusTransition={() => {}} onAssign={() => {}}
        filterSidebar={
          <FilterSidebar
            views={views} activeViewId={activeViewId} onSelectView={selectView}
            facets={[
              { key: 'status', label: 'Status', labelMap: STATUS_LABELS },
              { key: 'schedule_type', label: 'Tipe', labelMap: TYPE_LABELS },
            ]}
            facetCounts={facetCounts} onToggleFilter={toggleFilter}
            onResetFilters={resetFilters} hasActiveFilters={activeFilters.length > 0}
          />
        }
      />
    </div>
  );
}
