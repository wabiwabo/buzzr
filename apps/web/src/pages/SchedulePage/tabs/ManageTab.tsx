import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { createColumnHelper } from '@tanstack/react-table';
import dayjs from 'dayjs';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DataTable, DataTableColumnHeader, Highlight } from '@/components/data-table';
import type { FilterDef } from '@/components/data-table';
import { useServerTable } from '@/hooks/useServerTable';
import { useDataTableKeyboard } from '@/hooks/useDataTableKeyboard';
import { StatusBadge } from '@/components/common';
import { ScheduleStops } from '../components/ScheduleStops';
import { ReassignDialog } from '../components/ReassignDialog';
import { useSchedulePageStore } from '../store';
import { fetchScheduleDetail, updateScheduleStatus } from '../api';
import type { Schedule, ScheduleDetail } from '../types';
import { TYPE_LABELS, TYPE_OPTIONS, SCHEDULE_STATUS_OPTIONS, formatRecurringDays } from '../types';

const scheduleFilterDefs: FilterDef[] = [
  { key: 's.status', label: 'Status', type: 'select', options: SCHEDULE_STATUS_OPTIONS },
  { key: 's.schedule_type', label: 'Tipe', type: 'select', options: TYPE_OPTIONS },
];

const columnHelper = createColumnHelper<Schedule>();

