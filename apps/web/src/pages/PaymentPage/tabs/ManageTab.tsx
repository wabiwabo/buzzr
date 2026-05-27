import React, { useState, useCallback, useMemo, useRef } from 'react';
import { createColumnHelper } from '@tanstack/react-table';
import { Plus } from 'lucide-react';
import dayjs from 'dayjs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DataTable, DataTableColumnHeader, Highlight } from '@/components/data-table';
import type { FilterDef } from '@/components/data-table';
import { useServerTable } from '@/hooks/useServerTable';
import { useDataTableKeyboard } from '@/hooks/useDataTableKeyboard';
import { StatusBadge } from '@/components/common';
import { InvoiceForm } from '../components/InvoiceForm';
import { usePaymentPageStore } from '../store';
import type { Transaction } from '../types';
import {
  TYPE_LABELS, TYPE_OPTIONS, PAYMENT_STATUS_OPTIONS, formatRupiah,
} from '../types';

const paymentFilterDefs: FilterDef[] = [
  { key: 't.status', label: 'Status', type: 'select', options: PAYMENT_STATUS_OPTIONS },
  { key: 't.type', label: 'Tipe', type: 'select', options: TYPE_OPTIONS },
];

const columnHelper = createColumnHelper<Transaction>();

export const ManageTab: React.FC = () => {
  const { invalidateData } = usePaymentPageStore();
  const [activeIndex, setActiveIndex] = useState(0);
  const [selected, setSelected] = useState<Transaction | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const searchTextRef = useRef('');

  const columns = useMemo(() => [
    columnHelper.accessor('user_name', {
      header: ({ column }) => <DataTableColumnHeader column={column} title="Pengguna" />,
      cell: (info) => (
        <span className="text-sm font-medium">
          <Highlight text={info.getValue() || '-'} query={searchTextRef.current} />
        </span>
      ),
      enableSorting: false,
    }),
    columnHelper.accessor('type', {
      header: ({ column }) => <DataTableColumnHeader column={column} title="Tipe" />,
      cell: (info) => (
        <Badge variant="outline" className="text-xs">
          {TYPE_LABELS[info.getValue()] || info.getValue()}
        </Badge>
      ),
    }),
    columnHelper.accessor('amount', {
      header: ({ column }) => <DataTableColumnHeader column={column} title="Jumlah" />,
      cell: (info) => (
        <span className="text-sm font-medium tabular-nums">{formatRupiah(Number(info.getValue()))}</span>
      ),
    }),
    columnHelper.accessor('status', {
      header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
      cell: (info) => <StatusBadge status={info.getValue()} />,
    }),
    columnHelper.accessor('payment_method', {
      header: ({ column }) => <DataTableColumnHeader column={column} title="Metode" />,
      cell: (info) => <span className="text-sm">{info.getValue() || '-'}</span>,
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
  ], []);

  const {
    table, isLoading, meta, searchText, setSearchText,
    filters, setFilter, resetFilters, activeFilterCount, refetch, setPage, setLimit,
  } = useServerTable<Transaction>({
    endpoint: '/payments',
    columnDefs: columns,
    defaultSort: { field: 'created_at', order: 'desc' },
    filterDefs: paymentFilterDefs,
    columnMap: { type: 't.type', status: 't.status', amount: 't.amount', created_at: 't.created_at' },
  });

  searchTextRef.current = searchText;

  useDataTableKeyboard({
    table,
    activeIndex,
    setActiveIndex,
    onEnter: (row) => setSelected(row),
    onEscape: () => setSelected(null),
  });

  const handleFormSuccess = () => {
    refetch();
    invalidateData();
  };

  const renderPreview = useCallback(() => {
    if (!selected) return null;
    return (
      <div className="space-y-4">
        <div>
          <h3 className="font-medium text-sm tabular-nums">{formatRupiah(Number(selected.amount))}</h3>
          <p className="text-xs text-muted-foreground mt-1">
            {TYPE_LABELS[selected.type] || selected.type}
          </p>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Status</span>
            <StatusBadge status={selected.status} />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Pengguna</span>
            <span className="text-sm">{selected.user_name || '-'}</span>
          </div>
          {selected.payment_method && (
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Metode</span>
              <span className="text-sm">{selected.payment_method}</span>
            </div>
          )}
          {selected.external_id && (
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">External ID</span>
              <span className="text-sm font-mono text-xs">{selected.external_id}</span>
            </div>
          )}
          {selected.reference_id && (
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Reference</span>
              <span className="text-sm font-mono text-xs">{selected.reference_id}</span>
            </div>
          )}
          {selected.description && (
            <div>
              <span className="text-xs text-muted-foreground block">Deskripsi</span>
              <span className="text-sm">{selected.description}</span>
            </div>
          )}
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Dibuat</span>
            <span className="text-sm tabular-nums">{dayjs(selected.created_at).format('DD MMM YYYY HH:mm')}</span>
          </div>
          {selected.paid_at && (
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Dibayar</span>
              <span className="text-sm tabular-nums">{dayjs(selected.paid_at).format('DD MMM YYYY HH:mm')}</span>
            </div>
          )}
          {selected.expired_at && (
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Kadaluarsa</span>
              <span className="text-sm tabular-nums">{dayjs(selected.expired_at).format('DD MMM YYYY HH:mm')}</span>
            </div>
          )}
        </div>
      </div>
    );
  }, [selected]);

  return (
    <>
      <DataTable
        table={table}
        meta={meta}
        isLoading={isLoading}
        searchText={searchText}
        onSearchChange={setSearchText}
        searchPlaceholder="Cari pengguna, deskripsi..."
        filters={filters}
        onFilterChange={setFilter}
        onResetFilters={resetFilters}
        activeFilterCount={activeFilterCount}
        filterDefs={paymentFilterDefs}
        filterLabels={{ 't.status': 'Status', 't.type': 'Tipe' }}
        onPageChange={setPage}
        onLimitChange={setLimit}
        onRefresh={refetch}
        onRowClick={(r) => setSelected(r)}
        activeIndex={activeIndex}
        setActiveIndex={setActiveIndex}
        previewOpen={!!selected}
        onPreviewClose={() => setSelected(null)}
        renderPreview={renderPreview}
        previewMode="split"
        emptyTitle="Tidak ada transaksi"
        emptyDescription="Belum ada transaksi tercatat"
        toolbarExtra={
          <Button size="sm" onClick={() => setFormOpen(true)}>
            <Plus className="h-4 w-4 mr-1" /> Buat Faktur
          </Button>
        }
      />

      <InvoiceForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSuccess={handleFormSuccess}
      />
    </>
  );
};
