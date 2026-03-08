import React, { useEffect, useState } from 'react';
import { Modal, Form, Input, InputNumber, Select, Button, Space, Dropdown, message, Tag } from 'antd';
import { EyeOutlined, MoreOutlined, UserAddOutlined, UserDeleteOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import api from '../services/api';
import { PageHeader, StatusBadge } from '../components/common';
import { SmartTable, DetailDrawer } from '../components/data';
import { useTableState } from '../hooks/useTableState';
import type { FilterDef } from '../hooks/useTableState';

interface Vehicle {
  id: string;
  plate_number: string;
  type: string;
  capacity_tons: number;
  driver_id: string | null;
  driver_name: string | null;
  status: string;
}

interface Driver {
  id: string;
  name: string;
}

const typeLabels: Record<string, string> = { truck: 'Truk', cart: 'Gerobak', motorcycle: 'Motor' };

const filterDefs: FilterDef[] = [
  { key: 'type', label: 'Tipe', type: 'select', options: [
    { label: 'Truk', value: 'truck' }, { label: 'Gerobak', value: 'cart' }, { label: 'Motor', value: 'motorcycle' },
  ]},
  { key: 'status', label: 'Status', type: 'select', options: [
    { label: 'Tersedia', value: 'available' }, { label: 'Digunakan', value: 'in_use' }, { label: 'Maintenance', value: 'maintenance' },
  ]},
];

const FleetPage: React.FC = () => {
  const tableState = useTableState<Vehicle>({ searchFields: ['plate_number', 'driver_name'], defaultPageSize: 10 });
  const [modalOpen, setModalOpen] = useState(false);
  const [assignModal, setAssignModal] = useState<Vehicle | null>(null);
  const [drawerRecord, setDrawerRecord] = useState<Vehicle | null>(null);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [form] = Form.useForm();
  const [assignForm] = Form.useForm();

  const fetchData = async () => {
    tableState.setLoading(true);
    try {
      const { data } = await api.get('/fleet');
      tableState.setData(Array.isArray(data) ? data : []);
    } catch { message.error('Gagal memuat data armada'); }
    tableState.setLoading(false);
  };

  const fetchDrivers = async () => {
    try {
      const { data } = await api.get('/users', { params: { role: 'driver' } });
      setDrivers(Array.isArray(data) ? data : []);
    } catch { /* silent */ }
  };

  useEffect(() => { fetchData(); fetchDrivers(); }, []);

  const handleCreate = async (values: any) => {
    setSubmitting(true);
    try {
      await api.post('/fleet', values);
      message.success('Kendaraan berhasil ditambahkan');
      setModalOpen(false);
      form.resetFields();
      fetchData();
    } catch { message.error('Gagal menambahkan kendaraan'); }
    setSubmitting(false);
  };

  const handleAssign = async (values: any) => {
    if (!assignModal) return;
    setSubmitting(true);
    try {
      await api.patch(`/fleet/${assignModal.id}/assign`, { driverId: values.driver_id });
      message.success('Driver berhasil ditugaskan');
      setAssignModal(null);
      assignForm.resetFields();
      fetchData();
    } catch { message.error('Gagal menugaskan driver'); }
    setSubmitting(false);
  };

  const handleUnassign = async (vehicle: Vehicle) => {
    try {
      await api.patch(`/fleet/${vehicle.id}/unassign`);
      message.success('Driver berhasil dicopot');
      fetchData();
    } catch { message.error('Gagal mencopot driver'); }
  };

  const columns: ColumnsType<Vehicle> = [
    { title: 'Plat Nomor', dataIndex: 'plate_number', sorter: true, width: 140 },
    { title: 'Tipe', dataIndex: 'type', width: 100, render: (v) => typeLabels[v] || v },
    { title: 'Kapasitas', dataIndex: 'capacity_tons', width: 110, render: (v) => `${v} ton`, sorter: true },
    {
      title: 'Driver',
      width: 160,
      render: (_, r) => r.driver_name || <Tag color="default">Belum ditugaskan</Tag>,
    },
    { title: 'Status', dataIndex: 'status', width: 120, render: (v) => <StatusBadge status={v} /> },
    {
      title: 'Aksi', width: 80,
      render: (_, record) => (
        <Dropdown menu={{
          items: [
            { key: 'view', icon: <EyeOutlined />, label: 'Detail', onClick: () => setDrawerRecord(record) },
            { key: 'assign', icon: <UserAddOutlined />, label: 'Assign Driver', onClick: () => setAssignModal(record) },
            ...(record.driver_id ? [{
              key: 'unassign', icon: <UserDeleteOutlined />, label: 'Copot Driver', danger: true,
              onClick: () => handleUnassign(record),
            }] : []),
          ],
        }}>
          <Button type="text" icon={<MoreOutlined />} size="small" />
        </Dropdown>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Manajemen Armada"
        description="Kelola kendaraan dan penugasan driver"
        breadcrumbs={[{ label: 'Dashboard', path: '/' }, { label: 'Armada' }]}
        primaryAction={{ label: 'Tambah Kendaraan', onClick: () => setModalOpen(true) }}
      />

      <SmartTable<Vehicle>
        tableState={tableState}
        columns={columns}
        filterDefs={filterDefs}
        searchPlaceholder="Cari plat nomor atau nama driver..."
        exportFileName="data-armada"
        exportColumns={[
          { title: 'Plat Nomor', dataIndex: 'plate_number' },
          { title: 'Tipe', dataIndex: 'type', render: (v: string) => typeLabels[v] || v },
          { title: 'Kapasitas (ton)', dataIndex: 'capacity_tons' },
          { title: 'Driver', dataIndex: 'driver_name' },
          { title: 'Status', dataIndex: 'status' },
        ]}
        onRefresh={fetchData}
        onRowClick={(r) => setDrawerRecord(r)}
        emptyTitle="Belum ada kendaraan"
        emptyDescription="Daftarkan armada untuk mulai mengatur pengangkutan"
        emptyActionLabel="Tambah Kendaraan"
        onEmptyAction={() => setModalOpen(true)}
      />

      <Modal title="Tambah Kendaraan" open={modalOpen} onCancel={() => { setModalOpen(false); form.resetFields(); }} footer={null}>
        <Form form={form} layout="vertical" onFinish={handleCreate}>
          <Form.Item name="plate_number" label="Plat Nomor" rules={[{ required: true }]}>
            <Input placeholder="Contoh: D 1234 ABC" />
          </Form.Item>
          <Form.Item name="type" label="Tipe Kendaraan" rules={[{ required: true }]}>
            <Select options={[
              { label: 'Truk', value: 'truck' }, { label: 'Gerobak', value: 'cart' }, { label: 'Motor', value: 'motorcycle' },
            ]} />
          </Form.Item>
          <Form.Item name="capacity_tons" label="Kapasitas (ton)" rules={[{ required: true }]}>
            <InputNumber min={0.1} step={0.5} style={{ width: '100%' }} />
          </Form.Item>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <Button onClick={() => { setModalOpen(false); form.resetFields(); }}>Batal</Button>
            <Button type="primary" htmlType="submit" loading={submitting}>Simpan</Button>
          </div>
        </Form>
      </Modal>

      <Modal title={`Assign Driver — ${assignModal?.plate_number || ''}`} open={!!assignModal} onCancel={() => { setAssignModal(null); assignForm.resetFields(); }} footer={null}>
        <Form form={assignForm} layout="vertical" onFinish={handleAssign}>
          <Form.Item name="driver_id" label="Pilih Driver" rules={[{ required: true }]}>
            <Select
              showSearch
              placeholder="Cari nama driver..."
              optionFilterProp="label"
              options={drivers.map((d) => ({ label: d.name, value: d.id }))}
            />
          </Form.Item>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <Button onClick={() => { setAssignModal(null); assignForm.resetFields(); }}>Batal</Button>
            <Button type="primary" htmlType="submit" loading={submitting}>Tugaskan</Button>
          </div>
        </Form>
      </Modal>

      <DetailDrawer
        open={!!drawerRecord}
        onClose={() => setDrawerRecord(null)}
        title={`Kendaraan: ${drawerRecord?.plate_number || ''}`}
        fields={drawerRecord ? [
          { label: 'Tipe', value: typeLabels[drawerRecord.type] || drawerRecord.type },
          { label: 'Kapasitas', value: `${drawerRecord.capacity_tons} ton` },
          { label: 'Status', value: <StatusBadge status={drawerRecord.status} /> },
          { label: 'Driver', value: drawerRecord.driver_name || 'Belum ditugaskan' },
        ] : []}
        actions={drawerRecord && (
          <Button onClick={() => { setDrawerRecord(null); setAssignModal(drawerRecord); }}>Assign Driver</Button>
        )}
      />
    </div>
  );
};

export default FleetPage;
