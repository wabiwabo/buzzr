import { useState, useCallback, useMemo, useRef } from 'react';
import { createColumnHelper } from '@tanstack/react-table';
import { toast } from 'sonner';
import api from '@/services/api';
import { Badge } from '@/components/ui/badge';
import { DataTable, DataTableColumnHeader, Highlight } from '@/components/data-table';
import type { FilterDef } from '@/components/data-table';
import { useServerTable } from '@/hooks/useServerTable';
import { useDataTableKeyboard } from '@/hooks/useDataTableKeyboard';
import { PageHeader, StatusBadge, PageTransition } from '@/components/common';
import { STATUS_LABELS } from '@/theme/tokens';

interface Tps {
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

const typeOptions = Object.entries(TYPE_LABELS).map(([value, label]) => ({ value, label }));
const statusOptions = Object.entries(STATUS_LABELS).map(([value, label]) => ({ value, label: label as string }));

const tpsFilterDefs: FilterDef[] = [
  { key: 'status', label: 'Status', type: 'select', options: statusOptions },
  { key: 'type', label: 'Tipe', type: 'select', options: typeOptions },
];

const columnHelper = createColumnHelper<Tps>();

export default function TpsTriagePage() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [selectedTps, setSelectedTps] = useState<Tps | null>(null);
  const searchTextRef = useRef('');

  const columns = useMemo(() => [
    columnHelper.accessor('name', {
      header: ({ column }) => <DataTableColumnHeader column={column} title="Nama" />,
      cell: (info) => (
        <span className="text-sm font-medium">
          <Highlight text={info.getValue() || '-'} query={searchTextRef.current} />
        </span>
      ),
    }),
    columnHelper.accessor('type', {
      header: ({ column }) => <DataTableColumnHeader column={column} title="Tipe" />,
      cell: (info) => (
        <Badge variant="outline" className="text-xs">
          {TYPE_LABELS[info.getValue()] || info.getValue()}
        </Badge>
      ),
    }),
    columnHelper.accessor('status', {
      header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
      cell: (info) => <StatusBadge status={info.getValue()} />,
    }),
    columnHelper.accessor('address', {
      header: ({ column }) => <DataTableColumnHeader column={column} title="Alamat" />,
      cell: (info) => (
        <span className="line-clamp-1 text-sm text-muted-foreground">
          <Highlight text={info.getValue()?.slice(0, 40) || '-'} query={searchTextRef.current} />
        </span>
      ),
      enableSorting: false,
    }),
    columnHelper.accessor('capacity_tons', {
      header: ({ column }) => <DataTableColumnHeader column={column} title="Kapasitas" />,
      cell: (info) => <span className="text-sm tabular-nums">{info.getValue()} ton</span>,
    }),
    columnHelper.display({
      id: 'load_pct',
      header: 'Beban',
      cell: ({ row }) => {
        const cap = row.original.capacity_tons;
        const load = row.original.current_load_tons;
        const pct = cap > 0 ? Math.round((load / cap) * 100) : 0;
        return (
          <span className={`text-sm tabular-nums ${pct >= 90 ? 'text-destructive font-medium' : pct >= 70 ? 'text-amber-600' : ''}`}>
            {pct}%
          </span>
        );
      },
    }),
  ], []);

  const {
    table, isLoading, meta, searchText, setSearchText,
    filters, setFilter, resetFilters, activeFilterCount, refetch, setPage, setLimit,
  } = useServerTable<Tps>({
    endpoint: '/tps',
    columnDefs: columns,
    defaultSort: { field: 'name', order: 'asc' },
    filterDefs: tpsFilterDefs,
  });

  searchTextRef.current = searchText;

  useDataTableKeyboard({
    table,
    activeIndex,
    setActiveIndex,
    onEnter: (row) => setSelectedTps(row),
    onEscape: () => setSelectedTps(null),
  });

  const handleStatusTransition = useCallback(async (id: string, newStatus: string) => {
    try {
      await api.patch(`/tps/${id}`, { status: newStatus });
      toast.success(`Status TPS diubah ke ${STATUS_LABELS[newStatus] || newStatus}`);
      refetch();
      setSelectedTps(null);
    } catch {
      toast.error('Gagal mengubah status TPS');
    }
  }, [refetch]);

  const renderPreview = useCallback(() => {
    if (!selectedTps) return null;
    const loadPct = selectedTps.capacity_tons > 0
      ? Math.round((selectedTps.current_load_tons / selectedTps.capacity_tons) * 100) : 0;
    return (
      <div className="space-y-4">
        <div>
          <h3 className="font-medium text-sm">{selectedTps.name}</h3>
          <p className="text-xs text-muted-foreground mt-1">
            {TYPE_LABELS[selectedTps.type] || selectedTps.type}
          </p>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Status</span>
            <StatusBadge status={selectedTps.status} />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Kapasitas</span>
            <span className="text-sm tabular-nums">{selectedTps.current_load_tons}/{selectedTps.capacity_tons} ton ({loadPct}%)</span>
          </div>
          {selectedTps.address && (
            <div>
              <span className="text-xs text-muted-foreground block">Alamat</span>
              <span className="text-sm">{selectedTps.address}</span>
            </div>
          )}
          {selectedTps.latitude && selectedTps.longitude && (
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Koordinat</span>
              <span className="text-sm tabular-nums">{selectedTps.latitude.toFixed(5)}, {selectedTps.longitude.toFixed(5)}</span>
            </div>
          )}
        </div>
      </div>
    );
  }, [selectedTps]);

  return (
    <PageTransition>
      <div>
        <PageHeader
          title="TPS"
          description={`${meta.total} titik pengumpulan`}
          breadcrumbs={[{ label: 'Dashboard', path: '/' }, { label: 'TPS' }]}
        />

        <DataTable
          table={table}
          meta={meta}
          isLoading={isLoading}
          searchText={searchText}
          onSearchChange={setSearchText}
          searchPlaceholder="Cari nama, alamat..."
          filters={filters}
          onFilterChange={setFilter}
          onResetFilters={resetFilters}
          activeFilterCount={activeFilterCount}
          filterDefs={tpsFilterDefs}
          filterLabels={{ status: 'Status', type: 'Tipe' }}
          onPageChange={setPage}
          onLimitChange={setLimit}
          onRefresh={refetch}
          onRowClick={(r) => setSelectedTps(r)}
          activeIndex={activeIndex}
          setActiveIndex={setActiveIndex}
          previewOpen={!!selectedTps}
          onPreviewClose={() => setSelectedTps(null)}
          renderPreview={renderPreview}
          previewMode="split"
          emptyTitle="Tidak ada TPS"
          emptyDescription="Belum ada titik pengumpulan yang terdaftar"
        />
      </div>
    </PageTransition>
  );
}
