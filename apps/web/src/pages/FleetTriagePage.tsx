import { useState, useCallback, useMemo, useRef } from 'react';
import { createColumnHelper } from '@tanstack/react-table';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { DataTable, DataTableColumnHeader, Highlight } from '@/components/data-table';
import type { FilterDef } from '@/components/data-table';
import { useServerTable } from '@/hooks/useServerTable';
import { useDataTableKeyboard } from '@/hooks/useDataTableKeyboard';
import { PageHeader, StatusBadge, PageTransition } from '@/components/common';
import { STATUS_LABELS } from '@/theme/tokens';

interface Vehicle {
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

const typeOptions = Object.entries(TYPE_LABELS).map(([value, label]) => ({ value, label }));
const statusOptions = Object.entries(STATUS_LABELS).map(([value, label]) => ({ value, label: label as string }));

const fleetFilterDefs: FilterDef[] = [
  { key: 'v.status', label: 'Status', type: 'select', options: statusOptions },
  { key: 'v.type', label: 'Tipe', type: 'select', options: typeOptions },
];

const columnHelper = createColumnHelper<Vehicle>();

export default function FleetTriagePage() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const searchTextRef = useRef('');

  const columns = useMemo(() => [
    columnHelper.accessor('plate_number', {
      header: ({ column }) => <DataTableColumnHeader column={column} title="No. Polisi" />,
      cell: (info) => (
        <span className="text-sm font-medium font-mono">
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
    columnHelper.accessor('capacity_tons', {
      header: ({ column }) => <DataTableColumnHeader column={column} title="Kapasitas" />,
      cell: (info) => <span className="text-sm tabular-nums">{info.getValue()} ton</span>,
    }),
    columnHelper.accessor('driver_name', {
      header: ({ column }) => <DataTableColumnHeader column={column} title="Pengemudi" />,
      cell: (info) => (
        <span className="text-sm">
          <Highlight text={info.getValue() || 'Belum ditugaskan'} query={searchTextRef.current} />
        </span>
      ),
      enableSorting: false,
    }),
    columnHelper.accessor('status', {
      header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
      cell: (info) => <StatusBadge status={info.getValue()} />,
    }),
  ], []);

  const {
    table, isLoading, meta, searchText, setSearchText,
    filters, setFilter, resetFilters, activeFilterCount, refetch,
  } = useServerTable<Vehicle>({
    endpoint: '/fleet',
    columnDefs: columns,
    defaultSort: { field: 'v.plate_number', order: 'asc' },
    filterDefs: fleetFilterDefs,
  });

  searchTextRef.current = searchText;

  useDataTableKeyboard({
    table,
    activeIndex,
    setActiveIndex,
    onEnter: (row) => setSelectedVehicle(row),
    onEscape: () => setSelectedVehicle(null),
  });

  const renderPreview = useCallback(() => {
    if (!selectedVehicle) return null;
    return (
      <div className="space-y-4">
        <div>
          <h3 className="font-medium text-sm font-mono">{selectedVehicle.plate_number}</h3>
          <p className="text-xs text-muted-foreground mt-1">
            {TYPE_LABELS[selectedVehicle.type] || selectedVehicle.type} · {selectedVehicle.capacity_tons} ton
          </p>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Status</span>
            <StatusBadge status={selectedVehicle.status} />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Pengemudi</span>
            <span className="text-sm">{selectedVehicle.driver_name || 'Belum ditugaskan'}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Kapasitas</span>
            <span className="text-sm tabular-nums">{selectedVehicle.capacity_tons} ton</span>
          </div>
        </div>
      </div>
    );
  }, [selectedVehicle]);

  return (
    <PageTransition>
      <div>
        <PageHeader
          title="Armada"
          description={`${meta.total} kendaraan`}
          breadcrumbs={[{ label: 'Dashboard', path: '/' }, { label: 'Armada' }]}
        />

        <DataTable
          table={table}
          meta={meta}
          isLoading={isLoading}
          searchText={searchText}
          onSearchChange={setSearchText}
          searchPlaceholder="Cari plat nomor, pengemudi..."
          filters={filters}
          onFilterChange={setFilter}
          onResetFilters={resetFilters}
          activeFilterCount={activeFilterCount}
          filterDefs={fleetFilterDefs}
          filterLabels={{ 'v.status': 'Status', 'v.type': 'Tipe' }}
          onPageChange={(p) => (table as any)._setPage(p)}
          onLimitChange={(l) => (table as any)._setLimit(l)}
          onRefresh={refetch}
          onRowClick={(r) => setSelectedVehicle(r)}
          activeIndex={activeIndex}
          setActiveIndex={setActiveIndex}
          previewOpen={!!selectedVehicle}
          onPreviewClose={() => setSelectedVehicle(null)}
          renderPreview={renderPreview}
          previewMode="split"
          emptyTitle="Tidak ada kendaraan"
          emptyDescription="Belum ada kendaraan yang terdaftar"
        />
      </div>
    </PageTransition>
  );
}
