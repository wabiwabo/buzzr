// apps/web/src/pages/TpsPage/tabs/ManageTab.tsx

import React, { useState, useCallback, useMemo, useRef } from 'react';
import { createColumnHelper } from '@tanstack/react-table';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';
import api from '@/services/api';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DataTable, DataTableColumnHeader, Highlight } from '@/components/data-table';
import type { FilterDef } from '@/components/data-table';
import { useServerTable } from '@/hooks/useServerTable';
import { useDataTableKeyboard } from '@/hooks/useDataTableKeyboard';
import { StatusBadge } from '@/components/common';
import { STATUS_LABELS } from '@/theme/tokens';
import { CapacityBar } from '../components/CapacityBar';
import { TpsMap } from '../components/TpsMap';
import { TpsForm } from '../components/TpsForm';
import { useTpsPageStore } from '../store';
import type { TpsItem } from '../types';

const TYPE_LABELS: Record<string, string> = {
  tps: 'TPS',
  tps3r: 'TPS3R',
  bank_sampah: 'Bank Sampah',
};

const typeOptions = Object.entries(TYPE_LABELS).map(([value, label]) => ({ value, label }));
const statusOptions = Object.entries(STATUS_LABELS)
  .filter(([k]) => ['active', 'full', 'maintenance'].includes(k))
  .map(([value, label]) => ({ value, label: label as string }));

const tpsFilterDefs: FilterDef[] = [
  { key: 'status', label: 'Status', type: 'select', options: statusOptions },
  { key: 'type', label: 'Tipe', type: 'select', options: typeOptions },
];

interface TpsPaginated {
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

const columnHelper = createColumnHelper<TpsPaginated>();

export const ManageTab: React.FC = () => {
  const { selectedTpsId, selectTps } = useTpsPageStore();
  const [activeIndex, setActiveIndex] = useState(0);
  const [selectedTps, setSelectedTps] = useState<TpsPaginated | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editTps, setEditTps] = useState<TpsPaginated | null>(null);
  const searchTextRef = useRef('');

