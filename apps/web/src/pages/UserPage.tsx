import React, { useEffect, useState } from 'react';
import { Table, Button, Modal, Form, Input, Select, Tag, Tabs, message, Alert } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { UserRole, OTP_ROLES, PASSWORD_ROLES } from '@buzzr/shared-types';
import { ROLE_LABELS } from '@buzzr/constants';
import type { ColumnsType } from 'antd/es/table';
import api from '../services/api';

interface User {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  role: UserRole;
  area_id: string | null;
  status: string;
  created_at: string;
}

const roleColors: Record<string, string> = {
  citizen: 'default',
  sweeper: 'cyan',
  tps_operator: 'blue',
  collector: 'purple',
  driver: 'orange',
  tpst_operator: 'gold',
  dlh_admin: 'green',
  super_admin: 'red',
};

export default function UserPage() {
  const [data, setData] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [selectedRole, setSelectedRole] = useState<UserRole | undefined>();
  const [form] = Form.useForm();

  const fetchData = async (role?: string) => {
    try {
      setLoading(true);
      const params: Record<string, string> = {};
      if (role && role !== 'all') params.role = role;
      const res = await api.get('/users', { params });
      setData(res.data);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Gagal memuat data pengguna');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(activeTab); }, [activeTab]);

  const handleCreate = async (values: any) => {
    try {
      setSubmitting(true);
      await api.post('/users', values);
      message.success('Pengguna berhasil dibuat');
      setModalOpen(false);
      form.resetFields();
      setSelectedRole(undefined);
      fetchData(activeTab);
    } catch (err: any) {
      message.error(err.response?.data?.message || 'Gagal membuat pengguna');
    } finally {
      setSubmitting(false);
    }
  };

  const isOtpRole = (role?: UserRole) => role ? (OTP_ROLES as readonly UserRole[]).includes(role) : false;
  const isPasswordRole = (role?: UserRole) => role ? (PASSWORD_ROLES as readonly UserRole[]).includes(role) : false;

  const columns: ColumnsType<User> = [
    { title: 'Nama', dataIndex: 'name', key: 'name' },
    {
      title: 'Email / HP', key: 'contact',
      render: (_: any, r: User) => r.email || r.phone || '-',
    },
    {
      title: 'Role', dataIndex: 'role', key: 'role',
      render: (role: UserRole) => (
        <Tag color={roleColors[role] || 'default'}>
          {ROLE_LABELS[role] || role}
        </Tag>
      ),
    },
    { title: 'Area', dataIndex: 'area_id', key: 'area_id', ellipsis: true, render: (v: string) => v || '-' },
    {
      title: 'Status', dataIndex: 'status', key: 'status',
      render: (s: string) => <Tag color={s === 'active' ? 'green' : 'red'}>{s?.toUpperCase() || 'ACTIVE'}</Tag>,
    },
    {
      title: 'Terdaftar', dataIndex: 'created_at', key: 'created_at',
      render: (d: string) => d ? new Date(d).toLocaleDateString('id-ID') : '-',
    },
  ];

  const tabItems = [
    { key: 'all', label: 'Semua' },
    ...Object.values(UserRole).map((r) => ({
      key: r,
      label: ROLE_LABELS[r] || r,
    })),
  ];

  if (error && !data.length) return <Alert type="error" message={error} />;

  return (
    <>
      <Tabs activeKey={activeTab} onChange={setActiveTab} items={tabItems} style={{ marginBottom: 16 }} />

      <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalOpen(true)} style={{ marginBottom: 16 }}>
        Tambah Pengguna
      </Button>

      <Table columns={columns} dataSource={data} rowKey="id" loading={loading} pagination={{ pageSize: 10 }} />

      <Modal title="Tambah Pengguna" open={modalOpen} onCancel={() => { setModalOpen(false); setSelectedRole(undefined); }} footer={null}>
        <Form form={form} layout="vertical" onFinish={handleCreate}>
          <Form.Item name="name" label="Nama" rules={[{ required: true, min: 2 }]}>
            <Input />
          </Form.Item>
          <Form.Item name="role" label="Role" rules={[{ required: true }]}>
            <Select onChange={(v: UserRole) => setSelectedRole(v)}>
              {Object.values(UserRole).map((r) => (
                <Select.Option key={r} value={r}>{ROLE_LABELS[r] || r}</Select.Option>
              ))}
            </Select>
          </Form.Item>
          {isPasswordRole(selectedRole) && (
            <>
              <Form.Item name="email" label="Email" rules={[{ required: true, type: 'email' }]}>
                <Input />
              </Form.Item>
              <Form.Item name="password" label="Password" rules={[{ required: true, min: 8 }]}>
                <Input.Password />
              </Form.Item>
            </>
          )}
          {isOtpRole(selectedRole) && (
            <Form.Item name="phone" label="Nomor HP" rules={[{ required: true, pattern: /^08\d{8,12}$/, message: 'Format: 08xxxxxxxxxx' }]}>
              <Input placeholder="08xxxxxxxxxx" />
            </Form.Item>
          )}
          <Form.Item name="areaId" label="Area ID">
            <Input placeholder="UUID area (opsional)" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={submitting} block>Simpan</Button>
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}
