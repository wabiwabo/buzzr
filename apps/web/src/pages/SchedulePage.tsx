import React, { useEffect, useState } from 'react';
import { Form, Input, Select, Button, Space, Dropdown, Tag, Checkbox, InputNumber, message } from 'antd';
import { EyeOutlined, MoreOutlined, PlusOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import api from '../services/api';
import { PageHeader, StatusBadge, StepWizard, PageTransition } from '../components/common';
import { SmartTable, DetailDrawer } from '../components/data';
import { useTableState } from '../hooks/useTableState';
import type { FilterDef } from '../hooks/useTableState';

interface Schedule {
  id: string;
  route_name: string;
  vehicle_id: string;
  vehicle_plate?: string;
  driver_id: string;
  driver_name?: string;
  schedule_type: string;
  recurring_days: number[] | null;
  scheduled_date: string | null;
  start_time: string;
  status: string;
}

const dayLabels = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
const dayOptions = dayLabels.map((label, idx) => ({ label, value: idx }));

const filterDefs: FilterDef[] = [
  { key: 'schedule_type', label: 'Tipe', type: 'select', options: [
    { label: 'Rutin', value: 'recurring' }, { label: 'On-Demand', value: 'on_demand' },
  ]},
  { key: 'status', label: 'Status', type: 'select', options: [
    { label: 'Aktif', value: 'active' }, { label: 'Selesai', value: 'completed' },
    { label: 'Dalam Proses', value: 'in_progress' }, { label: 'Dibatalkan', value: 'cancelled' },
  ]},
];

const SchedulePage: React.FC = () => {
  const tableState = useTableState<Schedule>({ searchFields: ['route_name', 'driver_name', 'vehicle_plate'] });
  const [modalOpen, setModalOpen] = useState(false);
  const [drawerRecord, setDrawerRecord] = useState<Schedule | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [form] = Form.useForm();

  const fetchData = async () => {
    tableState.setLoading(true);
    try {
      const { data } = await api.get('/schedules', { params: {} });
      tableState.setData(Array.isArray(data) ? data : []);
    } catch { /* empty state is fine */ }
    tableState.setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const handleCreate = async (values: any) => {
    setSubmitting(true);
    try {
      await api.post('/schedules', values);
      message.success('Jadwal berhasil dibuat');
      setModalOpen(false);
      form.resetFields();
      fetchData();
    } catch { message.error('Gagal membuat jadwal'); }
    setSubmitting(false);
  };

  const columns: ColumnsType<Schedule> = [
    { title: 'Nama Rute', dataIndex: 'route_name', sorter: true, width: 180 },
    { title: 'Kendaraan', width: 130, render: (_, r) => r.vehicle_plate || r.vehicle_id?.slice(0, 8) },
    { title: 'Driver', width: 140, render: (_, r) => r.driver_name || r.driver_id?.slice(0, 8) },
    {
      title: 'Tipe', dataIndex: 'schedule_type', width: 110,
      render: (t) => <Tag color={t === 'recurring' ? 'blue' : 'purple'}>{t === 'recurring' ? 'Rutin' : 'On-Demand'}</Tag>,
    },
    {
      title: 'Hari/Tanggal', width: 160,
      render: (_, record) => {
        if (record.schedule_type === 'recurring' && record.recurring_days) {
          return record.recurring_days.map((d) => dayLabels[d] || d).join(', ');
        }
        return record.scheduled_date || '-';
      },
    },
    { title: 'Jam', dataIndex: 'start_time', width: 80 },
    { title: 'Status', dataIndex: 'status', width: 120, render: (v) => <StatusBadge status={v} /> },
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

  return (
    <PageTransition>
    <div>
      <PageHeader
        title="Manajemen Jadwal"
        description="Kelola jadwal pengangkutan sampah"
        breadcrumbs={[{ label: 'Dashboard', path: '/' }, { label: 'Jadwal' }]}
        primaryAction={{ label: 'Tambah Jadwal', onClick: () => setModalOpen(true) }}
      />

      <SmartTable<Schedule>
        tableState={tableState}
        columns={columns}
        filterDefs={filterDefs}
        searchPlaceholder="Cari nama rute, driver, kendaraan..."
        onRefresh={fetchData}
        onRowClick={(r) => setDrawerRecord(r)}
        emptyTitle="Belum ada jadwal"
        emptyDescription="Buat jadwal pertama untuk mengatur pengangkutan"
        emptyActionLabel="Tambah Jadwal"
        onEmptyAction={() => setModalOpen(true)}
      />

      <Form form={form} layout="vertical" onFinish={handleCreate}>
        <StepWizard
          open={modalOpen}
          onClose={() => { setModalOpen(false); form.resetFields(); }}
          title="Buat Jadwal Pengangkutan"
          onComplete={() => form.submit()}
          loading={submitting}
          steps={[
            {
              title: 'Informasi Rute',
              content: (
                <>
                  <Form.Item name="routeName" label="Nama Rute" rules={[{ required: true }]}>
                    <Input placeholder="Contoh: Rute Bandung Utara" />
                  </Form.Item>
                  <Form.Item name="scheduleType" label="Tipe Jadwal" rules={[{ required: true }]}>
                    <Select options={[
                      { label: 'Rutin', value: 'recurring' }, { label: 'On-Demand', value: 'on_demand' },
                    ]} />
                  </Form.Item>
                </>
              ),
            },
            {
              title: 'Driver & Kendaraan',
              content: (
                <>
                  <Form.Item name="driverId" label="ID Driver" rules={[{ required: true }]}>
                    <Input placeholder="UUID driver" />
                  </Form.Item>
                  <Form.Item name="vehicleId" label="ID Kendaraan" rules={[{ required: true }]}>
                    <Input placeholder="UUID kendaraan" />
                  </Form.Item>
                </>
              ),
            },
            {
              title: 'Jadwal',
              content: (
                <>
                  <Form.Item name="recurringDays" label="Hari (untuk Rutin)">
                    <Checkbox.Group options={dayOptions} />
                  </Form.Item>
                  <Form.Item name="scheduledDate" label="Tanggal (On-Demand)">
                    <Input placeholder="YYYY-MM-DD" />
                  </Form.Item>
                  <Form.Item name="startTime" label="Jam Mulai" rules={[{ required: true }]}>
                    <Input placeholder="HH:MM" />
                  </Form.Item>
                </>
              ),
            },
          ]}
        />
      </Form>

      <DetailDrawer
        open={!!drawerRecord}
        onClose={() => setDrawerRecord(null)}
        title={`Jadwal: ${drawerRecord?.route_name || ''}`}
        fields={drawerRecord ? [
          { label: 'Tipe', value: drawerRecord.schedule_type === 'recurring' ? 'Rutin' : 'On-Demand' },
          { label: 'Status', value: <StatusBadge status={drawerRecord.status} /> },
          { label: 'Kendaraan', value: drawerRecord.vehicle_plate || drawerRecord.vehicle_id },
          { label: 'Driver', value: drawerRecord.driver_name || drawerRecord.driver_id },
          { label: 'Jam Mulai', value: drawerRecord.start_time },
          { label: 'Hari', value: drawerRecord.recurring_days?.map((d) => dayLabels[d]).join(', ') || drawerRecord.scheduled_date || '-' },
        ] : []}
      />
    </div>
    </PageTransition>
  );
};

export default SchedulePage;