export const ManageTab: React.FC = () => {
  const { selectedScheduleId, selectSchedule } = useSchedulePageStore();
  const [activeIndex, setActiveIndex] = useState(0);
  const [selected, setSelected] = useState<Schedule | null>(null);
  const [detail, setDetail] = useState<ScheduleDetail | null>(null);
  const [reassignOpen, setReassignOpen] = useState(false);
  const searchTextRef = useRef('');

  // Fetch full detail when selection changes
  useEffect(() => {
    if (!selected) { setDetail(null); return; }
    let cancelled = false;
    fetchScheduleDetail(selected.id)
      .then((d) => { if (!cancelled) setDetail(d); })
      .catch((err) => {
        if (!cancelled) toast.error(err?.response?.data?.message || 'Gagal memuat detail jadwal');
      });
    return () => { cancelled = true; };
  }, [selected?.id]);

  // Sync selection from store (e.g. Today tab clicks)
  useEffect(() => {
    if (selectedScheduleId && (!selected || selected.id !== selectedScheduleId)) {
      const row = table.getRowModel().rows.find((r) => r.original.id === selectedScheduleId);
      if (row) setSelected(row.original);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedScheduleId]);

  const columns = useMemo(() => [
    columnHelper.accessor('route_name', {
      header: ({ column }) => <DataTableColumnHeader column={column} title="Rute" />,
      cell: (info) => (
        <span className="text-sm font-medium">
          <Highlight text={info.getValue() || '-'} query={searchTextRef.current} />
        </span>
      ),
    }),
    columnHelper.accessor('schedule_type', {
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
    columnHelper.accessor('start_time', {
      header: ({ column }) => <DataTableColumnHeader column={column} title="Waktu Mulai" />,
      cell: (info) => <span className="text-sm tabular-nums">{(info.getValue() || '').slice(0, 5)}</span>,
    }),
    columnHelper.accessor('driver_name', {
      header: ({ column }) => <DataTableColumnHeader column={column} title="Pengemudi" />,
      cell: (info) => (
        <span className="text-sm">
          <Highlight text={info.getValue() || '-'} query={searchTextRef.current} />
        </span>
      ),
      enableSorting: false,
    }),
    columnHelper.display({
      id: 'schedule_info',
      header: 'Jadwal',
      cell: ({ row }) => {
        const s = row.original;
        if (s.scheduled_date) {
          return <span className="text-sm text-muted-foreground">{dayjs(s.scheduled_date).format('DD MMM YY')}</span>;
        }
        return <span className="text-sm text-muted-foreground">{formatRecurringDays(s.recurring_days)}</span>;
      },
    }),
  ], []);

  const {
    table, isLoading, meta, searchText, setSearchText,
    filters, setFilter, resetFilters, activeFilterCount, refetch, setPage, setLimit,
  } = useServerTable<Schedule>({
    endpoint: '/schedules',
    columnDefs: columns,
    defaultSort: { field: 'start_time', order: 'asc' },
    filterDefs: scheduleFilterDefs,
    columnMap: { route_name: 's.route_name', schedule_type: 's.schedule_type', status: 's.status', start_time: 's.start_time', created_at: 's.created_at' },
  });

  searchTextRef.current = searchText;

  useDataTableKeyboard({
    table,
    activeIndex,
    setActiveIndex,
    onEnter: (row) => { setSelected(row); selectSchedule(row.id); },
    onEscape: () => { setSelected(null); selectSchedule(null); },
  });

  const handleStatusChange = useCallback(async (status: string) => {
    if (!selected) return;
    try {
      await updateScheduleStatus(selected.id, status);
      toast.success('Status diperbarui');
      refetch();
      setSelected(null);
      selectSchedule(null);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Gagal memperbarui status');
    }
  }, [selected, refetch, selectSchedule]);

  const renderPreview = useCallback(() => {
    if (!selected) return null;
    return (
      <div className="space-y-4">
        <div>
          <h3 className="font-medium text-sm">{selected.route_name}</h3>
          <p className="text-xs text-muted-foreground mt-1">
            {TYPE_LABELS[selected.schedule_type] || selected.schedule_type}
          </p>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Status</span>
            <StatusBadge status={selected.status} />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Waktu Mulai</span>
            <span className="text-sm tabular-nums">{(selected.start_time || '').slice(0, 5)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Pengemudi</span>
            <span className="text-sm">{selected.driver_name || '—'}</span>
          </div>
          {selected.vehicle_plate && (
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Kendaraan</span>
              <span className="text-sm font-mono">{selected.vehicle_plate}</span>
            </div>
          )}
          <div>
            <span className="text-xs text-muted-foreground block">Jadwal</span>
            <span className="text-sm">
              {selected.scheduled_date
                ? dayjs(selected.scheduled_date).format('DD MMMM YYYY')
                : `Hari: ${formatRecurringDays(selected.recurring_days)}`}
            </span>
          </div>
        </div>

        {/* Stops */}
        <div>
          <span className="text-xs text-muted-foreground block mb-2">Perhentian</span>
          {detail ? (
            <ScheduleStops stops={detail.stops} />
          ) : (
            <p className="text-xs text-muted-foreground">Memuat...</p>
          )}
        </div>

        {/* Actions */}
        <div className="space-y-2 pt-2 border-t">
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={() => setReassignOpen(true)}
          >
            Tugaskan Ulang
          </Button>
          <div className="flex gap-2">
            {selected.status === 'pending' && (
              <Button variant="outline" size="sm" className="flex-1 text-xs"
                onClick={() => handleStatusChange('in_progress')}>
                Mulai
              </Button>
            )}
            {selected.status === 'in_progress' && (
              <Button variant="outline" size="sm" className="flex-1 text-xs"
                onClick={() => handleStatusChange('completed')}>
                Tandai Selesai
              </Button>
            )}
            {(selected.status === 'pending' || selected.status === 'in_progress') && (
              <Button variant="outline" size="sm" className="flex-1 text-xs"
                onClick={() => handleStatusChange('cancelled')}>
                Batalkan
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }, [selected, detail, handleStatusChange]);

  return (
    <>
      <DataTable
        table={table}
        meta={meta}
        isLoading={isLoading}
        searchText={searchText}
        onSearchChange={setSearchText}
        searchPlaceholder="Cari rute, pengemudi..."
        filters={filters}
        onFilterChange={setFilter}
        onResetFilters={resetFilters}
        activeFilterCount={activeFilterCount}
        filterDefs={scheduleFilterDefs}
        filterLabels={{ 's.status': 'Status', 's.schedule_type': 'Tipe' }}
        onPageChange={setPage}
        onLimitChange={setLimit}
        onRefresh={refetch}
        onRowClick={(r) => { setSelected(r); selectSchedule(r.id); }}
        activeIndex={activeIndex}
        setActiveIndex={setActiveIndex}
        previewOpen={!!selected}
        onPreviewClose={() => { setSelected(null); selectSchedule(null); }}
        renderPreview={renderPreview}
        previewMode="split"
        emptyTitle="Tidak ada jadwal"
        emptyDescription="Belum ada jadwal yang dibuat"
      />

      <ReassignDialog
        open={reassignOpen}
        scheduleId={selected?.id || null}
        currentDriverId={selected?.driver_id || null}
        currentVehicleId={selected?.vehicle_id || null}
        onClose={() => setReassignOpen(false)}
        onSuccess={() => { refetch(); }}
      />
    </>
  );
};
