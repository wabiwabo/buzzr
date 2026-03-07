import React, { useEffect, useState } from 'react';
import { Table, Button, Modal, Form, Input, InputNumber, Select, Tag, Space, message, Alert } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import api from '../services/api';

interface Vehicle {
  id: string;
  plate_number: string;
  type: string;
  capacity_tons: number;
  driver_id: string | null;
  driver_name?: string;
  status: string;
}

const vehicleTypeLabels: Record<string, string> = {
  truk: 'Truk',
  gerobak: 'Gerobak',
  motor: 'Motor',
};

const statusColors: Record<string, string> = {
  available: 'green',
  in_use: 'blue',
  maintenance: 'orange',
};

export default function FleetPage() {
  const [data, setData] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [driverId, setDriverId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [form] = Form.useForm();

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await api.get('/fleet');
      setData(res.data);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Gagal memuat data armada');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleCreate = async (values: any) => {
    try {
      setSubmitting(true);
      await api.post('/fleet', values);
      message.success('Kendaraan berhasil ditambahkan');
      setModalOpen(false);
      form.resetFields();
      fetchData();
    } catch (err: any) {
      message.error(err.response?.data?.message || 'Gagal menambahkan kendaraan');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAssign = async () => {
    if (!selectedVehicle) return;
    try {
      setSubmitting(true);
      await api.patch(`/fleet/${selectedVehicle.id}/assign`, { driverId });
      message.success('Driver berhasil ditugaskan');
      setAssignModalOpen(false);
      setDriverId('');
      fetchData();
    } catch (err: any) {
      message.error(err.response?.data?.message || 'Gagal menugaskan driver');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUnassign = async (vehicleId: string) => {
    try {
      await api.patch(`/fleet/${vehicleId}/unassign`);
      message.success('Driver berhasil dilepas');
      fetchData();
    } catch (err: any) {
      message.error(err.response?.data?.message || 'Gagal melepas driver');
    }
  };

  const columns: ColumnsType<Vehicle> = [
    { title: 'Plat Nomor', dataIndex: 'plate_number', key: 'plate_number' },
    {
      title: 'Tipe', dataIndex: 'type', key: 'type',
      render: (t: string) => vehicleTypeLabels[t] || t,
    },
    { title: 'Kapasitas (ton)', dataIndex: 'capacity_tons', key: 'capacity_tons' },
    {
      title: 'Driver', dataIndex: 'driver_name', key: 'driver_name',
      render: (name: string, record: Vehicle) => name || (record.driver_id ? record.driver_id : <Tag>Belum ditugaskan</Tag>),
    },
    {
      title: 'Status', dataIndex: 'status', key: 'status',
      render: (s: string) => <Tag color={statusColors[s] || 'default'}>{s?.toUpperCase()}</Tag>,
    },
    {
      title: 'Aksi', key: 'actions',
      render: (_: any, record: Vehicle) => (
        <Space>
          <Button size="small" onClick={() => { setSelectedVehicle(record); setAssignModalOpen(true); }}>
            Assign Driver
          </Button>
          {record.driver_id && (
            <Button size="small" danger onClick={() => handleUnassign(record.id)}>
              Unassign
            </Button>
          )}
        </Space>
      ),
    },
  ];

  if (error && !data.length) return <Alert type="error" message={error} />;

  return (
    <>
      <Space style={{ marginBottom: 16 }}>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalOpen(true)}>Tambah Kendaraan</Button>
      </Space>

      <Table columns={columns} dataSource={data} rowKey="id" loading={loading} pagination={{ pageSize: 10 }} />

      <Modal title="Tambah Kendaraan" open={modalOpen} onCancel={() => setModalOpen(false)} footer={null}>
        <Form form={form} layout="vertical" onFinish={handleCreate}>
          <Form.Item name="plateNumber" label="Plat Nomor" rules={[{ required: true, min: 3 }]}>
            <Input />
          </Form.Item>
          <Form.Item name="type" label="Tipe" rules={[{ required: true }]}>
            <Select>
              <Select.Option value="truk">Truk</Select.Option>
              <Select.Option value="gerobak">Gerobak</Select.Option>
              <Select.Option value="motor">Motor</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="capacityTons" label="Kapasitas (ton)" rules={[{ required: true }]}>
            <InputNumber min={0.1} step={0.1} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={submitting} block>Simpan</Button>
          </Form.Item>
        </Form>
      </Modal>

      <Modal title="Assign Driver" open={assignModalOpen} onOk={handleAssign} onCancel={() => setAssignModalOpen(false)} confirmLoading={submitting}>
        <p>Kendaraan: {selectedVehicle?.plate_number}</p>
        <Input placeholder="Driver ID (UUID)" value={driverId} onChange={(e) => setDriverId(e.target.value)} />
      </Modal>
    </>
  );
}
