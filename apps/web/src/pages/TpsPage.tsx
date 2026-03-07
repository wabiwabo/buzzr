import React, { useEffect, useState } from 'react';
import { Table, Button, Modal, Form, Input, InputNumber, Select, Tag, Space, message, Spin, Alert } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { TpsType, TpsStatus } from '@buzzr/shared-types';
import type { ColumnsType } from 'antd/es/table';
import api from '../services/api';

interface Tps {
  id: string;
  name: string;
  type: TpsType;
  status: TpsStatus;
  capacity_tons: number;
  current_load_tons: number;
  qr_code: string;
  address: string;
  latitude: number;
  longitude: number;
  area_id: string;
}

const typeLabels: Record<string, string> = {
  tps: 'TPS',
  tps3r: 'TPS 3R',
  bank_sampah: 'Bank Sampah',
};

const statusColors: Record<string, string> = {
  active: 'green',
  full: 'red',
  maintenance: 'orange',
};

export default function TpsPage() {
  const [data, setData] = useState<Tps[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [filterType, setFilterType] = useState<string | undefined>();
  const [filterStatus, setFilterStatus] = useState<string | undefined>();
  const [form] = Form.useForm();

  const fetchData = async () => {
    try {
      setLoading(true);
      const params: Record<string, string> = {};
      if (filterType) params.type = filterType;
      if (filterStatus) params.status = filterStatus;
      const res = await api.get('/tps', { params });
      setData(res.data);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Gagal memuat data TPS');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [filterType, filterStatus]);

  const handleCreate = async (values: any) => {
    try {
      setSubmitting(true);
      await api.post('/tps', values);
      message.success('TPS berhasil ditambahkan');
      setModalOpen(false);
      form.resetFields();
      fetchData();
    } catch (err: any) {
      message.error(err.response?.data?.message || 'Gagal menambahkan TPS');
    } finally {
      setSubmitting(false);
    }
  };

  const columns: ColumnsType<Tps> = [
    { title: 'Nama', dataIndex: 'name', key: 'name' },
    {
      title: 'Tipe', dataIndex: 'type', key: 'type',
      render: (t: string) => typeLabels[t] || t,
    },
    {
      title: 'Status', dataIndex: 'status', key: 'status',
      render: (s: string) => <Tag color={statusColors[s] || 'default'}>{s?.toUpperCase()}</Tag>,
    },
    { title: 'Kapasitas (ton)', dataIndex: 'capacity_tons', key: 'capacity_tons' },
    {
      title: 'Beban Saat Ini (ton)', dataIndex: 'current_load_tons', key: 'current_load_tons',
      render: (val: number, record: Tps) => {
        const ratio = record.capacity_tons > 0 ? val / record.capacity_tons : 0;
        const color = ratio >= 0.9 ? 'red' : ratio >= 0.7 ? 'orange' : 'green';
        return <Tag color={color}>{val ?? 0}</Tag>;
      },
    },
    { title: 'QR Code', dataIndex: 'qr_code', key: 'qr_code', ellipsis: true },
    { title: 'Alamat', dataIndex: 'address', key: 'address', ellipsis: true },
  ];

  if (error && !data.length) return <Alert type="error" message={error} />;

  return (
    <>
      <Space style={{ marginBottom: 16 }}>
        <Select placeholder="Filter Tipe" allowClear style={{ width: 150 }} onChange={setFilterType} value={filterType}>
          {Object.values(TpsType).map((t) => <Select.Option key={t} value={t}>{typeLabels[t] || t}</Select.Option>)}
        </Select>
        <Select placeholder="Filter Status" allowClear style={{ width: 150 }} onChange={setFilterStatus} value={filterStatus}>
          {Object.values(TpsStatus).map((s) => <Select.Option key={s} value={s}>{s}</Select.Option>)}
        </Select>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalOpen(true)}>Tambah TPS</Button>
      </Space>

      <Table columns={columns} dataSource={data} rowKey="id" loading={loading} pagination={{ pageSize: 10 }} />

      <Modal title="Tambah TPS" open={modalOpen} onCancel={() => setModalOpen(false)} footer={null}>
        <Form form={form} layout="vertical" onFinish={handleCreate}>
          <Form.Item name="name" label="Nama" rules={[{ required: true, min: 2 }]}>
            <Input />
          </Form.Item>
          <Form.Item name="type" label="Tipe" rules={[{ required: true }]}>
            <Select>
              {Object.values(TpsType).map((t) => <Select.Option key={t} value={t}>{typeLabels[t] || t}</Select.Option>)}
            </Select>
          </Form.Item>
          <Form.Item name="address" label="Alamat" rules={[{ required: true, min: 5 }]}>
            <Input.TextArea rows={2} />
          </Form.Item>
          <Form.Item name="capacityTons" label="Kapasitas (ton)" rules={[{ required: true }]}>
            <InputNumber min={0.1} step={0.1} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="latitude" label="Latitude" rules={[{ required: true }]}>
            <InputNumber min={-90} max={90} step={0.000001} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="longitude" label="Longitude" rules={[{ required: true }]}>
            <InputNumber min={-180} max={180} step={0.000001} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="areaId" label="Area ID" rules={[{ required: true }]}>
            <Input placeholder="UUID area" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={submitting} block>Simpan</Button>
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}
