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

interface Payment {
  id: string;
  user_id: string;
  user_name?: string;
  type: string;
  amount: number;
  status: string;
  created_at: string;
  reference_id: string | null;
  description: string;
}

const TYPE_LABELS: Record<string, string> = {
  retribution: 'Retribusi',
  bank_sampah_buy: 'Beli Bank Sampah',
  bank_sampah_sell: 'Jual Bank Sampah',
  reward_redeem: 'Tukar Poin',
  payout: 'Pencairan',
};

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(amount);
}

const typeOptions = Object.entries(TYPE_LABELS).map(([value, label]) => ({ value, label }));
const statusOptions = Object.entries(STATUS_LABELS).map(([value, label]) => ({ value, label: label as string }));

const paymentFilterDefs: FilterDef[] = [
  { key: 't.status', label: 'Status', type: 'select', options: statusOptions },
  { key: 't.type', label: 'Tipe', type: 'select', options: typeOptions },
];

const columnHelper = createColumnHelper<Payment>();

export default function PaymentTriagePage() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const searchTextRef = useRef('');

  const columns = useMemo(() => [
    columnHelper.accessor('reference_id', {
      header: ({ column }) => <DataTableColumnHeader column={column} title="Referensi" />,
      cell: (info) => (
        <span className="text-sm font-mono">
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
        <span className="text-sm font-medium tabular-nums">{formatCurrency(info.getValue())}</span>
      ),
    }),
    columnHelper.accessor('status', {
      header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
      cell: (info) => <StatusBadge status={info.getValue()} />,
    }),
    columnHelper.accessor('user_name', {
      header: ({ column }) => <DataTableColumnHeader column={column} title="Pengguna" />,
      cell: (info) => (
        <span className="text-sm">
          <Highlight text={info.getValue() || '-'} query={searchTextRef.current} />
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
  ], []);

  const {
    table, isLoading, meta, searchText, setSearchText,
    filters, setFilter, resetFilters, activeFilterCount, refetch, setPage, setLimit,
  } = useServerTable<Payment>({
    endpoint: '/payments',
    columnDefs: columns,
    defaultSort: { field: 't.created_at', order: 'desc' },
    filterDefs: paymentFilterDefs,
    columnMap: { type: 't.type', amount: 't.amount', status: 't.status', created_at: 't.created_at' },
  });

  searchTextRef.current = searchText;

  useDataTableKeyboard({
    table,
    activeIndex,
    setActiveIndex,
    onEnter: (row) => setSelectedPayment(row),
    onEscape: () => setSelectedPayment(null),
  });

  const renderPreview = useCallback(() => {
    if (!selectedPayment) return null;
    return (
      <div className="space-y-4">
        <div>
          <h3 className="font-medium text-sm">{formatCurrency(selectedPayment.amount)}</h3>
          <p className="text-xs text-muted-foreground mt-1">
            {TYPE_LABELS[selectedPayment.type] || selectedPayment.type}
            {selectedPayment.reference_id && ` · ${selectedPayment.reference_id}`}
          </p>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Status</span>
            <StatusBadge status={selectedPayment.status} />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Pengguna</span>
            <span className="text-sm">{selectedPayment.user_name || selectedPayment.user_id}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Tanggal</span>
            <span className="text-sm tabular-nums">{dayjs(selectedPayment.created_at).format('DD MMM YYYY, HH:mm')}</span>
          </div>
          {selectedPayment.description && (
            <div>
              <span className="text-xs text-muted-foreground block">Deskripsi</span>
              <span className="text-sm">{selectedPayment.description}</span>
            </div>
          )}
        </div>
      </div>
    );
  }, [selectedPayment]);

  return (
    <PageTransition>
      <div>
        <PageHeader
          title="Pembayaran"
          description={`${meta.total} pembayaran`}
          breadcrumbs={[{ label: 'Dashboard', path: '/' }, { label: 'Pembayaran' }]}
        />

        <DataTable
          table={table}
          meta={meta}
          isLoading={isLoading}
          searchText={searchText}
          onSearchChange={setSearchText}
          searchPlaceholder="Cari referensi, pengguna..."
          filters={filters}
          onFilterChange={setFilter}
          onResetFilters={resetFilters}
          activeFilterCount={activeFilterCount}
          filterDefs={paymentFilterDefs}
          filterLabels={{ 't.status': 'Status', 't.type': 'Tipe' }}
          onPageChange={setPage}
          onLimitChange={setLimit}
          onRefresh={refetch}
          onRowClick={(r) => setSelectedPayment(r)}
          activeIndex={activeIndex}
          setActiveIndex={setActiveIndex}
          previewOpen={!!selectedPayment}
          onPreviewClose={() => setSelectedPayment(null)}
          renderPreview={renderPreview}
          previewMode="split"
          emptyTitle="Tidak ada pembayaran"
          emptyDescription="Belum ada transaksi pembayaran"
        />
      </div>
    </PageTransition>
  );
}
