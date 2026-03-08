import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
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

// API complaint shape
interface ApiComplaint {
  id: string;
  reporter_name: string;
  reporter_id: string;
  category: string;
  status: string;
  description: string;
  address: string;
  latitude: number;
  longitude: number;
  assigned_to: string | null;
  assignee_name: string | null;
  created_at: string;
  resolved_at: string | null;
  reporter_phone?: string;
  photos?: string[];
}

const CATEGORY_LABELS: Record<string, string> = {
  illegal_dumping: 'Pembuangan Ilegal',
  tps_full: 'TPS Penuh',
  missed_pickup: 'Tidak Diangkut',
  other: 'Lainnya',
};

const SEVERITY_MAP: Record<string, 'critical' | 'warning' | 'info'> = {
  illegal_dumping: 'critical',
  tps_full: 'warning',
  missed_pickup: 'warning',
  other: 'info',
};

const FACET_DIMENSIONS = [
  {
    key: 'status',
    label: 'Status',
    getValue: (item: Record<string, unknown>) => item.status as string,
  },
  {
    key: 'category',
    label: 'Kategori',
    getValue: (item: Record<string, unknown>) => item.category as string,
  },
];

const GROUP_BY_OPTIONS = [
  { value: 'none', label: 'Tidak ada' },
  { value: 'status', label: 'Status' },
  { value: 'category', label: 'Kategori' },
];

const GROUP_CONFIG = {
  status: {
    key: 'status',
    getGroup: (item: TriageRowData & { status?: string }) =>
      STATUS_LABELS[(item as unknown as Record<string, string>).status] || (item as unknown as Record<string, string>).status,
  },
  category: {
    key: 'category',
    getGroup: (item: TriageRowData & { category?: string }) =>
      CATEGORY_LABELS[(item as unknown as Record<string, string>).category] || (item as unknown as Record<string, string>).category,
  },
};

const DEFAULT_VIEWS: Array<{ id: string; name: string; filters: Record<string, string[]> }> = [
  { id: 'all', name: 'Semua', filters: {} },
  { id: 'triage', name: 'Triage Saya', filters: { status: ['submitted', 'verified'] } },
  { id: 'sla-critical', name: 'SLA Kritis', filters: {} },
  { id: 'unassigned', name: 'Belum Ditugaskan', filters: { status: ['verified'] } },
];

function mapToRowData(complaint: ApiComplaint): TriageRowData & Record<string, unknown> {
  return {
    id: complaint.id,
    title: complaint.description?.slice(0, 80) || 'Tanpa deskripsi',
    meta: `${CATEGORY_LABELS[complaint.category] || complaint.category} · ${complaint.reporter_name} · ${complaint.address?.slice(0, 40) || ''}`,
    severity: SEVERITY_MAP[complaint.category] || 'info',
    createdAt: complaint.created_at,
    slaHours: 72,
    assigneeName: complaint.assignee_name || undefined,
    isUnread: complaint.status === 'submitted',
    // Extra fields for filtering/grouping
    status: complaint.status,
    category: complaint.category,
  };
}

function mapToPreviewData(complaint: ApiComplaint): TriagePreviewData {
  return {
    id: complaint.id,
    title: complaint.description?.slice(0, 80) || 'Tanpa deskripsi',
    description: complaint.description || '',
    status: complaint.status,
    category: CATEGORY_LABELS[complaint.category] || complaint.category,
    reporterName: complaint.reporter_name,
    reporterPhone: complaint.reporter_phone,
    address: complaint.address,
    coordinates: complaint.latitude && complaint.longitude
      ? { lat: complaint.latitude, lng: complaint.longitude }
      : undefined,
    createdAt: complaint.created_at,
    slaHours: 72,
    photos: complaint.photos,
    assigneeName: complaint.assignee_name || undefined,
    timeline: [
      {
        time: complaint.created_at,
        label: `Dilaporkan oleh ${complaint.reporter_name}`,
        type: 'created' as const,
      },
      ...(complaint.assigned_to
        ? [{
            time: complaint.created_at,
            label: `Ditugaskan ke ${complaint.assignee_name || 'staf'}`,
            type: 'assigned' as 'assigned',
          }]
        : []),
      ...(complaint.resolved_at
        ? [{
            time: complaint.resolved_at,
            label: complaint.status === 'rejected' ? 'Ditolak' : 'Diselesaikan',
            type: (complaint.status === 'rejected' ? 'rejected' : 'resolved') as 'resolved',
          }]
        : []),
    ],
  };
}

