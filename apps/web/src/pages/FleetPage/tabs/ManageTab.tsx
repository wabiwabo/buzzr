import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { createColumnHelper } from '@tanstack/react-table';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';
import dayjs from 'dayjs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DataTable, DataTableColumnHeader, Highlight } from '@/components/data-table';
import type { FilterDef } from '@/components/data-table';
import { useServerTable } from '@/hooks/useServerTable';
import { useDataTableKeyboard } from '@/hooks/useDataTableKeyboard';
import { FleetForm } from '../components/FleetForm';
import { FleetMap } from '../components/FleetMap';
import { useFleetPageStore } from '../store';
import { fetchFleetPositions } from '../api';
import type { Vehicle, FleetPosition } from '../types';
import { VEHICLE_TYPE_LABELS, VEHICLE_TYPE_OPTIONS, STATUS_LABEL_ID, deriveVehicleStatus } from '../types';

const activeOptions = [
  { value: 'true', label: 'Aktif' },
  { value: 'false', label: 'Nonaktif' },
];

const fleetFilterDefs: FilterDef[] = [
  { key: 'v.type', label: 'Tipe', type: 'select', options: VEHICLE_TYPE_OPTIONS },
  { key: 'v.is_active', label: 'Status', type: 'select', options: activeOptions },
];

interface VehicleRow {
  id: string;
  plate_number: string;
  type: string;
  capacity_tons: number;
  driver_id: string | null;
  driver_name: string | null;
  is_active: boolean;
  created_at: string;
}

const columnHelper = createColumnHelper<VehicleRow>();

export const ManageTab: React.FC = () => {
  const { selectedVehicleId, selectVehicle, positions } = useFleetPageStore();
  const [activeIndex, setActiveIndex] = useState(0);
  const [selectedVehicle, setSelectedVehicle] = useState<VehicleRow | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editVehicle, setEditVehicle] = useState<VehicleRow | null>(null);
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
          {VEHICLE_TYPE_LABELS[info.getValue()] || info.getValue()}
        </Badge>
      ),
    }),
    columnHelper.accessor('capacity_tons', {
      header: ({ column }) => <DataTableColumnHeader column={column} title="Kapasitas" />,
      cell: (info) => <span className="text-sm tabular-nums">{Number(info.getValue())} ton</span>,
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
  } = useServerTable<VehicleRow>({
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
    onEnter: (row) => { setSelectedVehicle(row); selectVehicle(row.id); },
    onEscape: () => { setSelectedVehicle(null); selectVehicle(null); },
  });

  // Auto-select from store (e.g., clicking on map)
  useEffect(() => {
    if (selectedVehicleId && !selectedVehicle) {
      const rows = table.getRowModel().rows;
      const found = rows.find((r) => r.original.id === selectedVehicleId);
      if (found) setSelectedVehicle(found.original);
    }
  }, [selectedVehicleId, table, selectedVehicle]);

  const handleFormSuccess = () => {
    refetch();
    useFleetPageStore.getState().invalidateData();
  };

  const renderPreview = useCallback(() => {
    if (!selectedVehicle) return null;

    // Look up live position from store
    const position = positions.find((p) => p.id === selectedVehicle.id);
    const hasGps = position && position.latitude != null && position.longitude != null;
    const status = position
      ? deriveVehicleStatus(position.is_active, position.speed, position.last_update)
      : 'offline';

    return (
      <div className="space-y-4">
        <div>
          <h3 className="font-medium text-sm font-mono">{selectedVehicle.plate_number}</h3>
          <p className="text-xs text-muted-foreground mt-1">
            {VEHICLE_TYPE_LABELS[selectedVehicle.type] || selectedVehicle.type} · {selectedVehicle.capacity_tons} ton
          </p>
        </div>

        {/* Mini-map */}
        {hasGps && (
          <div className="rounded-md overflow-hidden border">
            <FleetMap
              data={[]}
              singlePin={{ lat: position!.latitude!, lng: position!.longitude! }}
              height="180px"
              interactive={false}
            />
          </div>
        )}

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Status</span>
            <Badge variant={selectedVehicle.is_active ? 'default' : 'secondary'}>
              {selectedVehicle.is_active ? 'Aktif' : 'Nonaktif'}
            </Badge>
          </div>
          {position && (
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Telemetri</span>
              <span className="text-sm">{STATUS_LABEL_ID[status]}</span>
            </div>
          )}
          {position?.speed != null && (
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Kecepatan</span>
              <span className="text-sm tabular-nums">{position.speed.toFixed(1)} km/jam</span>
            </div>
          )}
          {position?.last_update && (
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Update terakhir</span>
              <span className="text-sm">{dayjs(position.last_update).format('DD MMM HH:mm')}</span>
            </div>
          )}
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Pengemudi</span>
            <span className="text-sm">{selectedVehicle.driver_name || 'Belum ditugaskan'}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Kapasitas</span>
            <span className="text-sm tabular-nums">{selectedVehicle.capacity_tons} ton</span>
          </div>
        </div>

        <div className="pt-2 border-t">
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={() => { setEditVehicle(selectedVehicle); setFormOpen(true); }}
          >
            Edit Kendaraan
          </Button>
        </div>
      </div>
    );
  }, [selectedVehicle, positions]);

  return (
    <>
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
        filterLabels={{ 'v.type': 'Tipe', 'v.is_active': 'Status' }}
        onPageChange={setPage}
        onLimitChange={setLimit}
        onRefresh={refetch}
        onRowClick={(r) => { setSelectedVehicle(r); selectVehicle(r.id); }}
        activeIndex={activeIndex}
        setActiveIndex={setActiveIndex}
        previewOpen={!!selectedVehicle}
        onPreviewClose={() => { setSelectedVehicle(null); selectVehicle(null); }}
        renderPreview={renderPreview}
        previewMode="split"
        emptyTitle="Tidak ada kendaraan"
        emptyDescription="Belum ada kendaraan yang terdaftar"
        emptyActionLabel="Tambah Kendaraan"
        onEmptyAction={() => setFormOpen(true)}
        toolbarExtra={
          <Button size="sm" onClick={() => { setEditVehicle(null); setFormOpen(true); }}>
            <Plus className="h-4 w-4 mr-1" /> Tambah Kendaraan
          </Button>
        }
      />

      <FleetForm
        open={formOpen}
        onClose={() => { setFormOpen(false); setEditVehicle(null); }}
        vehicle={editVehicle as any}
        onSuccess={handleFormSuccess}
      />
    </>
  );
};
