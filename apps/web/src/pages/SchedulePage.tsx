import React, { useEffect, useState } from 'react';
import { Table, Button, Modal, Form, Input, Select, Tag, Space, message, Alert, InputNumber } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import api from '../services/api';

interface Schedule {
  id: string;
  route_name: string;
  vehicle_id: string;
  driver_id: string;
  schedule_type: string;
  recurring_days: number[] | null;
  scheduled_date: string | null;
  start_time: string;
  status: string;
  stops?: any[];
}

const dayLabels = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

const statusColors: Record<string, string> = {
  active: 'blue',
  completed: 'green',
  cancelled: 'red',
  in_progress: 'orange',
};

export default function SchedulePage() {
  const [data, setData] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [stopModalOpen, setStopModalOpen] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState<Schedule | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [form] = Form.useForm();
  const [stopForm] = Form.useForm();

  const fetchData = async () => {
    try {
      setLoading(true);
      // The schedule controller doesn't have a general list endpoint,
      // so we use the available endpoints. Fetch all schedules if an admin list is available.
      // Fallback: try to list via a general query (some controllers expose it).
      const res = await api.get('/schedules', { params: {} });
      setData(Array.isArray(res.data) ? res.data : []);
      setError(null);
    } catch (err: any) {
      // If there's no list endpoint, show empty state
      if (err.response?.status === 404) {
        setData([]);
        setError(null);
      } else {
        setError(err.response?.data?.message || 'Gagal memuat data jadwal');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleCreate = async (values: any) => {
    try {
      setSubmitting(true);
      await api.post('/schedules', values);
      message.success('Jadwal berhasil dibuat');
      setModalOpen(false);
      form.resetFields();
      fetchData();
    } catch (err: any) {
      message.error(err.response?.data?.message || 'Gagal membuat jadwal');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddStop = async (values: any) => {
    if (!selectedSchedule) return;
    try {
      setSubmitting(true);
      await api.post(`/schedules/${selectedSchedule.id}/stops`, values);
      message.success('Stop berhasil ditambahkan');
      setStopModalOpen(false);
      stopForm.resetFields();
      fetchData();
    } catch (err: any) {
      message.error(err.response?.data?.message || 'Gagal menambahkan stop');
    } finally {
      setSubmitting(false);
    }
  };

  const columns: ColumnsType<Schedule> = [
    { title: 'Nama Rute', dataIndex: 'route_name', key: 'route_name' },
    { title: 'Kendaraan', dataIndex: 'vehicle_id', key: 'vehicle_id', ellipsis: true },
    { title: 'Driver', dataIndex: 'driver_id', key: 'driver_id', ellipsis: true },
    {
      title: 'Tipe', dataIndex: 'schedule_type', key: 'schedule_type',
      render: (t: string) => <Tag color={t === 'recurring' ? 'blue' : 'purple'}>{t === 'recurring' ? 'Rutin' : 'On-Demand'}</Tag>,
    },
    {
      title: 'Hari/Tanggal', key: 'schedule_info',
      render: (_: any, record: Schedule) => {
        if (record.schedule_type === 'recurring' && record.recurring_days) {
          return record.recurring_days.map((d) => dayLabels[d] || d).join(', ');
        }
        return record.scheduled_date || '-';
      },
    },
    { title: 'Jam Mulai', dataIndex: 'start_time', key: 'start_time' },
    {
      title: 'Status', dataIndex: 'status', key: 'status',
      render: (s: string) => <Tag color={statusColors[s] || 'default'}>{s?.toUpperCase()}</Tag>,
    },
    {
      title: 'Aksi', key: 'actions',
      render: (_: any, record: Schedule) => (
        <Button size="small" onClick={() => { setSelectedSchedule(record); setStopModalOpen(true); }}>
          Tambah Stop
        </Button>
      ),
    },
  ];

  if (error && !data.length) return <Alert type="error" message={error} />;

  return (
    <>
      <Space style={{ marginBottom: 16 }}>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalOpen(true)}>Tambah Jadwal</Button>
      </Space>

      <Table columns={columns} dataSource={data} rowKey="id" loading={loading} pagination={{ pageSize: 10 }} />

      <Modal title="Tambah Jadwal" open={modalOpen} onCancel={() => setModalOpen(false)} footer={null} width={600}>
        <Form form={form} layout="vertical" onFinish={handleCreate}>
          <Form.Item name="routeName" label="Nama Rute" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="vehicleId" label="ID Kendaraan" rules={[{ required: true }]}>
            <Input placeholder="UUID kendaraan" />
          </Form.Item>
          <Form.Item name="driverId" label="ID Driver" rules={[{ required: true }]}>
            <Input placeholder="UUID driver" />
          </Form.Item>
          <Form.Item name="scheduleType" label="Tipe Jadwal" rules={[{ required: true }]}>
            <Select>
              <Select.Option value="recurring">Rutin</Select.Option>
              <Select.Option value="on_demand">On-Demand</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="recurringDays" label="Hari (untuk Rutin)">
            <Select mode="multiple" placeholder="Pilih hari">
              {dayLabels.map((label, idx) => <Select.Option key={idx} value={idx}>{label}</Select.Option>)}
            </Select>
          </Form.Item>
          <Form.Item name="scheduledDate" label="Tanggal (untuk On-Demand)">
            <Input placeholder="YYYY-MM-DD" />
          </Form.Item>
          <Form.Item name="startTime" label="Jam Mulai" rules={[{ required: true }]}>
            <Input placeholder="HH:MM" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={submitting} block>Simpan</Button>
          </Form.Item>
        </Form>
      </Modal>

      <Modal title={`Tambah Stop - ${selectedSchedule?.route_name || ''}`} open={stopModalOpen}
        onCancel={() => setStopModalOpen(false)} footer={null}>
        <Form form={stopForm} layout="vertical" onFinish={handleAddStop}>
          <Form.Item name="tpsId" label="ID TPS" rules={[{ required: true }]}>
            <Input placeholder="UUID TPS" />
          </Form.Item>
          <Form.Item name="stopOrder" label="Urutan Stop" rules={[{ required: true }]}>
            <InputNumber min={1} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="estimatedArrival" label="Estimasi Kedatangan">
            <Input placeholder="HH:MM" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={submitting} block>Simpan</Button>
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}
