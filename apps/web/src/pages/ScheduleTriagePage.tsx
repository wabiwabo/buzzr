import { useState, useCallback, useMemo, useRef } from 'react';
import { createColumnHelper } from '@tanstack/react-table';
import dayjs from 'dayjs';
import { Badge } from '@/components/ui/badge';
import { DataTable, DataTableColumnHeader, Highlight } from '@/components/data-table';
import type { FilterDef } from '@/components/data-table';
import { useServerTable } from '@/hooks/useServerTable';
import { useDataTableKeyboard } from '@/hooks/useDataTableKeyboard';
import { PageHeader, StatusBadge, PageTransition } from '@/components/common';
import { STATUS_LABELS } from '@/theme/tokens';

interface Schedule {
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

function formatDays(days: number[] | null): string {
  if (!days || days.length === 0) return '-';
  return days.map((d) => DAY_NAMES[d] || d).join(', ');
}

const typeOptions = Object.entries(TYPE_LABELS).map(([value, label]) => ({ value, label }));
const statusOptions = Object.entries(STATUS_LABELS).map(([value, label]) => ({ value, label: label as string }));

const scheduleFilterDefs: FilterDef[] = [
  { key: 's.status', label: 'Status', type: 'select', options: statusOptions },
  { key: 's.schedule_type', label: 'Tipe', type: 'select', options: typeOptions },
];

const columnHelper = createColumnHelper<Schedule>();

export default function ScheduleTriagePage() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [selectedSchedule, setSelectedSchedule] = useState<Schedule | null>(null);
  const searchTextRef = useRef('');

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
      cell: (info) => <span className="text-sm tabular-nums">{info.getValue()}</span>,
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
        return <span className="text-sm text-muted-foreground">{formatDays(s.recurring_days)}</span>;
      },
    }),
  ], []);

  const {
    table, isLoading, meta, searchText, setSearchText,
    filters, setFilter, resetFilters, activeFilterCount, refetch,
  } = useServerTable<Schedule>({
    endpoint: '/schedules',
    columnDefs: columns,
    defaultSort: { field: 's.start_time', order: 'asc' },
    filterDefs: scheduleFilterDefs,
  });

  searchTextRef.current = searchText;

  useDataTableKeyboard({
    table,
    activeIndex,
    setActiveIndex,
    onEnter: (row) => setSelectedSchedule(row),
    onEscape: () => setSelectedSchedule(null),
  });

  const renderPreview = useCallback(() => {
    if (!selectedSchedule) return null;
    return (
      <div className="space-y-4">
        <div>
          <h3 className="font-medium text-sm">{selectedSchedule.route_name}</h3>
          <p className="text-xs text-muted-foreground mt-1">
            {TYPE_LABELS[selectedSchedule.schedule_type] || selectedSchedule.schedule_type}
          </p>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Status</span>
            <StatusBadge status={selectedSchedule.status} />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Waktu Mulai</span>
            <span className="text-sm tabular-nums">{selectedSchedule.start_time}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Pengemudi</span>
            <span className="text-sm">{selectedSchedule.driver_name || '-'}</span>
          </div>
          {selectedSchedule.vehicle_plate && (
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Kendaraan</span>
              <span className="text-sm font-mono">{selectedSchedule.vehicle_plate}</span>
            </div>
          )}
          <div>
            <span className="text-xs text-muted-foreground block">Jadwal</span>
            <span className="text-sm">
              {selectedSchedule.scheduled_date
                ? dayjs(selectedSchedule.scheduled_date).format('DD MMMM YYYY')
                : `Hari: ${formatDays(selectedSchedule.recurring_days)}`}
            </span>
          </div>
        </div>
      </div>
    );
  }, [selectedSchedule]);

  return (
    <PageTransition>
      <div>
        <PageHeader
          title="Jadwal"
          description={`${meta.total} jadwal`}
          breadcrumbs={[{ label: 'Dashboard', path: '/' }, { label: 'Jadwal' }]}
        />

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
          onPageChange={(p) => (table as any)._setPage(p)}
          onLimitChange={(l) => (table as any)._setLimit(l)}
          onRefresh={refetch}
          onRowClick={(r) => setSelectedSchedule(r)}
          activeIndex={activeIndex}
          setActiveIndex={setActiveIndex}
          previewOpen={!!selectedSchedule}
          onPreviewClose={() => setSelectedSchedule(null)}
          renderPreview={renderPreview}
          previewMode="split"
          emptyTitle="Tidak ada jadwal"
          emptyDescription="Belum ada jadwal yang dibuat"
        />
      </div>
    </PageTransition>
  );
}
