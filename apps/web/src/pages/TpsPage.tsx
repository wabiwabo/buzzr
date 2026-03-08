import React, { useEffect, useState } from 'react';
import { Modal, Form, Input, InputNumber, Select, Progress, Button, Space, Dropdown, message } from 'antd';
import { EditOutlined, EyeOutlined, MoreOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import api from '../services/api';
import { PageHeader, StatusBadge, InfoTooltip } from '../components/common';
import { SmartTable, DetailDrawer } from '../components/data';
import { useTableState } from '../hooks/useTableState';
import type { FilterDef } from '../hooks/useTableState';

interface Tps {
  id: string;
  name: string;
  type: string;
  status: string;
  capacity_tons: number;
  current_load_tons: number;
  address: string;
  latitude: number;
  longitude: number;
  qr_code: string;
  area_id: string;
}

const typeLabels: Record<string, string> = { tps: 'TPS', tps3r: 'TPS 3R', bank_sampah: 'Bank Sampah' };

const filterDefs: FilterDef[] = [
  { key: 'type', label: 'Tipe', type: 'select', options: [
    { label: 'TPS', value: 'tps' }, { label: 'TPS 3R', value: 'tps3r' }, { label: 'Bank Sampah', value: 'bank_sampah' },
  ]},
  { key: 'status', label: 'Status', type: 'select', options: [
    { label: 'Aktif', value: 'active' }, { label: 'Penuh', value: 'full' }, { label: 'Maintenance', value: 'maintenance' },
  ]},
];

const TpsPage: React.FC = () => {
  const tableState = useTableState<Tps>({ searchFields: ['name', 'address'], defaultPageSize: 10 });
  const [modalOpen, setModalOpen] = useState(false);
  const [drawerRecord, setDrawerRecord] = useState<Tps | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [form] = Form.useForm();

  const fetchData = async () => {
    tableState.setLoading(true);
    try {
      const { data } = await api.get('/tps');
      tableState.setData(Array.isArray(data) ? data : []);
    } catch { message.error('Gagal memuat data TPS'); }
    tableState.setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const handleCreate = async (values: any) => {
    setSubmitting(true);
    try {
      await api.post('/tps', { ...values, capacityTons: values.capacity_tons, areaId: values.area_id });
      message.success('TPS berhasil ditambahkan');
      setModalOpen(false);
      form.resetFields();
      fetchData();
    } catch { message.error('Gagal menambahkan TPS'); }
    setSubmitting(false);
  };

  const columns: ColumnsType<Tps> = [
    { title: 'Nama', dataIndex: 'name', sorter: true, width: 180 },
    { title: 'Tipe', dataIndex: 'type', width: 120, render: (v) => typeLabels[v] || v },
    { title: 'Status', dataIndex: 'status', width: 120, render: (v) => <StatusBadge status={v} /> },
    {
      title: <>Kapasitas <InfoTooltip text="Kapasitas maksimum TPS dalam ton" /></>,
      dataIndex: 'capacity_tons',
      width: 120,
      render: (v) => `${v} ton`,
      sorter: true,
    },
    {
      title: <>Beban <InfoTooltip text="Estimasi beban saat ini" /></>,
      width: 160,
      render: (_, record) => {
        const pct = record.capacity_tons > 0
          ? Math.round((Number(record.current_load_tons || 0) / record.capacity_tons) * 100)
          : 0;
        const color = pct > 90 ? '#ff4d4f' : pct > 70 ? '#faad14' : '#52c41a';
        return (
          <Space>
            <Progress percent={pct} size="small" strokeColor={color} style={{ width: 80 }} showInfo={false} />
            <span style={{ fontSize: 12, color }}>{pct}%</span>
          </Space>
        );
      },
    },
    { title: 'Alamat', dataIndex: 'address', ellipsis: true, width: 200 },
    {
      title: 'Aksi',
      width: 80,
      render: (_, record) => (
        <Dropdown menu={{
          items: [
            { key: 'view', icon: <EyeOutlined />, label: 'Detail', onClick: () => setDrawerRecord(record) },
            { key: 'edit', icon: <EditOutlined />, label: 'Edit' },
          ],
        }}>
          <Button type="text" icon={<MoreOutlined />} size="small" />
        </Dropdown>
      ),
    },
  ];

  const exportColumns = [
    { title: 'Nama', dataIndex: 'name' },
    { title: 'Tipe', dataIndex: 'type', render: (v: string) => typeLabels[v] || v },
    { title: 'Status', dataIndex: 'status' },
    { title: 'Kapasitas (ton)', dataIndex: 'capacity_tons' },
    { title: 'Beban (ton)', dataIndex: 'current_load_tons' },
    { title: 'Alamat', dataIndex: 'address' },
  ];

  return (
    <div>
      <PageHeader
        title="Manajemen TPS"
        description="Kelola semua Tempat Pembuangan Sampah"
        breadcrumbs={[{ label: 'Dashboard', path: '/' }, { label: 'TPS' }]}
        primaryAction={{ label: 'Tambah TPS', onClick: () => setModalOpen(true) }}
      />

      <SmartTable<Tps>
        tableState={tableState}
        columns={columns}
        filterDefs={filterDefs}
        searchPlaceholder="Cari nama atau alamat TPS..."
        exportFileName="data-tps"
        exportColumns={exportColumns}
        onRefresh={fetchData}
        onRowClick={(record) => setDrawerRecord(record)}
        emptyTitle="Belum ada TPS terdaftar"
        emptyDescription="Tambahkan TPS pertama untuk mulai memantau kapasitas"
        emptyActionLabel="Tambah TPS"
        onEmptyAction={() => setModalOpen(true)}
        expandable={{
          expandedRowRender: (record) => (
            <div style={{ padding: '8px 0' }}>
              <Space direction="vertical" size={4}>
                <span>Alamat: {record.address}</span>
                <span>Koordinat: {record.latitude}, {record.longitude}</span>
                <span>QR: {record.qr_code || '-'}</span>
              </Space>
            </div>
          ),
        }}
      />

      <Modal
        title="Tambah TPS Baru"
        open={modalOpen}
        onCancel={() => { setModalOpen(false); form.resetFields(); }}
        footer={null}
        width={560}
      >
        <Form form={form} layout="vertical" onFinish={handleCreate}>
          <div style={{ marginBottom: 16 }}>
            <span style={{ fontWeight: 500, fontSize: 13, color: 'rgba(0,0,0,0.65)' }}>Informasi Dasar</span>
          </div>
          <Form.Item name="name" label="Nama TPS" rules={[{ required: true, message: 'Wajib diisi' }]}>
            <Input placeholder="Contoh: TPS Cimahi Utara" />
          </Form.Item>
          <Space style={{ width: '100%' }} size={16}>
            <Form.Item name="type" label="Tipe" rules={[{ required: true }]} style={{ flex: 1 }}>
              <Select placeholder="Pilih tipe" options={[
                { label: 'TPS', value: 'tps' }, { label: 'TPS 3R', value: 'tps3r' }, { label: 'Bank Sampah', value: 'bank_sampah' },
              ]} />
            </Form.Item>
            <Form.Item name="capacity_tons" label={<>Kapasitas (ton) <InfoTooltip text="Kapasitas maksimum dalam ton" /></>} rules={[{ required: true }]} style={{ flex: 1 }}>
              <InputNumber min={0.1} step={0.5} style={{ width: '100%' }} />
            </Form.Item>
          </Space>

          <div style={{ marginBottom: 16, marginTop: 8 }}>
            <span style={{ fontWeight: 500, fontSize: 13, color: 'rgba(0,0,0,0.65)' }}>Lokasi</span>
          </div>
          <Form.Item name="address" label="Alamat" rules={[{ required: true }]}>
            <Input.TextArea rows={2} placeholder="Alamat lengkap TPS" />
          </Form.Item>
          <Space style={{ width: '100%' }} size={16}>
            <Form.Item name="latitude" label="Latitude" rules={[{ required: true }]} style={{ flex: 1 }}>
              <InputNumber min={-90} max={90} step={0.0001} style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item name="longitude" label="Longitude" rules={[{ required: true }]} style={{ flex: 1 }}>
              <InputNumber min={-180} max={180} step={0.0001} style={{ width: '100%' }} />
            </Form.Item>
          </Space>
          <Form.Item name="area_id" label="Area ID" rules={[{ required: true }]}>
            <Input placeholder="UUID area" />
          </Form.Item>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16 }}>
            <Button onClick={() => { setModalOpen(false); form.resetFields(); }}>Batal</Button>
            <Button type="primary" htmlType="submit" loading={submitting}>Simpan</Button>
          </div>
        </Form>
      </Modal>

      <DetailDrawer
        open={!!drawerRecord}
        onClose={() => setDrawerRecord(null)}
        title={`Detail: ${drawerRecord?.name || ''}`}
        fields={drawerRecord ? [
          { label: 'Tipe', value: typeLabels[drawerRecord.type] || drawerRecord.type },
          { label: 'Status', value: <StatusBadge status={drawerRecord.status} /> },
          { label: 'Kapasitas', value: `${drawerRecord.capacity_tons} ton` },
          { label: 'Beban Saat Ini', value: `${drawerRecord.current_load_tons || 0} ton` },
          { label: 'Alamat', value: drawerRecord.address },
          { label: 'Koordinat', value: `${drawerRecord.latitude}, ${drawerRecord.longitude}` },
          { label: 'QR Code', value: drawerRecord.qr_code || '-' },
        ] : []}
      />
    </div>
  );
};

export default TpsPage;
