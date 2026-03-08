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

interface ApiTps {
  id: string;
  name: string;
  type: string;
  status: string;
  capacity_tons: number;
  current_load_tons: number;
  address: string;
  latitude: number;
  longitude: number;
  qr_code: string;
  area_id: string;
}

const TYPE_LABELS: Record<string, string> = {
  tps: 'TPS',
  tps3r: 'TPS3R',
  bank_sampah: 'Bank Sampah',
};

const SEVERITY_MAP: Record<string, 'critical' | 'warning' | 'info'> = {
  full: 'critical',
  maintenance: 'warning',
  active: 'info',
};

const FACET_DIMENSIONS = [
  { key: 'status', label: 'Status', getValue: (item: Record<string, unknown>) => item.status as string },
  { key: 'type', label: 'Tipe', getValue: (item: Record<string, unknown>) => item.type as string },
];

const GROUP_BY_OPTIONS = [
  { value: 'none', label: 'Tidak ada' },
  { value: 'status', label: 'Status' },
  { value: 'type', label: 'Tipe' },
];

const DEFAULT_VIEWS: Array<{ id: string; name: string; filters: Record<string, string[]> }> = [
  { id: 'all', name: 'Semua', filters: {} },
  { id: 'full', name: 'TPS Penuh', filters: { status: ['full'] } },
  { id: 'maintenance', name: 'Pemeliharaan', filters: { status: ['maintenance'] } },
];

function mapToRowData(tps: ApiTps): TriageRowData & Record<string, unknown> {
  const loadPct = tps.capacity_tons > 0 ? Math.round((tps.current_load_tons / tps.capacity_tons) * 100) : 0;
  return {
    id: tps.id,
    title: tps.name,
    meta: `${TYPE_LABELS[tps.type] || tps.type} · ${tps.address?.slice(0, 40) || ''} · ${loadPct}%`,
    severity: SEVERITY_MAP[tps.status] || 'info',
    createdAt: new Date().toISOString(),
    isUnread: tps.status === 'full',
    status: tps.status,
    type: tps.type,
  };
}

function mapToPreviewData(tps: ApiTps): TriagePreviewData {
  const loadPct = tps.capacity_tons > 0 ? Math.round((tps.current_load_tons / tps.capacity_tons) * 100) : 0;
  return {
    id: tps.id,
    title: tps.name,
    description: `Kapasitas: ${tps.current_load_tons}/${tps.capacity_tons} ton (${loadPct}%)`,
    status: tps.status,
    category: TYPE_LABELS[tps.type] || tps.type,
    address: tps.address,
    coordinates: tps.latitude && tps.longitude ? { lat: tps.latitude, lng: tps.longitude } : undefined,
    createdAt: new Date().toISOString(),
  };
}

export default function TpsTriagePage() {
  const searchRef = useRef<HTMLInputElement>(null);
  const [tpsList, setTpsList] = useState<ApiTps[]>([]);
  const [loading, setLoading] = useState(true);
  const [groupBy, setGroupBy] = useState('none');

  const rowItems = useMemo(() => tpsList.map(mapToRowData), [tpsList]);

  const { filtered, facetCounts, search, setSearch, toggleFilter, removeFilter, resetFilters, activeFilters } =
    useFacetedFilter({ items: rowItems, dimensions: FACET_DIMENSIONS, searchFields: ['title', 'meta'] });

  const { selectedId, checkedIds, select, selectNext, selectPrev, toggleCheck, checkRange, clearChecked } =
    useTriageSelection({ items: filtered as TriageRowData[], getId: (item) => item.id });

  const { views, activeViewId, selectView } = useSavedViews('tps', DEFAULT_VIEWS);

  const previewData = useMemo(() => {
    if (!selectedId) return null;
    const tps = tpsList.find((t) => t.id === selectedId);
    return tps ? mapToPreviewData(tps) : null;
  }, [selectedId, tpsList]);

  const fetchTps = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/tps');
      setTpsList(res.data);
    } catch {
      toast.error('Gagal memuat data TPS');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchTps(); }, [fetchTps]);

  const handleStatusTransition = useCallback(async (_id: string, _newStatus: string) => {
    toast.info('Perubahan status TPS akan tersedia segera');
  }, []);

  const handleAssign = useCallback(async (_id: string) => {
    toast.info('Penugasan TPS akan tersedia segera');
  }, []);

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
        <h1 className="text-xl font-semibold">TPS</h1>
        <p className="text-sm text-muted-foreground">{filtered.length} dari {rowItems.length} TPS</p>
      </div>
      <TriageLayout
        items={filtered as TriageRowData[]} loading={loading}
        selectedId={selectedId} checkedIds={checkedIds}
        onSelect={select} onCheck={toggleCheck} onShiftClick={checkRange} onClearChecked={clearChecked}
        search={search} onSearchChange={setSearch} searchRef={searchRef}
        groupBy={groupBy} onGroupByChange={setGroupBy} groupByOptions={GROUP_BY_OPTIONS}
        activeFilters={activeFilters} onRemoveFilter={removeFilter}
        onRefresh={fetchTps} onShowHelp={() => {}}
        onBulkAssign={() => {}} onBulkStatus={() => {}}
        previewData={previewData} onStatusTransition={handleStatusTransition} onAssign={handleAssign}
        filterSidebar={
          <FilterSidebar
            views={views} activeViewId={activeViewId} onSelectView={selectView}
            facets={[
              { key: 'status', label: 'Status', labelMap: STATUS_LABELS },
              { key: 'type', label: 'Tipe', labelMap: TYPE_LABELS },
            ]}
            facetCounts={facetCounts} onToggleFilter={toggleFilter}
            onResetFilters={resetFilters} hasActiveFilters={activeFilters.length > 0}
          />
        }
      />
    </div>
  );
}
