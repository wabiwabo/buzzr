import React, { useEffect, useState } from 'react';
import { Table, Row, Col, Card, Statistic, Tag, Tabs, Alert, Spin } from 'antd';
import { DollarOutlined, ClockCircleOutlined, CheckCircleOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import { PaymentStatus, PaymentType } from '@buzzr/shared-types';
import { PAYMENT_STATUS_LABELS } from '@buzzr/constants';
import type { ColumnsType } from 'antd/es/table';
import api from '../services/api';

interface Payment {
  id: string;
  user_id: string;
  user_name?: string;
  type: PaymentType;
  amount: number;
  status: PaymentStatus;
  created_at: string;
  reference_id: string | null;
  description: string;
}

const statusColors: Record<string, string> = {
  pending: 'orange',
  paid: 'green',
  failed: 'red',
  expired: 'default',
  refunded: 'purple',
};

const typeLabels: Record<string, string> = {
  retribution: 'Retribusi',
  bank_sampah_buy: 'Beli Bank Sampah',
  bank_sampah_sell: 'Jual Bank Sampah',
  reward_redeem: 'Tukar Reward',
  payout: 'Pencairan',
};

export default function PaymentPage() {
  const [data, setData] = useState<Payment[]>([]);
  const [overdueData, setOverdueData] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>('all');

  const fetchData = async () => {
    try {
      setLoading(true);
      const [allRes, overdueRes] = await Promise.all([
        api.get('/payments'),
        api.get('/payments/overdue').catch(() => ({ data: [] })),
      ]);
      setData(allRes.data);
      setOverdueData(Array.isArray(overdueRes.data) ? overdueRes.data : []);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Gagal memuat data pembayaran');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const currentData = activeTab === 'overdue' ? overdueData : data;
  const filteredData = activeTab === 'all' || activeTab === 'overdue'
    ? currentData
    : currentData.filter((p) => p.status === activeTab);

  // Summary stats
  const totalAmount = data.reduce((sum, p) => sum + Number(p.amount || 0), 0);
  const paidAmount = data.filter((p) => p.status === PaymentStatus.PAID).reduce((sum, p) => sum + Number(p.amount || 0), 0);
  const pendingCount = data.filter((p) => p.status === PaymentStatus.PENDING).length;

  const columns: ColumnsType<Payment> = [
    {
      title: 'User', key: 'user',
      render: (_: any, r: Payment) => r.user_name || r.user_id,
      ellipsis: true,
    },
    {
      title: 'Tipe', dataIndex: 'type', key: 'type',
      render: (t: string) => typeLabels[t] || t,
    },
    {
      title: 'Jumlah', dataIndex: 'amount', key: 'amount',
      render: (a: number) => `Rp ${Number(a || 0).toLocaleString('id-ID')}`,
    },
    {
      title: 'Status', dataIndex: 'status', key: 'status',
      render: (s: PaymentStatus) => (
        <Tag color={statusColors[s] || 'default'}>
          {PAYMENT_STATUS_LABELS[s] || s}
        </Tag>
      ),
    },
    {
      title: 'Tanggal', dataIndex: 'created_at', key: 'created_at',
      render: (d: string) => d ? new Date(d).toLocaleDateString('id-ID') : '-',
    },
    { title: 'Referensi', dataIndex: 'reference_id', key: 'reference_id', ellipsis: true },
  ];

  const tabItems = [
    { key: 'all', label: 'Semua' },
    { key: 'overdue', label: `Jatuh Tempo (${overdueData.length})` },
    ...Object.values(PaymentStatus).map((s) => ({
      key: s,
      label: PAYMENT_STATUS_LABELS[s] || s,
    })),
  ];

  if (error && !data.length) return <Alert type="error" message={error} />;

  return (
    <>
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={8}>
          <Card>
            <Statistic title="Total Tagihan" value={totalAmount} prefix={<DollarOutlined />}
              formatter={(v) => `Rp ${Number(v).toLocaleString('id-ID')}`} />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic title="Sudah Dibayar" value={paidAmount} prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#3f8600' }}
              formatter={(v) => `Rp ${Number(v).toLocaleString('id-ID')}`} />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic title="Pending" value={pendingCount} prefix={<ClockCircleOutlined />}
              valueStyle={{ color: '#cf1322' }} suffix="transaksi" />
          </Card>
        </Col>
      </Row>

      <Tabs activeKey={activeTab} onChange={setActiveTab} items={tabItems} style={{ marginBottom: 16 }} />

      <Table columns={columns} dataSource={filteredData} rowKey="id" loading={loading} pagination={{ pageSize: 10 }} />
    </>
  );
}
