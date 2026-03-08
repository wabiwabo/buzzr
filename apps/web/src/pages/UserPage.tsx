import React, { useEffect, useState } from 'react';
import { Form, Input, Select, Button, Tabs, Tag, message } from 'antd';
import { EyeOutlined, MoreOutlined } from '@ant-design/icons';
import { Dropdown } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import api from '../services/api';
import { PageHeader, StatusBadge, SlideOver, VisualSelector } from '../components/common';
import { SmartTable, DetailDrawer } from '../components/data';
import { useTableState } from '../hooks/useTableState';

interface User {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  role: string;
  area_id: string | null;
  status: string;
  created_at: string;
}

const roleColors: Record<string, string> = {
  citizen: 'default', sweeper: 'cyan', tps_operator: 'blue', collector: 'purple',
  driver: 'orange', tpst_operator: 'gold', dlh_admin: 'green', super_admin: 'red',
};

const roleLabels: Record<string, string> = {
  citizen: 'Warga', sweeper: 'Penyapu', tps_operator: 'Operator TPS',
  collector: 'Pengumpul', driver: 'Driver', tpst_operator: 'Operator TPST',
  dlh_admin: 'Admin DLH', super_admin: 'Super Admin',
};

const OTP_ROLES = ['citizen'];
const PASSWORD_ROLES = ['sweeper', 'tps_operator', 'collector', 'driver', 'tpst_operator', 'dlh_admin', 'super_admin'];

