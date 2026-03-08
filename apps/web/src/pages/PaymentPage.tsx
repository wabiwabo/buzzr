import React, { useEffect, useState } from 'react';
import { Row, Col, Tabs, Tag, message } from 'antd';
import { DollarOutlined, CheckCircleOutlined, ClockCircleOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import api from '../services/api';
import { PageHeader, StatCard, StatusBadge, PageTransition } from '../components/common';
import { SmartTable, DetailDrawer } from '../components/data';
import { useTableState } from '../hooks/useTableState';

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

const typeLabels: Record<string, string> = {
  retribution: 'Retribusi',
  bank_sampah_buy: 'Beli Bank Sampah',
  bank_sampah_sell: 'Jual Bank Sampah',
  reward_redeem: 'Tukar Reward',
  payout: 'Pencairan',
};

const PaymentPage: React.FC = () => {
  const tableState = useTableState<Payment>({ searchFields: ['user_name', 'description', 'reference_id'] });
  const [activeTab, setActiveTab] = useState('all');
  const [drawerRecord, setDrawerRecord] = useState<Payment | null>(null);
  const [overdueData, setOverdueData] = useState<Payment[]>([]);

  const fetchData = async () => {
    tableState.setLoading(true);
    try {
      const [allRes, overdueRes] = await Promise.allSettled([
        api.get('/payments'),
        api.get('/payments/overdue'),
      ]);
      if (allRes.status === 'fulfilled') {
        tableState.setData(Array.isArray(allRes.value.data) ? allRes.value.data : []);
      }
      if (overdueRes.status === 'fulfilled') {
        setOverdueData(Array.isArray(overdueRes.value.data) ? overdueRes.value.data : []);
      }
    } catch { message.error('Gagal memuat data pembayaran'); }
    tableState.setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const handleTabChange = (key: string) => {
    setActiveTab(key);
    if (key === 'overdue') {
      tableState.setData(overdueData);
    } else if (key === 'all') {
      fetchData();
    } else {
      // Filter by status client-side from all data
      fetchData();
    }
  };

  const allData = tableState.data;
  const totalAmount = allData.reduce((sum, p) => sum + Number(p.amount || 0), 0);
  const paidAmount = allData.filter((p) => p.status === 'paid').reduce((sum, p) => sum + Number(p.amount || 0), 0);
  const pendingCount = allData.filter((p) => p.status === 'pending').length;

  const columns: ColumnsType<Payment> = [
    { title: 'User', width: 160, render: (_, r) => r.user_name || r.user_id?.slice(0, 8), ellipsis: true },
    { title: 'Tipe', dataIndex: 'type', width: 140, render: (v) => typeLabels[v] || v },
    {
      title: 'Jumlah', dataIndex: 'amount', width: 150, sorter: true,
      render: (v) => `Rp${Number(v || 0).toLocaleString('id-ID')}`,
    },
    { title: 'Status', dataIndex: 'status', width: 120, render: (v) => <StatusBadge status={v} /> },
    { title: 'Tanggal', dataIndex: 'created_at', width: 120, render: (v) => dayjs(v).format('DD MMM YYYY') },
    { title: 'Referensi', dataIndex: 'reference_id', ellipsis: true, width: 140 },
  ];

  const tabItems = [
    { key: 'all', label: 'Semua' },
    { key: 'overdue', label: `Jatuh Tempo (${overdueData.length})` },
    { key: 'pending', label: 'Pending' },
    { key: 'paid', label: 'Dibayar' },
    { key: 'failed', label: 'Gagal' },
  ];

  return (
    <PageTransition>
    <div>
      <PageHeader
        title="Pembayaran"
        description="Kelola tagihan dan pembayaran retribusi"
        breadcrumbs={[{ label: 'Dashboard', path: '/' }, { label: 'Pembayaran' }]}
      />

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={8}>
          <StatCard
            title="Total Tagihan"
            value={`Rp${totalAmount.toLocaleString('id-ID')}`}
            prefix={<DollarOutlined style={{ color: '#1677ff' }} />}
            loading={tableState.loading}
          />
        </Col>
        <Col xs={24} sm={8}>
          <StatCard
            title="Sudah Dibayar"
            value={`Rp${paidAmount.toLocaleString('id-ID')}`}
            prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
            valueStyle={{ color: '#52c41a' }}
            loading={tableState.loading}
          />
        </Col>
        <Col xs={24} sm={8}>
          <StatCard
            title="Pending"
            value={pendingCount}
            suffix="transaksi"
            prefix={<ClockCircleOutlined style={{ color: '#ff4d4f' }} />}
            valueStyle={{ color: '#ff4d4f' }}
            loading={tableState.loading}
          />
        </Col>
      </Row>

      <Tabs activeKey={activeTab} onChange={handleTabChange} items={tabItems} style={{ marginBottom: 16 }} />

      <SmartTable<Payment>
        tableState={tableState}
        columns={columns}
        searchPlaceholder="Cari user, deskripsi, referensi..."
        exportFileName="data-pembayaran"
        exportColumns={[
          { title: 'User', dataIndex: 'user_name' },
          { title: 'Tipe', dataIndex: 'type', render: (v: string) => typeLabels[v] || v },
          { title: 'Jumlah', dataIndex: 'amount', render: (v: any) => `Rp${Number(v || 0).toLocaleString('id-ID')}` },
          { title: 'Status', dataIndex: 'status' },
          { title: 'Tanggal', dataIndex: 'created_at' },
          { title: 'Referensi', dataIndex: 'reference_id' },
        ]}
        onRefresh={fetchData}
        onRowClick={(r) => setDrawerRecord(r)}
        emptyTitle="Belum ada data retribusi"
        emptyDescription="Data retribusi akan muncul setelah pembayaran pertama tercatat di sistem."
      />

      <DetailDrawer
        open={!!drawerRecord}
        onClose={() => setDrawerRecord(null)}
        title="Detail Pembayaran"
        fields={drawerRecord ? [
          { label: 'User', value: drawerRecord.user_name || drawerRecord.user_id },
          { label: 'Tipe', value: typeLabels[drawerRecord.type] || drawerRecord.type },
          { label: 'Jumlah', value: `Rp${Number(drawerRecord.amount || 0).toLocaleString('id-ID')}` },
          { label: 'Status', value: <StatusBadge status={drawerRecord.status} /> },
          { label: 'Tanggal', value: dayjs(drawerRecord.created_at).format('DD MMM YYYY, HH:mm') },
          { label: 'Referensi', value: drawerRecord.reference_id || '-' },
          { label: 'Deskripsi', value: drawerRecord.description || '-' },
        ] : []}
      />
    </div>
    </PageTransition>
  );
};

export default PaymentPage;
