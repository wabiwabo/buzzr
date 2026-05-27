import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
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
import { StatusBadge } from '@/components/common';
import { STATUS_LABELS } from '@/theme/tokens';
import { ComplaintMap } from '../components/ComplaintMap';
import { fetchComplaintDetail } from '../api';
import type { Complaint, ComplaintDetail } from '../types';
import { CATEGORY_LABELS, CATEGORY_OPTIONS } from '../types';

const statusOptions = Object.entries(STATUS_LABELS)
  .filter(([k]) => ['submitted', 'verified', 'assigned', 'in_progress', 'resolved', 'rejected'].includes(k))
  .map(([value, label]) => ({ value, label: label as string }));

const complaintFilterDefs: FilterDef[] = [
  { key: 'c.status', label: 'Status', type: 'select', options: statusOptions },
  { key: 'c.category', label: 'Kategori', type: 'select', options: CATEGORY_OPTIONS },
];

const columnHelper = createColumnHelper<Complaint>();

export const TriageTab: React.FC = () => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [complaintDetail, setComplaintDetail] = useState<ComplaintDetail | null>(null);
  const searchTextRef = useRef('');

  useEffect(() => {
    if (!selectedComplaint) {
      setComplaintDetail(null);
      return;
    }
    let cancelled = false;
    fetchComplaintDetail(selectedComplaint.id)
      .then((detail) => { if (!cancelled) setComplaintDetail(detail); })
      .catch((err) => {
        if (!cancelled) {
          toast.error(err?.response?.data?.message || 'Gagal memuat detail pengaduan');
        }
      });
    return () => { cancelled = true; };
  }, [selectedComplaint?.id]);

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
    defaultSort: { field: 'created_at', order: 'desc' },
    filterDefs: complaintFilterDefs,
    columnMap: { category: 'c.category', status: 'c.status', created_at: 'c.created_at' },
  });

  searchTextRef.current = searchText;

  useDataTableKeyboard({
    table,
    activeIndex,
    setActiveIndex,
    onEnter: (row) => setSelectedComplaint(row),
    onEscape: () => setSelectedComplaint(null),
  });

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
          {selectedComplaint.assignee_name && (
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Ditugaskan ke</span>
              <span className="text-sm">{selectedComplaint.assignee_name}</span>
            </div>
          )}
          {selectedComplaint.address && (
            <div>
              <span className="text-xs text-muted-foreground block">Lokasi</span>
              <span className="text-sm">{selectedComplaint.address}</span>
            </div>
          )}
        </div>

        {complaintDetail?.attachments && complaintDetail.attachments.length > 0 && (
          <div>
            <span className="text-xs text-muted-foreground block mb-2">Foto</span>
            <div className="grid grid-cols-3 gap-2">
              {complaintDetail.attachments
                .filter((a) => a.file_type.startsWith('image/'))
                .map((a) => (
                  <a key={a.id} href={a.file_url} target="_blank" rel="noopener noreferrer"
                    className="rounded-md overflow-hidden border hover:ring-2 hover:ring-primary/50 transition-shadow">
                    <img src={a.file_url} alt="Lampiran" className="w-full h-20 object-cover" />
                  </a>
                ))}
            </div>
          </div>
        )}

        {selectedComplaint.latitude && selectedComplaint.longitude && (
          <div className="rounded-md overflow-hidden border">
            <ComplaintMap
              data={[]}
              singlePin={{ lat: selectedComplaint.latitude, lng: selectedComplaint.longitude }}
              height="180px"
              interactive={false}
            />
          </div>
        )}

        <StatusStepper
          currentStatus={selectedComplaint.status}
          onTransition={(newStatus) => handleStatusTransition(selectedComplaint.id, newStatus)}
        />
      </div>
    );
  }, [selectedComplaint, complaintDetail, handleStatusTransition]);

  return (
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
  );
};