const UserPage: React.FC = () => {
  const tableState = useTableState<User>({ searchFields: ['name', 'email', 'phone'] });
  const [activeTab, setActiveTab] = useState('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [drawerRecord, setDrawerRecord] = useState<User | null>(null);
  const [selectedRole, setSelectedRole] = useState<string | undefined>();
  const [submitting, setSubmitting] = useState(false);
  const [form] = Form.useForm();

  const fetchData = async (role?: string) => {
    tableState.setLoading(true);
    try {
      const params = role && role !== 'all' ? { role } : {};
      const { data } = await api.get('/users', { params });
      tableState.setData(Array.isArray(data) ? data : []);
    } catch { message.error('Gagal memuat data pengguna'); }
    tableState.setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const handleTabChange = (key: string) => {
    setActiveTab(key);
    fetchData(key);
  };

  const handleCreate = async (values: any) => {
    setSubmitting(true);
    try {
      await api.post('/users', values);
      message.success('Pengguna berhasil dibuat');
      setModalOpen(false);
      form.resetFields();
      setSelectedRole(undefined);
      fetchData(activeTab);
    } catch { message.error('Gagal membuat pengguna'); }
    setSubmitting(false);
  };

  const columns: ColumnsType<User> = [
    { title: 'Nama', dataIndex: 'name', sorter: true, width: 160 },
    {
      title: 'Email / HP', width: 180,
      render: (_, r) => r.email || r.phone || '-',
      ellipsis: true,
    },
    {
      title: 'Role', dataIndex: 'role', width: 130,
      render: (v) => <Tag color={roleColors[v] || 'default'}>{roleLabels[v] || v}</Tag>,
    },
    { title: 'Area', dataIndex: 'area_id', width: 120, ellipsis: true, render: (v) => v || '-' },
    { title: 'Status', dataIndex: 'status', width: 100, render: (v) => <StatusBadge status={v || 'active'} /> },
    { title: 'Terdaftar', dataIndex: 'created_at', width: 120, render: (v) => dayjs(v).format('DD MMM YYYY') },
    {
      title: 'Aksi', width: 80,
      render: (_, record) => (
        <Dropdown menu={{
          items: [
            { key: 'view', icon: <EyeOutlined />, label: 'Detail', onClick: () => setDrawerRecord(record) },
          ],
        }}>
          <Button type="text" icon={<MoreOutlined />} size="small" />
        </Dropdown>
      ),
    },
  ];

  const tabItems = [
    { key: 'all', label: 'Semua' },
    ...Object.entries(roleLabels).map(([key, label]) => ({ key, label })),
  ];

  return (
    <div>
      <PageHeader
        title="Manajemen Pengguna"
        description="Kelola semua pengguna sistem"
        breadcrumbs={[{ label: 'Dashboard', path: '/' }, { label: 'Pengguna' }]}
        primaryAction={{ label: 'Tambah Pengguna', onClick: () => setModalOpen(true) }}
      />

      <Tabs activeKey={activeTab} onChange={handleTabChange} items={tabItems} style={{ marginBottom: 16 }} />

      <SmartTable<User>
        tableState={tableState}
        columns={columns}
        searchPlaceholder="Cari nama, email, atau nomor HP..."
        exportFileName="data-pengguna"
        exportColumns={[
          { title: 'Nama', dataIndex: 'name' },
          { title: 'Email', dataIndex: 'email' },
          { title: 'HP', dataIndex: 'phone' },
          { title: 'Role', dataIndex: 'role', render: (v: string) => roleLabels[v] || v },
          { title: 'Status', dataIndex: 'status' },
          { title: 'Terdaftar', dataIndex: 'created_at' },
        ]}
        onRefresh={() => fetchData(activeTab)}
        onRowClick={(r) => setDrawerRecord(r)}
        emptyTitle="Tidak ada pengguna"
        emptyDescription="Tambahkan pengguna pertama"
        emptyActionLabel="Tambah Pengguna"
        onEmptyAction={() => setModalOpen(true)}
      />

      <SlideOver
        open={modalOpen}
        onClose={() => { setModalOpen(false); setSelectedRole(undefined); form.resetFields(); }}
        title="Tambah Pengguna"
        footer={
          <>
            <Button onClick={() => { setModalOpen(false); form.resetFields(); setSelectedRole(undefined); }}>Batal</Button>
            <Button type="primary" onClick={() => form.submit()} loading={submitting}>Simpan</Button>
          </>
        }
      >
        <Form form={form} layout="vertical" onFinish={handleCreate}>
          <Form.Item name="name" label="Nama" rules={[{ required: true, min: 2 }]}>
            <Input placeholder="Nama lengkap" />
          </Form.Item>
          <Form.Item name="role" label="Peran" rules={[{ required: true }]}>
            <VisualSelector
              options={[
                { value: 'dlh_admin', label: 'Admin DLH', description: 'Kelola semua operasional' },
                { value: 'tps_operator', label: 'Operator TPS', description: 'Catat sampah masuk/keluar' },
                { value: 'driver', label: 'Driver', description: 'Angkut sampah' },
                { value: 'sweeper', label: 'Penyapu', description: 'Bersihkan area' },
                { value: 'collector', label: 'Pengumpul', description: 'Kumpulkan sampah warga' },
                { value: 'tpst_operator', label: 'Operator TPST', description: 'Operasikan fasilitas TPST' },
                { value: 'citizen', label: 'Warga', description: 'Laporkan keluhan' },
              ]}
              value={selectedRole}
              onChange={(v) => { setSelectedRole(v as string); form.setFieldsValue({ role: v }); }}
            />
          </Form.Item>
          {selectedRole && PASSWORD_ROLES.includes(selectedRole) && (
            <>
              <Form.Item name="email" label="Email" rules={[{ required: true, type: 'email' }]}>
                <Input placeholder="email@example.com" />
              </Form.Item>
              <Form.Item name="password" label="Password" rules={[{ required: true, min: 8, message: 'Minimal 8 karakter' }]}>
                <Input.Password />
              </Form.Item>
            </>
          )}
          {selectedRole && OTP_ROLES.includes(selectedRole) && (
            <Form.Item name="phone" label="Nomor HP" rules={[{ required: true, pattern: /^08\d{8,12}$/, message: 'Format: 08xxxxxxxxxx' }]}>
              <Input placeholder="08xxxxxxxxxx" />
            </Form.Item>
          )}
          <Form.Item name="areaId" label="Area ID">
            <Input placeholder="UUID area (opsional)" />
          </Form.Item>
        </Form>
      </SlideOver>

      <DetailDrawer
        open={!!drawerRecord}
        onClose={() => setDrawerRecord(null)}
        title={`Pengguna: ${drawerRecord?.name || ''}`}
        fields={drawerRecord ? [
          { label: 'Role', value: <Tag color={roleColors[drawerRecord.role]}>{roleLabels[drawerRecord.role] || drawerRecord.role}</Tag> },
          { label: 'Email', value: drawerRecord.email || '-' },
          { label: 'HP', value: drawerRecord.phone || '-' },
          { label: 'Status', value: <StatusBadge status={drawerRecord.status || 'active'} /> },
          { label: 'Area', value: drawerRecord.area_id || '-' },
          { label: 'Terdaftar', value: dayjs(drawerRecord.created_at).format('DD MMM YYYY, HH:mm') },
        ] : []}
      />
    </div>
  );
};

export default UserPage;
