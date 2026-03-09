import { useState, useCallback, useMemo, useRef } from 'react';
import { createColumnHelper } from '@tanstack/react-table';
import { Badge } from '@/components/ui/badge';
import { DataTable, DataTableColumnHeader, Highlight } from '@/components/data-table';
import type { FilterDef } from '@/components/data-table';
import { useServerTable } from '@/hooks/useServerTable';
import { useDataTableKeyboard } from '@/hooks/useDataTableKeyboard';
import { PageHeader, PageTransition } from '@/components/common';

interface Vehicle {
  id: string;
  plate_number: string;
  type: string;
  capacity_tons: number;
  driver_id: string | null;
  driver_name: string | null;
  is_active: boolean;
}

const TYPE_LABELS: Record<string, string> = {
  truck: 'Truk',
  cart: 'Gerobak',
  motorcycle: 'Motor',
};

const typeOptions = Object.entries(TYPE_LABELS).map(([value, label]) => ({ value, label }));

const fleetFilterDefs: FilterDef[] = [
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
      enableSorting: false,
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
    columnHelper.accessor('is_active', {
      header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
      cell: (info) => (
        <Badge variant={info.getValue() ? 'default' : 'secondary'} className="text-xs">
          {info.getValue() ? 'Aktif' : 'Nonaktif'}
        </Badge>
      ),
      enableSorting: false,
    }),
  ], []);

  const {
    table, isLoading, meta, searchText, setSearchText,
    filters, setFilter, resetFilters, activeFilterCount, refetch, setPage, setLimit,
  } = useServerTable<Vehicle>({
    endpoint: '/fleet',
    columnDefs: columns,
    defaultSort: { field: 'plate_number', order: 'asc' },
    filterDefs: fleetFilterDefs,
    columnMap: { plate_number: 'v.plate_number', type: 'v.type', created_at: 'v.created_at' },
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
            <Badge variant={selectedVehicle.is_active ? 'default' : 'secondary'}>
              {selectedVehicle.is_active ? 'Aktif' : 'Nonaktif'}
            </Badge>
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
          filterLabels={{ 'v.type': 'Tipe' }}
          onPageChange={setPage}
          onLimitChange={setLimit}
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
