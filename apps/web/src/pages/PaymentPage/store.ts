import { create } from 'zustand';
import type { OverdueInvoice, PaymentTab, PaymentAnalytics, PaymentTimeseriesRow } from './types';

interface PaymentPageState {
  overdue: OverdueInvoice[];
  timeseries: PaymentTimeseriesRow[];
  activeTab: PaymentTab;
  isLoading: boolean;
  dataVersion: number;

  setOverdue: (data: OverdueInvoice[]) => void;
  setTimeseries: (data: PaymentTimeseriesRow[]) => void;
  setActiveTab: (tab: PaymentTab) => void;
  setLoading: (loading: boolean) => void;
  invalidateData: () => void;
}

export const usePaymentPageStore = create<PaymentPageState>((set) => ({
  overdue: [],
  timeseries: [],
  activeTab: 'kelola',
  isLoading: false,
  dataVersion: 0,

  setOverdue: (overdue) => set({ overdue }),
  setTimeseries: (timeseries) => set({ timeseries }),
  setActiveTab: (activeTab) => set({ activeTab }),
  setLoading: (isLoading) => set({ isLoading }),
  invalidateData: () => set((s) => ({ dataVersion: s.dataVersion + 1 })),
}));

export function computeAnalytics(timeseries: PaymentTimeseriesRow[]): PaymentAnalytics {
  const totalRevenue = timeseries.reduce((s, r) => s + r.revenue, 0);
  const paidCount = timeseries.reduce((s, r) => s + r.paid_invoices, 0);
  const totalInvoices = timeseries.reduce((s, r) => s + r.total_invoices, 0);
  const pendingCount = totalInvoices - paidCount;
  const collectionRate = totalInvoices > 0 ? Math.round((paidCount / totalInvoices) * 100 * 10) / 10 : 0;

  return {
    totalRevenue,
    paidCount,
    pendingCount,
    collectionRate,
    byStatus: [],
    byType: [],
    byMethod: [],
  };
}
