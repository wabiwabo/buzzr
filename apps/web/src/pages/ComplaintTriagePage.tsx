import { useState, useCallback, useMemo, useRef } from 'react';
import { createColumnHelper } from '@tanstack/react-table';
import dayjs from 'dayjs';
import { toast } from 'sonner';
import api from '@/services/api';
import { Badge } from '@/components/ui/badge';
import { DataTable, DataTableColumnHeader, Highlight } from '@/components/data-table';
import type { FilterDef } from '@/components/data-table';
import { useServerTable } from '@/hooks/useServerTable';
import { useDataTableKeyboard } from '@/hooks/useDataTableKeyboard';
import { StatusStepper } from '@/components/triage/StatusStepper';
import { SlaCountdown } from '@/components/triage/SlaCountdown';
import { PageHeader, StatusBadge, PageTransition } from '@/components/common';
import { STATUS_LABELS } from '@/theme/tokens';

interface Complaint {
  id: string;
  category: string;
  description: string;
  status: string;
  address: string;
  latitude: number;
  longitude: number;
  rating: number | null;
  created_at: string;
  resolved_at: string | null;
  reporter_name: string;
  assignee_name: string | null;
}

const CATEGORY_LABELS: Record<string, string> = {
  illegal_dumping: 'Pembuangan Ilegal',
  tps_full: 'TPS Penuh',
  missed_pickup: 'Tidak Diangkut',
  other: 'Lainnya',
};

const categoryOptions = Object.entries(CATEGORY_LABELS).map(([value, label]) => ({ value, label }));
const statusOptions = Object.entries(STATUS_LABELS).map(([value, label]) => ({ value, label: label as string }));

const complaintFilterDefs: FilterDef[] = [
  { key: 'c.status', label: 'Status', type: 'select', options: statusOptions },
  { key: 'c.category', label: 'Kategori', type: 'select', options: categoryOptions },
];

const columnHelper = createColumnHelper<Complaint>();

