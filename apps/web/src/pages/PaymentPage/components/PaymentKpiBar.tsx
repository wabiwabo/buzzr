import React from 'react';
import { Wallet, CheckCircle, Clock, TrendingUp } from 'lucide-react';
import { StatCard } from '@/components/common';
import { formatRupiah } from '../types';

interface PaymentKpiBarProps {
  totalRevenue: number;
  paidCount: number;
  pendingCount: number;
  collectionRate: number;
  loading?: boolean;
}

export const PaymentKpiBar: React.FC<PaymentKpiBarProps> = ({
  totalRevenue,
  paidCount,
  pendingCount,
  collectionRate,
  loading = false,
}) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <StatCard
        title="Total Pendapatan"
        value={formatRupiah(totalRevenue)}
        prefix={<Wallet className="h-4 w-4" />}
        loading={loading}
      />
      <StatCard
        title="Faktur Dibayar"
        value={paidCount}
        prefix={<CheckCircle className="h-4 w-4" />}
        loading={loading}
      />
      <StatCard
        title="Menunggu / Tertunggak"
        value={pendingCount}
        prefix={<Clock className="h-4 w-4" />}
        loading={loading}
        valueStyle={pendingCount > 0 ? { color: 'var(--color-warning)' } : undefined}
      />
      <StatCard
        title="Tingkat Penagihan"
        value={collectionRate}
        suffix="%"
        prefix={<TrendingUp className="h-4 w-4" />}
        loading={loading}
      />
    </div>
  );
};
