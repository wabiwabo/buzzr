import api from '@/services/api';
import type { Transaction, OverdueInvoice, PaymentTimeseriesRow } from './types';

export async function fetchOverdueInvoices(): Promise<OverdueInvoice[]> {
  const { data } = await api.get<OverdueInvoice[]>('/payments/overdue');
  return data.map((t) => ({ ...t, amount: Number(t.amount) }));
}

export async function fetchPaymentTimeseries(from: string, to: string): Promise<PaymentTimeseriesRow[]> {
  const { data } = await api.get<PaymentTimeseriesRow[]>('/reports/payments/timeseries', { params: { from, to } });
  return data.map((r) => ({
    ...r,
    total_invoices: Number(r.total_invoices),
    paid_invoices: Number(r.paid_invoices),
    revenue: Number(r.revenue),
    collection_rate: Number(r.collection_rate),
  }));
}

export async function createInvoice(body: {
  userId: string;
  type: string;
  amount: number;
  description?: string;
}): Promise<Transaction> {
  const { data } = await api.post('/payments', body);
  return data;
}
