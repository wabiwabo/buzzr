import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import api from '@/services/api';
import { TriageLayout } from '@/components/triage';
import type { TriageRowData } from '@/components/triage/TriageListRow';
import type { TriagePreviewData } from '@/components/triage/TriagePreview';
import { useFacetedFilter } from '@/hooks/useFacetedFilter';
import { useTriageSelection } from '@/hooks/useTriageSelection';
import { useTriageKeyboard } from '@/hooks/useTriageKeyboard';
import { STATUS_LABELS } from '@/theme/tokens';
import { toast } from 'sonner';

interface ApiVehicle {
  id: string;
  plate_number: string;
  type: string;
  capacity_tons: number;
  driver_id: string | null;
  driver_name: string | null;
  status: string;
}

const TYPE_LABELS: Record<string, string> = {
  truck: 'Truk',
  cart: 'Gerobak',
  motorcycle: 'Motor',
};

const SEVERITY_MAP: Record<string, 'critical' | 'warning' | 'info'> = {
  maintenance: 'critical',
  in_use: 'warning',
  available: 'info',
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

function mapToRowData(vehicle: ApiVehicle): TriageRowData & Record<string, unknown> {
  return {
    id: vehicle.id,
    title: vehicle.plate_number,
    meta: `${TYPE_LABELS[vehicle.type] || vehicle.type} · ${vehicle.capacity_tons}t · ${vehicle.driver_name || 'Belum ditugaskan'}`,
    severity: SEVERITY_MAP[vehicle.status] || 'info',
    createdAt: new Date().toISOString(),
    assigneeName: vehicle.driver_name || undefined,
    isUnread: vehicle.status === 'maintenance',
    status: vehicle.status,
    type: vehicle.type,
  };
}

function mapToPreviewData(vehicle: ApiVehicle): TriagePreviewData {
  return {
    id: vehicle.id,
    title: vehicle.plate_number,
    description: `${TYPE_LABELS[vehicle.type] || vehicle.type}\nKapasitas: ${vehicle.capacity_tons} ton`,
    status: vehicle.status,
    category: TYPE_LABELS[vehicle.type] || vehicle.type,
    assigneeName: vehicle.driver_name || undefined,
    createdAt: new Date().toISOString(),
  };
}

export default function FleetTriagePage() {
  const searchRef = useRef<HTMLInputElement>(null);
  const [vehicles, setVehicles] = useState<ApiVehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [groupBy, setGroupBy] = useState('none');

  const rowItems = useMemo(() => vehicles.map(mapToRowData), [vehicles]);

  const { filtered, facetCounts, search, setSearch, toggleFilter, removeFilter, resetFilters, activeFilters } =
    useFacetedFilter({ items: rowItems, dimensions: FACET_DIMENSIONS, searchFields: ['title', 'meta'] });

  const { selectedId, checkedIds, select, selectNext, selectPrev, toggleCheck, checkRange, clearChecked } =
    useTriageSelection({ items: filtered as TriageRowData[], getId: (item) => item.id });

  const previewData = useMemo(() => {
    if (!selectedId) return null;
    const v = vehicles.find((v) => v.id === selectedId);
    return v ? mapToPreviewData(v) : null;
  }, [selectedId, vehicles]);

  const fetchVehicles = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/fleet');
      setVehicles(res.data);
    } catch {
      toast.error('Gagal memuat data armada');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchVehicles(); }, [fetchVehicles]);

  const handleAssign = useCallback(async (_id: string) => {
    toast.info('Penugasan driver akan tersedia segera');
  }, []);

  useTriageKeyboard({
    onNext: selectNext, onPrev: selectPrev,
    onTogglePreview: () => {}, onOpenDetail: () => {},
    onAssign: () => { if (selectedId) handleAssign(selectedId); },
    onStatusChange: () => {}, onResolve: () => {}, onReject: () => {},
    onAddNote: () => {}, onCyclePriority: () => {},
    onFocusSearch: () => searchRef.current?.focus(),
    onShowHelp: () => {}, onToggleSidebar: () => {},
    onClearSelection: clearChecked,
  });

  return (
    <div className="p-4">
      <div className="mb-4">
        <h1 className="text-xl font-semibold">Armada</h1>
        <p className="text-sm text-muted-foreground">{filtered.length} dari {rowItems.length} kendaraan</p>
      </div>
      <TriageLayout
        items={filtered as TriageRowData[]} loading={loading}
        selectedId={selectedId} checkedIds={checkedIds}
        onSelect={select} onCheck={toggleCheck} onShiftClick={checkRange} onClearChecked={clearChecked}
        search={search} onSearchChange={setSearch} searchRef={searchRef}
        groupBy={groupBy} onGroupByChange={setGroupBy} groupByOptions={GROUP_BY_OPTIONS}
        activeFilters={activeFilters} onRemoveFilter={removeFilter}
        onRefresh={fetchVehicles} onShowHelp={() => {}}
        onBulkAssign={() => {}} onBulkStatus={() => {}}
        previewData={previewData}
        onStatusTransition={() => {}} onAssign={handleAssign}
      />
    </div>
  );
}