export default function ComplaintTriagePage() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);

  // Ref to hold current searchText so column cell renderers can access it
  // without forcing column identity changes on every keystroke.
  const searchTextRef = useRef('');

  const columns = useMemo(() => [
    columnHelper.accessor('description', {
      header: ({ column }) => <DataTableColumnHeader column={column} title="Deskripsi" />,
      cell: (info) => (
        <span className="line-clamp-1 text-sm">
          <Highlight text={info.getValue()?.slice(0, 80) || '-'} query={searchTextRef.current} />
        </span>
      ),
      enableSorting: false,
    }),
    columnHelper.accessor('category', {
      header: ({ column }) => <DataTableColumnHeader column={column} title="Kategori" />,
      cell: (info) => (
        <Badge variant="outline" className="text-xs">
          {CATEGORY_LABELS[info.getValue()] || info.getValue()}
        </Badge>
      ),
    }),
    columnHelper.accessor('status', {
      header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
      cell: (info) => <StatusBadge status={info.getValue()} />,
    }),
    columnHelper.accessor('reporter_name', {
      header: ({ column }) => <DataTableColumnHeader column={column} title="Pelapor" />,
      cell: (info) => (
        <span className="text-sm">
          <Highlight text={info.getValue() || '-'} query={searchTextRef.current} />
        </span>
      ),
      enableSorting: false,
    }),
    columnHelper.accessor('address', {
      header: ({ column }) => <DataTableColumnHeader column={column} title="Lokasi" />,
      cell: (info) => (
        <span className="line-clamp-1 text-sm text-muted-foreground">
          <Highlight text={info.getValue()?.slice(0, 40) || '-'} query={searchTextRef.current} />
        </span>
      ),
      enableSorting: false,
    }),
    columnHelper.accessor('created_at', {
      header: ({ column }) => <DataTableColumnHeader column={column} title="Tanggal" />,
      cell: (info) => (
        <span className="text-sm text-muted-foreground tabular-nums">
          {dayjs(info.getValue()).format('DD MMM YY')}
        </span>
      ),
    }),
    columnHelper.display({
      id: 'sla',
      header: 'SLA',
      cell: ({ row }) => <SlaCountdown createdAt={row.original.created_at} slaHours={72} className="text-xs" />,
    }),
  ], []);

  const {
    table, isLoading, meta, searchText, setSearchText,
    filters, setFilter, resetFilters, activeFilterCount, refetch, setPage, setLimit,
  } = useServerTable<Complaint>({
    endpoint: '/complaints',
    columnDefs: columns,
    defaultSort: { field: 'c.created_at', order: 'desc' },
    filterDefs: complaintFilterDefs,
    columnMap: { category: 'c.category', status: 'c.status', created_at: 'c.created_at' },
  });

  // Keep ref in sync so cell renderers always read the latest value
  searchTextRef.current = searchText;

  // Keyboard navigation
  useDataTableKeyboard({
    table,
    activeIndex,
    setActiveIndex,
    onEnter: (row) => setSelectedComplaint(row),
    onEscape: () => setSelectedComplaint(null),
  });

  // Status transition
  const handleStatusTransition = useCallback(async (id: string, newStatus: string) => {
    try {
      await api.patch(`/complaints/${id}/status`, { status: newStatus });
      toast.success(`Status diubah ke ${STATUS_LABELS[newStatus] || newStatus}`);
      refetch();
      setSelectedComplaint(null);
    } catch {
      toast.error('Gagal mengubah status');
    }
  }, [refetch]);

  const renderPreview = useCallback(() => {
    if (!selectedComplaint) return null;
    return (
      <div className="space-y-4">
        <div>
          <h3 className="font-medium text-sm">{selectedComplaint.description?.slice(0, 100)}</h3>
          <p className="text-xs text-muted-foreground mt-1">
            Dilaporkan oleh {selectedComplaint.reporter_name} · {dayjs(selectedComplaint.created_at).format('DD MMM YYYY, HH:mm')}
          </p>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Kategori</span>
            <Badge variant="outline">{CATEGORY_LABELS[selectedComplaint.category] || selectedComplaint.category}</Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Status</span>
            <StatusBadge status={selectedComplaint.status} />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">SLA</span>
            <SlaCountdown createdAt={selectedComplaint.created_at} slaHours={72} />
          </div>
          {selectedComplaint.address && (
            <div>
              <span className="text-xs text-muted-foreground block">Lokasi</span>
              <span className="text-sm">{selectedComplaint.address}</span>
            </div>
          )}
          {selectedComplaint.assignee_name && (
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Ditugaskan ke</span>
              <span className="text-sm">{selectedComplaint.assignee_name}</span>
            </div>
          )}
        </div>

        <StatusStepper
          currentStatus={selectedComplaint.status}
          onTransition={(newStatus) => handleStatusTransition(selectedComplaint.id, newStatus)}
        />
      </div>
    );
  }, [selectedComplaint, handleStatusTransition]);

  return (
    <PageTransition>
      <div>
        <PageHeader
          title="Pengaduan"
          description={`${meta.total} pengaduan`}
          breadcrumbs={[{ label: 'Dashboard', path: '/' }, { label: 'Pengaduan' }]}
        />

        <DataTable
          table={table}
          meta={meta}
          isLoading={isLoading}
          searchText={searchText}
          onSearchChange={setSearchText}
          searchPlaceholder="Cari deskripsi, lokasi..."
          filters={filters}
          onFilterChange={setFilter}
          onResetFilters={resetFilters}
          activeFilterCount={activeFilterCount}
          filterDefs={complaintFilterDefs}
          filterLabels={{ 'c.status': 'Status', 'c.category': 'Kategori' }}
          onPageChange={setPage}
          onLimitChange={setLimit}
          onRefresh={refetch}
          onRowClick={(r) => setSelectedComplaint(r)}
          activeIndex={activeIndex}
          setActiveIndex={setActiveIndex}
          previewOpen={!!selectedComplaint}
          onPreviewClose={() => setSelectedComplaint(null)}
          renderPreview={renderPreview}
          previewMode="split"
          emptyTitle="Tidak ada pengaduan"
          emptyDescription="Belum ada pengaduan yang masuk"
        />
      </div>
    </PageTransition>
  );
}
