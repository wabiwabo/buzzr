import React, { useEffect, useMemo, useState } from 'react';
import dayjs from 'dayjs';
import { toast } from 'sonner';
import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useReportPageStore } from '../store';
import { fetchPaymentTimeseries } from '../api';
import type { PaymentTimeseriesRow } from '../types';
import { formatRupiah } from '../types';

export const PaymentTab: React.FC = () => {
  const { from, to } = useReportPageStore();
  const [series, setSeries] = useState<PaymentTimeseriesRow[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchPaymentTimeseries(from, to)
      .then((d) => { if (!cancelled) setSeries(d); })
      .catch((err) => {
        if (!cancelled) toast.error(err?.response?.data?.message || 'Gagal memuat data pembayaran');
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [from, to]);

  const summary = useMemo(() => {
    const totalRevenue = series.reduce((s, r) => s + r.revenue, 0);
    const totalInvoices = series.reduce((s, r) => s + r.total_invoices, 0);
    const paidInvoices = series.reduce((s, r) => s + r.paid_invoices, 0);
    const collectionRate = totalInvoices > 0 ? Math.round((paidInvoices / totalInvoices) * 100 * 10) / 10 : 0;
    return { totalRevenue, totalInvoices, paidInvoices, collectionRate };
  }, [series]);

  const chartData = useMemo(() => series.map((r) => ({
    date: dayjs(r.date).format('DD MMM'),
    revenue: r.revenue,
    total: r.total_invoices,
    paid: r.paid_invoices,
    rate: r.collection_rate,
  })), [series]);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        {loading ? (
          <>{Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}><CardContent className="pt-4 pb-4"><Skeleton className="h-16 w-full" /></CardContent></Card>
          ))}</>
        ) : (
          <>
            <Card><CardContent className="pt-4 pb-4">
              <p className="text-sm text-muted-foreground">Total Pendapatan</p>
              <p className="text-2xl font-semibold mt-1 tabular-nums">{formatRupiah(summary.totalRevenue)}</p>
            </CardContent></Card>
            <Card><CardContent className="pt-4 pb-4">
              <p className="text-sm text-muted-foreground">Total Faktur</p>
              <p className="text-2xl font-semibold mt-1 tabular-nums">{summary.totalInvoices}</p>
            </CardContent></Card>
            <Card><CardContent className="pt-4 pb-4">
              <p className="text-sm text-muted-foreground">Dibayar</p>
              <p className="text-2xl font-semibold mt-1 tabular-nums text-positive">{summary.paidInvoices}</p>
            </CardContent></Card>
            <Card><CardContent className="pt-4 pb-4">
              <p className="text-sm text-muted-foreground">Tingkat Penagihan</p>
              <p className="text-2xl font-semibold mt-1 tabular-nums">{summary.collectionRate}<span className="text-sm font-normal text-muted-foreground">%</span></p>
            </CardContent></Card>
          </>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Pendapatan Harian</CardTitle></CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-[220px] w-full" /> : (
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${Math.round(v / 1000)}k`} />
                  <Tooltip formatter={(v: number) => [formatRupiah(v), 'Pendapatan']} />
                  <Area type="monotone" dataKey="revenue" stroke="#22C55E" fill="#22C55E" fillOpacity={0.15} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Tingkat Penagihan (%)</CardTitle></CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-[220px] w-full" /> : (
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v: number) => [`${v}%`, 'Penagihan']} />
                  <Area type="monotone" dataKey="rate" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.15} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="col-span-2">
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Volume Faktur Harian</CardTitle></CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-[220px] w-full" /> : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="total" name="Total" fill="#9CA3AF" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="paid" name="Dibayar" fill="#22C55E" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