  const columns = useMemo(
    () => [
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
        cell: (info) => (
          <span className="text-sm tabular-nums">{Number(info.getValue())} ton</span>
        ),
      }),
      columnHelper.display({
        id: 'load_pct',
        header: 'Beban',
        cell: ({ row }) => {
          const cap = Number(row.original.capacity_tons);
          const load = Number(row.original.current_load_tons);
          return <CapacityBar current={load} max={cap} size="sm" />;
        },
      }),
    ],
    [],
  );

  const {
    table, isLoading, meta, searchText, setSearchText,
    filters, setFilter, resetFilters, activeFilterCount, refetch, setPage, setLimit,
  } = useServerTable<TpsPaginated>({
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
    onEnter: (row) => {
      setSelectedTps(row);
      selectTps(row.id);
    },
    onEscape: () => {
      setSelectedTps(null);
      selectTps(null);
    },
  });

  // Auto-select from store (e.g., clicking on map)
  React.useEffect(() => {
    if (selectedTpsId && !selectedTps) {
      const rows = table.getRowModel().rows;
      const found = rows.find((r) => r.original.id === selectedTpsId);
      if (found) setSelectedTps(found.original);
    }
  }, [selectedTpsId, table]);

  const handleStatusTransition = useCallback(
    async (id: string, newStatus: string) => {
      try {
        await api.patch(`/tps/${id}`, { status: newStatus });
        toast.success(`Status TPS diubah ke ${STATUS_LABELS[newStatus] || newStatus}`);
        refetch();
        setSelectedTps(null);
        selectTps(null);
      } catch {
        toast.error('Gagal mengubah status TPS');
      }
    },
    [refetch, selectTps],
  );

  const handleFormSuccess = () => {
    refetch();
    // Also refresh store data
    useTpsPageStore.getState().setLoading(true);
  };

  const renderPreview = useCallback(() => {
    if (!selectedTps) return null;

    const loadPct =
      Number(selectedTps.capacity_tons) > 0
        ? Math.round(
            (Number(selectedTps.current_load_tons) / Number(selectedTps.capacity_tons)) * 100,
          )
        : 0;

    const tpsForMap: TpsItem = {
      ...selectedTps,
      latitude: Number(selectedTps.latitude),
      longitude: Number(selectedTps.longitude),
      capacity_tons: Number(selectedTps.capacity_tons),
      current_load_tons: Number(selectedTps.current_load_tons),
      fill_percent: loadPct,
      created_at: '',
      updated_at: '',
    };

    return (
      <div className="space-y-4">
        <div>
          <h3 className="font-medium text-sm">{selectedTps.name}</h3>
          <p className="text-xs text-muted-foreground mt-1">
            {TYPE_LABELS[selectedTps.type] || selectedTps.type}
          </p>
        </div>

        {/* Capacity */}
        <div className="space-y-1.5">
          <span className="text-xs text-muted-foreground">Kapasitas</span>
          <CapacityBar current={Number(selectedTps.current_load_tons)} max={Number(selectedTps.capacity_tons)} />
          <p className="text-xs tabular-nums text-muted-foreground">
            {Number(selectedTps.current_load_tons).toFixed(1)} / {Number(selectedTps.capacity_tons).toFixed(1)} ton ({loadPct}%)
          </p>
        </div>

        {/* Mini map */}
        {selectedTps.latitude && selectedTps.longitude && (
          <div className="rounded-md overflow-hidden border">
            <TpsMap
              data={[]}
              singleMarker={tpsForMap}
              height="180px"
              interactive={false}
            />
          </div>
        )}

        {/* Details */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Status</span>
            <StatusBadge status={selectedTps.status} />
          </div>
          {selectedTps.address && (
            <div>
              <span className="text-xs text-muted-foreground block">Alamat</span>
              <span className="text-sm">{selectedTps.address}</span>
            </div>
          )}
          {selectedTps.qr_code && (
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">QR Code</span>
              <span className="text-sm font-mono">{selectedTps.qr_code}</span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="space-y-2 pt-2 border-t">
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={() => {
              setEditTps(selectedTps);
              setFormOpen(true);
            }}
          >
            Edit TPS
          </Button>
          <div className="flex gap-2">
            {selectedTps.status !== 'active' && (
              <Button
                variant="outline"
                size="sm"
                className="flex-1 text-xs"
                onClick={() => handleStatusTransition(selectedTps.id, 'active')}
              >
                Aktifkan
              </Button>
            )}
            {selectedTps.status !== 'full' && (
              <Button
                variant="outline"
                size="sm"
                className="flex-1 text-xs"
                onClick={() => handleStatusTransition(selectedTps.id, 'full')}
              >
                Tandai Penuh
              </Button>
            )}
            {selectedTps.status !== 'maintenance' && (
              <Button
                variant="outline"
                size="sm"
                className="flex-1 text-xs"
                onClick={() => handleStatusTransition(selectedTps.id, 'maintenance')}
              >
                Pemeliharaan
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }, [selectedTps, handleStatusTransition]);

  return (
    <>
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
        onRowClick={(r) => {
          setSelectedTps(r);
          selectTps(r.id);
        }}
        activeIndex={activeIndex}
        setActiveIndex={setActiveIndex}
        previewOpen={!!selectedTps}
        onPreviewClose={() => {
          setSelectedTps(null);
          selectTps(null);
        }}
        renderPreview={renderPreview}
        previewMode="split"
        emptyTitle="Tidak ada TPS"
        emptyDescription="Belum ada titik pengumpulan yang terdaftar"
        emptyActionLabel="Tambah TPS"
        onEmptyAction={() => setFormOpen(true)}
        toolbarExtra={
          <Button size="sm" onClick={() => { setEditTps(null); setFormOpen(true); }}>
            <Plus className="h-4 w-4 mr-1" /> Tambah TPS
          </Button>
        }
      />

      <TpsForm
        open={formOpen}
        onClose={() => { setFormOpen(false); setEditTps(null); }}
        tps={editTps as any}
        onSuccess={handleFormSuccess}
      />
    </>
  );
};
