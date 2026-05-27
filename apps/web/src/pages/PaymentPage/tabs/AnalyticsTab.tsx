import React, { useMemo, useState, useEffect } from 'react';
import dayjs from 'dayjs';
import { toast } from 'sonner';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { PaymentKpiBar } from '../components/PaymentKpiBar';
import { fetchPaymentTimeseries, fetchOverdueInvoices } from '../api';
import { usePaymentPageStore, computeAnalytics } from '../store';
import { formatRupiah } from '../types';

export const AnalyticsTab: React.FC = () => {
  const { overdue, timeseries, isLoading, setOverdue, setTimeseries, setLoading } = usePaymentPageStore();
  const [from, setFrom] = useState(() => dayjs().subtract(30, 'day').format('YYYY-MM-DD'));
  const [to, setTo] = useState(() => dayjs().format('YYYY-MM-DD'));

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    Promise.all([
      fetchPaymentTimeseries(from, to),
      fetchOverdueInvoices(),
    ])
      .then(([ts, od]) => {
        if (!cancelled) {
          setTimeseries(ts);
          setOverdue(od);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          toast.error(err?.response?.data?.message || 'Gagal memuat analitik pembayaran');
        }
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [from, to]);

  const analytics = useMemo(() => computeAnalytics(timeseries), [timeseries]);

  const chartData = useMemo(() => timeseries.map((r) => ({
    date: dayjs(r.date).format('DD MMM'),
    revenue: r.revenue,
    total: r.total_invoices,
    paid: r.paid_invoices,
    rate: r.collection_rate,
  })), [timeseries]);

  return (
    <div className="space-y-4">
      <div className="flex items-end gap-3">
        <div className="space-y-1">
          <Label className="text-xs">Dari</Label>
          <Input
            type="date" value={from} max={to}
            onChange={(e) => setFrom(e.target.value)}
            className="h-8 w-40 text-sm"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Sampai</Label>
          <Input
            type="date" value={to} min={from} max={dayjs().format('YYYY-MM-DD')}
            onChange={(e) => setTo(e.target.value)}
            className="h-8 w-40 text-sm"
          />
        </div>
      </div>

      <PaymentKpiBar
        totalRevenue={analytics.totalRevenue}
        paidCount={analytics.paidCount}
        pendingCount={analytics.pendingCount + overdue.length}
        collectionRate={analytics.collectionRate}
        loading={isLoading}
      />

      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Pendapatan Harian</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${Math.round(v / 1000)}k`} />
                <Tooltip formatter={(v: number) => [formatRupiah(v), 'Pendapatan']} />
                <Area type="monotone" dataKey="revenue" stroke="#22C55E" fill="#22C55E" fillOpacity={0.15} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Tingkat Penagihan (%)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v: number) => [`${v}%`, 'Penagihan']} />
                <Area type="monotone" dataKey="rate" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.15} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Volume Faktur Harian</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="total" name="Total" fill="#9CA3AF" radius={[4, 4, 0, 0]} />
                <Bar dataKey="paid" name="Dibayar" fill="#22C55E" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              Faktur Tertunggak
              {overdue.length > 0 && (
                <Badge variant="outline" className="text-xs text-negative border-negative/30">
                  {overdue.length}
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-[220px] overflow-y-auto">
              {overdue.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Tidak ada faktur tertunggak
                </p>
              )}
              {overdue.slice(0, 10).map((inv) => (
                <div key={inv.id} className="flex items-center justify-between gap-2 text-sm">
                  <span className="min-w-0">
                    <span className="font-medium truncate block">{inv.user_name || inv.user_id || '-'}</span>
                    <span className="text-xs text-muted-foreground">
                      {inv.expired_at ? `Kadaluarsa ${dayjs(inv.expired_at).format('DD MMM')}` : ''}
                    </span>
                  </span>
                  <span className="text-sm tabular-nums font-medium text-negative">
                    {formatRupiah(Number(inv.amount))}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