export default function ComplaintTriagePage() {
  const navigate = useNavigate();
  const searchRef = useRef<HTMLInputElement>(null);
  const [complaints, setComplaints] = useState<ApiComplaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [groupBy, setGroupBy] = useState('none');
  const [helpOpen, setHelpOpen] = useState(false);

  // Map API data to row data
  const rowItems = useMemo(() => complaints.map(mapToRowData), [complaints]);

  // Faceted filter
  const {
    filtered,
    facetCounts,
    search,
    setSearch,
    toggleFilter,
    removeFilter,
    resetFilters,
    activeFilters,
  } = useFacetedFilter({
    items: rowItems,
    dimensions: FACET_DIMENSIONS,
    searchFields: ['title', 'meta'],
  });

  // Selection
  const {
    selectedId,
    checkedIds,
    select,
    selectNext,
    selectPrev,
    toggleCheck,
    checkRange,
    clearChecked,
  } = useTriageSelection({
    items: filtered as TriageRowData[],
    getId: (item) => item.id,
  });

  // Saved views
  const { views, activeViewId, selectView } = useSavedViews('complaints', DEFAULT_VIEWS);

  // Preview data
  const previewData = useMemo(() => {
    if (!selectedId) return null;
    const complaint = complaints.find((c) => c.id === selectedId);
    return complaint ? mapToPreviewData(complaint) : null;
  }, [selectedId, complaints]);

  // Fetch complaints
  const fetchComplaints = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/complaints');
      setComplaints(res.data);
    } catch {
      toast.error('Gagal memuat data pengaduan');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchComplaints();
  }, [fetchComplaints]);

  // Status transition
  const handleStatusTransition = useCallback(async (id: string, newStatus: string) => {
    try {
      await api.patch(`/complaints/${id}/status`, { status: newStatus });
      toast.success(`Status diubah ke ${STATUS_LABELS[newStatus] || newStatus}`);
      fetchComplaints();
    } catch {
      toast.error('Gagal mengubah status');
    }
  }, [fetchComplaints]);

  // Assignment
  const handleAssign = useCallback(async (id: string) => {
    // TODO: Open assignment dialog with staff list
    toast.info('Fitur penugasan akan tersedia segera');
  }, []);

  // Keyboard hooks
  useTriageKeyboard({
    onNext: selectNext,
    onPrev: selectPrev,
    onTogglePreview: () => {},
    onOpenDetail: () => {
      if (selectedId) navigate(`/complaints/${selectedId}`);
    },
    onAssign: () => {
      if (selectedId) handleAssign(selectedId);
    },
    onStatusChange: () => {},
    onResolve: () => {
      if (selectedId) handleStatusTransition(selectedId, 'resolved');
    },
    onReject: () => {
      if (selectedId) handleStatusTransition(selectedId, 'rejected');
    },
    onAddNote: () => {},
    onCyclePriority: () => {},
    onFocusSearch: () => searchRef.current?.focus(),
    onShowHelp: () => setHelpOpen((o) => !o),
    onToggleSidebar: () => {},
    onBulkAssign: () => {},
    onBulkStatus: () => {},
    onClearSelection: clearChecked,
  });

  return (
    <div className="p-4">
      <div className="mb-4">
        <h1 className="text-xl font-semibold">Pengaduan</h1>
        <p className="text-sm text-muted-foreground">
          {filtered.length} dari {rowItems.length} pengaduan
        </p>
      </div>

      <TriageLayout
        items={filtered as TriageRowData[]}
        loading={loading}
        selectedId={selectedId}
        checkedIds={checkedIds}
        onSelect={select}
        onCheck={toggleCheck}
        onShiftClick={checkRange}
        onClearChecked={clearChecked}
        search={search}
        onSearchChange={setSearch}
        searchRef={searchRef}
        groupBy={groupBy}
        onGroupByChange={setGroupBy}
        groupByOptions={GROUP_BY_OPTIONS}
        groupConfig={GROUP_CONFIG as Record<string, { key: string; getGroup: (item: TriageRowData) => string }>}
        activeFilters={activeFilters}
        onRemoveFilter={removeFilter}
        onRefresh={fetchComplaints}
        onShowHelp={() => setHelpOpen((o) => !o)}
        onBulkAssign={() => toast.info('Penugasan massal akan tersedia segera')}
        onBulkStatus={() => toast.info('Ubah status massal akan tersedia segera')}
        previewData={previewData}
        onStatusTransition={handleStatusTransition}
        onAssign={handleAssign}
        filterSidebar={
          <FilterSidebar
            views={views}
            activeViewId={activeViewId}
            onSelectView={selectView}
            facets={[
              { key: 'status', label: 'Status', labelMap: STATUS_LABELS },
              { key: 'category', label: 'Kategori', labelMap: CATEGORY_LABELS },
            ]}
            facetCounts={facetCounts}
            onToggleFilter={toggleFilter}
            onResetFilters={resetFilters}
            hasActiveFilters={activeFilters.length > 0}
          />
        }
      />
    </div>
  );
}
