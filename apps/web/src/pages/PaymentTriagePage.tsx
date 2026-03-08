import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import api from '@/services/api';
import { TriageLayout } from '@/components/triage';
import { FilterSidebar } from '@/components/triage/FilterSidebar';
import type { TriageRowData } from '@/components/triage/TriageListRow';
import type { TriagePreviewData } from '@/components/triage/TriagePreview';
import { useFacetedFilter } from '@/hooks/useFacetedFilter';
import { useTriageSelection } from '@/hooks/useTriageSelection';
import { useTriageKeyboard } from '@/hooks/useTriageKeyboard';
import { useSavedViews } from '@/hooks/useSavedViews';
import { STATUS_LABELS } from '@/theme/tokens';
import { toast } from 'sonner';

interface ApiPayment {
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

const SEVERITY_MAP: Record<string, 'critical' | 'warning' | 'info'> = {
  failed: 'critical',
  pending: 'warning',
  paid: 'info',
};

const FACET_DIMENSIONS = [
  { key: 'status', label: 'Status', getValue: (item: Record<string, unknown>) => item.status as string },
  { key: 'type', label: 'Tipe', getValue: (item: Record<string, unknown>) => item.type as string },
];

const GROUP_BY_OPTIONS = [
  { value: 'none', label: 'Tidak ada' },
  { value: 'status', label: 'Status' },
  { value: 'type', label: 'Tipe' },
];

const DEFAULT_VIEWS: Array<{ id: string; name: string; filters: Record<string, string[]> }> = [
  { id: 'all', name: 'Semua', filters: {} },
  { id: 'pending', name: 'Menunggu', filters: { status: ['pending'] } },
  { id: 'failed', name: 'Gagal', filters: { status: ['failed'] } },
];

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(amount);
}

function mapToRowData(payment: ApiPayment): TriageRowData & Record<string, unknown> {
  return {
    id: payment.id,
    title: `${formatCurrency(payment.amount)} — ${payment.user_name || payment.user_id}`,
    meta: `${TYPE_LABELS[payment.type] || payment.type} · ${payment.description?.slice(0, 40) || ''}`,
    severity: SEVERITY_MAP[payment.status] || 'info',
    createdAt: payment.created_at,
    isUnread: payment.status === 'pending',
    status: payment.status,
    type: payment.type,
  };
}

function mapToPreviewData(payment: ApiPayment): TriagePreviewData {
  return {
    id: payment.id,
    title: `${formatCurrency(payment.amount)}`,
    description: payment.description || '',
    status: payment.status,
    category: TYPE_LABELS[payment.type] || payment.type,
    reporterName: payment.user_name || payment.user_id,
    createdAt: payment.created_at,
    timeline: [
      { time: payment.created_at, label: `Pembayaran dibuat: ${TYPE_LABELS[payment.type] || payment.type}`, type: 'created' as 'created' },
    ],
  };
}

export default function PaymentTriagePage() {
  const searchRef = useRef<HTMLInputElement>(null);
  const [payments, setPayments] = useState<ApiPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [groupBy, setGroupBy] = useState('none');

  const rowItems = useMemo(() => payments.map(mapToRowData), [payments]);

  const { filtered, facetCounts, search, setSearch, toggleFilter, removeFilter, resetFilters, activeFilters } =
    useFacetedFilter({ items: rowItems, dimensions: FACET_DIMENSIONS, searchFields: ['title', 'meta'] });

  const { selectedId, checkedIds, select, selectNext, selectPrev, toggleCheck, checkRange, clearChecked } =
    useTriageSelection({ items: filtered as TriageRowData[], getId: (item) => item.id });

  const { views, activeViewId, selectView } = useSavedViews('payments', DEFAULT_VIEWS);

  const previewData = useMemo(() => {
    if (!selectedId) return null;
    const p = payments.find((p) => p.id === selectedId);
    return p ? mapToPreviewData(p) : null;
  }, [selectedId, payments]);

  const fetchPayments = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/payments');
      setPayments(res.data);
    } catch {
      toast.error('Gagal memuat data pembayaran');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchPayments(); }, [fetchPayments]);

  useTriageKeyboard({
    onNext: selectNext, onPrev: selectPrev,
    onTogglePreview: () => {}, onOpenDetail: () => {},
    onAssign: () => {}, onStatusChange: () => {},
    onResolve: () => {}, onReject: () => {},
    onAddNote: () => {}, onCyclePriority: () => {},
    onFocusSearch: () => searchRef.current?.focus(),
    onShowHelp: () => {}, onToggleSidebar: () => {},
    onClearSelection: clearChecked,
  });

  return (
    <div className="p-4">
      <div className="mb-4">
        <h1 className="text-xl font-semibold">Pembayaran</h1>
        <p className="text-sm text-muted-foreground">{filtered.length} dari {rowItems.length} pembayaran</p>
      </div>
      <TriageLayout
        items={filtered as TriageRowData[]} loading={loading}
        selectedId={selectedId} checkedIds={checkedIds}
        onSelect={select} onCheck={toggleCheck} onShiftClick={checkRange} onClearChecked={clearChecked}
        search={search} onSearchChange={setSearch} searchRef={searchRef}
        groupBy={groupBy} onGroupByChange={setGroupBy} groupByOptions={GROUP_BY_OPTIONS}
        activeFilters={activeFilters} onRemoveFilter={removeFilter}
        onRefresh={fetchPayments} onShowHelp={() => {}}
        onBulkAssign={() => {}} onBulkStatus={() => {}}
        previewData={previewData}
        onStatusTransition={() => {}} onAssign={() => {}}
        filterSidebar={
          <FilterSidebar
            views={views} activeViewId={activeViewId} onSelectView={selectView}
            facets={[
              { key: 'status', label: 'Status', labelMap: STATUS_LABELS },
              { key: 'type', label: 'Tipe', labelMap: TYPE_LABELS },
            ]}
            facetCounts={facetCounts} onToggleFilter={toggleFilter}
            onResetFilters={resetFilters} hasActiveFilters={activeFilters.length > 0}
          />
        }
      />
    </div>
  );
}
