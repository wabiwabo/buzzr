# Phase 5: Page Redesigns

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Rewrite all 6 data pages (TPS, Fleet, Schedule, Complaint, Payment, User) using SmartTable and shared components.

**Depends on:** Phase 1-3 complete.

**Pattern:** Every page follows the same structure:
1. `<PageHeader>` with breadcrumb, description, primary action
2. `<SmartTable>` with page-specific columns, filters, bulk actions, export
3. CRUD modal with grouped fields, InfoTooltip, validation
4. `<DetailDrawer>` for row detail view

---

### Task 16: TPS Page Redesign

**Files:**
- Rewrite: `apps/web/src/pages/TpsPage.tsx`

**Step 1: Rewrite TpsPage**

```tsx
import React, { useEffect, useState } from 'react';
import { Modal, Form, Input, InputNumber, Select, Progress, Button, Space, Dropdown, message, Tag } from 'antd';
import { EnvironmentOutlined, EditOutlined, EyeOutlined, MoreOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import api from '../services/api';
import { PageHeader, StatusBadge, InfoTooltip } from '../components/common';
import { SmartTable } from '../components/data';
import { DetailDrawer } from '../components/data';
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
                <span>📍 {record.address}</span>
                <span>📏 Koordinat: {record.latitude}, {record.longitude}</span>
                <span>🔖 QR: {record.qr_code || '-'}</span>
              </Space>
            </div>
          ),
        }}
      />

      {/* Create Modal */}
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

      {/* Detail Drawer */}
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
```

**Step 2: Commit**

```bash
git add apps/web/src/pages/TpsPage.tsx
git commit -m "feat(web): redesign TPS page with SmartTable, FilterPanel, DetailDrawer"
```

---

### Task 17: Fleet Page Redesign

**Files:**
- Rewrite: `apps/web/src/pages/FleetPage.tsx`

**Step 1: Rewrite FleetPage**

Follow the same pattern as TpsPage. Key differences:
- Columns: plat nomor, tipe (Truk/Gerobak/Motor), kapasitas, driver (nama not UUID), status
- Filters: type, status
- Modal: create vehicle + assign driver (dropdown search, not UUID input)
- Assign modal fetches `/users?role=driver` to populate driver dropdown
- Export: fleet data CSV/Excel

```tsx
import React, { useEffect, useState } from 'react';
import { Modal, Form, Input, InputNumber, Select, Button, Space, Dropdown, message, Tag } from 'antd';
import { CarOutlined, EditOutlined, EyeOutlined, MoreOutlined, UserAddOutlined, UserDeleteOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import api from '../services/api';
import { PageHeader, StatusBadge, ConfirmAction } from '../components/common';
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

      {/* Create Vehicle Modal */}
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

      {/* Assign Driver Modal */}
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

      {/* Detail Drawer */}
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
          <>
            <Button onClick={() => { setDrawerRecord(null); setAssignModal(drawerRecord); }}>Assign Driver</Button>
          </>
        )}
      />
    </div>
  );
};

export default FleetPage;
```

**Step 2: Commit**

```bash
git add apps/web/src/pages/FleetPage.tsx
git commit -m "feat(web): redesign Fleet page with SmartTable, driver dropdown, DetailDrawer"
```

---

### Task 18: Complaint Page Redesign

**Files:**
- Rewrite: `apps/web/src/pages/ComplaintPage.tsx`

**Step 1: Rewrite ComplaintPage**

Key features: SLA countdown, bulk assign, status-colored priority dots, tab+filter combination.

```tsx
import React, { useEffect, useState } from 'react';
import { Modal, Form, Select, Button, Space, Dropdown, Tabs, Tag, Typography, message } from 'antd';
import { AlertOutlined, EyeOutlined, MoreOutlined, UserAddOutlined, CheckOutlined, CloseOutlined, ClockCircleOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import api from '../services/api';
import { PageHeader, StatusBadge, InfoTooltip } from '../components/common';
import { SmartTable, DetailDrawer } from '../components/data';
import { useTableState } from '../hooks/useTableState';

const { Text } = Typography;

interface Complaint {
  id: string;
  reporter_name: string;
  reporter_id: string;
  category: string;
  status: string;
  description: string;
  address: string;
  latitude: number;
  longitude: number;
  assigned_to: string | null;
  assignee_name: string | null;
  created_at: string;
  resolved_at: string | null;
}

const categoryLabels: Record<string, string> = {
  illegal_dumping: 'Pembuangan Ilegal',
  tps_full: 'TPS Penuh',
  missed_pickup: 'Tidak Diangkut',
  other: 'Lainnya',
};

const SLA_HOURS = 72; // 3 days

const ComplaintPage: React.FC = () => {
  const tableState = useTableState<Complaint>({ searchFields: ['reporter_name', 'address', 'description'] });
  const [activeTab, setActiveTab] = useState('all');
  const [assignModal, setAssignModal] = useState<Complaint | null>(null);
  const [drawerRecord, setDrawerRecord] = useState<Complaint | null>(null);
  const [staffList, setStaffList] = useState<{ id: string; name: string; role: string }[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [assignForm] = Form.useForm();

  const fetchData = async (status?: string) => {
    tableState.setLoading(true);
    try {
      const params = status && status !== 'all' ? { status } : {};
      const { data } = await api.get('/complaints', { params });
      tableState.setData(Array.isArray(data) ? data : []);
    } catch { message.error('Gagal memuat data laporan'); }
    tableState.setLoading(false);
  };

  const fetchStaff = async () => {
    try {
      const { data } = await api.get('/users');
      const staff = (Array.isArray(data) ? data : []).filter(
        (u: any) => ['dlh_admin', 'sweeper', 'tps_operator'].includes(u.role)
      );
      setStaffList(staff);
    } catch { /* silent */ }
  };

  useEffect(() => { fetchData(); fetchStaff(); }, []);

  const handleTabChange = (key: string) => {
    setActiveTab(key);
    fetchData(key);
  };

  const handleAssign = async (values: any) => {
    if (!assignModal) return;
    setSubmitting(true);
    try {
      await api.patch(`/complaints/${assignModal.id}/assign`, { assigneeId: values.assignee_id });
      message.success('Laporan berhasil ditugaskan');
      setAssignModal(null);
      assignForm.resetFields();
      fetchData(activeTab);
    } catch { message.error('Gagal menugaskan'); }
    setSubmitting(false);
  };

  const handleStatusChange = async (id: string, status: string) => {
    try {
      await api.patch(`/complaints/${id}/status`, { status });
      message.success(`Status berhasil diubah ke ${status}`);
      fetchData(activeTab);
    } catch { message.error('Gagal mengubah status'); }
  };

  const getSlaInfo = (createdAt: string, status: string) => {
    if (['resolved', 'rejected'].includes(status)) return null;
    const created = dayjs(createdAt);
    const deadline = created.add(SLA_HOURS, 'hour');
    const hoursLeft = deadline.diff(dayjs(), 'hour');
    if (hoursLeft <= 0) return <Tag color="red">SLA Terlewat</Tag>;
    if (hoursLeft <= 24) return <Tag color="orange">{hoursLeft}j tersisa</Tag>;
    return <Tag color="blue">{Math.floor(hoursLeft / 24)}h {hoursLeft % 24}j</Tag>;
  };

  const columns: ColumnsType<Complaint> = [
    { title: 'Pelapor', dataIndex: 'reporter_name', width: 140, render: (v, r) => v || r.reporter_id?.slice(0, 8) },
    { title: 'Kategori', dataIndex: 'category', width: 150, render: (v) => categoryLabels[v] || v },
    { title: 'Status', dataIndex: 'status', width: 120, render: (v) => <StatusBadge status={v} /> },
    {
      title: <>SLA <InfoTooltip text="Batas waktu penyelesaian: 3 hari kerja" /></>,
      width: 120,
      render: (_, r) => getSlaInfo(r.created_at, r.status),
    },
    { title: 'Tanggal', dataIndex: 'created_at', width: 120, render: (v) => dayjs(v).format('DD MMM YYYY') },
    { title: 'Alamat', dataIndex: 'address', ellipsis: true, width: 180 },
    {
      title: 'Assignee', width: 140,
      render: (_, r) => r.assignee_name || <Tag color="default">Belum ditugaskan</Tag>,
    },
    {
      title: 'Aksi', width: 80,
      render: (_, record) => (
        <Dropdown menu={{
          items: [
            { key: 'view', icon: <EyeOutlined />, label: 'Detail', onClick: () => setDrawerRecord(record) },
            { key: 'assign', icon: <UserAddOutlined />, label: 'Assign', onClick: () => setAssignModal(record) },
            ...(!['resolved', 'rejected'].includes(record.status) ? [
              { key: 'resolve', icon: <CheckOutlined />, label: 'Selesaikan', onClick: () => handleStatusChange(record.id, 'resolved') },
            ] : []),
            ...(record.status === 'submitted' ? [
              { key: 'reject', icon: <CloseOutlined />, label: 'Tolak', danger: true, onClick: () => handleStatusChange(record.id, 'rejected') },
            ] : []),
          ],
        }}>
          <Button type="text" icon={<MoreOutlined />} size="small" />
        </Dropdown>
      ),
    },
  ];

  const tabItems = [
    { key: 'all', label: 'Semua' },
    { key: 'submitted', label: 'Baru' },
    { key: 'assigned', label: 'Ditugaskan' },
    { key: 'in_progress', label: 'Dalam Proses' },
    { key: 'resolved', label: 'Selesai' },
    { key: 'rejected', label: 'Ditolak' },
  ];

  return (
    <div>
      <PageHeader
        title="Laporan Warga"
        description="Kelola dan tindaklanjuti laporan dari masyarakat"
        breadcrumbs={[{ label: 'Dashboard', path: '/' }, { label: 'Laporan Warga' }]}
      />

      <Tabs activeKey={activeTab} onChange={handleTabChange} items={tabItems} style={{ marginBottom: 16 }} />

      <SmartTable<Complaint>
        tableState={tableState}
        columns={columns}
        searchPlaceholder="Cari pelapor, alamat, deskripsi..."
        exportFileName="data-laporan"
        exportColumns={[
          { title: 'Pelapor', dataIndex: 'reporter_name' },
          { title: 'Kategori', dataIndex: 'category', render: (v: string) => categoryLabels[v] || v },
          { title: 'Status', dataIndex: 'status' },
          { title: 'Tanggal', dataIndex: 'created_at' },
          { title: 'Alamat', dataIndex: 'address' },
          { title: 'Assignee', dataIndex: 'assignee_name' },
        ]}
        onRefresh={() => fetchData(activeTab)}
        onRowClick={(r) => setDrawerRecord(r)}
        bulkActions={[
          { key: 'bulk-assign', label: 'Bulk Assign', onClick: (keys) => message.info(`TODO: bulk assign ${keys.length} items`) },
        ]}
        emptyTitle="Tidak ada laporan"
        emptyDescription="Semua beres! Tidak ada laporan masuk."
      />

      {/* Assign Modal */}
      <Modal title={`Assign Laporan`} open={!!assignModal} onCancel={() => { setAssignModal(null); assignForm.resetFields(); }} footer={null}>
        <Form form={assignForm} layout="vertical" onFinish={handleAssign}>
          <Form.Item name="assignee_id" label="Pilih Petugas" rules={[{ required: true }]}>
            <Select showSearch optionFilterProp="label"
              placeholder="Cari nama petugas..."
              options={staffList.map((s) => ({ label: `${s.name} (${s.role})`, value: s.id }))}
            />
          </Form.Item>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <Button onClick={() => { setAssignModal(null); assignForm.resetFields(); }}>Batal</Button>
            <Button type="primary" htmlType="submit" loading={submitting}>Tugaskan</Button>
          </div>
        </Form>
      </Modal>

      {/* Detail Drawer */}
      <DetailDrawer
        open={!!drawerRecord}
        onClose={() => setDrawerRecord(null)}
        title="Detail Laporan"
        fields={drawerRecord ? [
          { label: 'Status', value: <StatusBadge status={drawerRecord.status} /> },
          { label: 'Pelapor', value: drawerRecord.reporter_name || drawerRecord.reporter_id },
          { label: 'Kategori', value: categoryLabels[drawerRecord.category] || drawerRecord.category },
          { label: 'Tanggal', value: dayjs(drawerRecord.created_at).format('DD MMM YYYY, HH:mm') },
          { label: 'SLA', value: getSlaInfo(drawerRecord.created_at, drawerRecord.status) || 'Selesai' },
          { label: 'Alamat', value: drawerRecord.address },
          { label: 'Deskripsi', value: drawerRecord.description },
          { label: 'Assignee', value: drawerRecord.assignee_name || 'Belum ditugaskan' },
        ] : []}
        actions={drawerRecord && !['resolved', 'rejected'].includes(drawerRecord.status) && (
          <Space>
            <Button onClick={() => { setDrawerRecord(null); setAssignModal(drawerRecord); }}>Assign</Button>
            <Button type="primary" onClick={() => { handleStatusChange(drawerRecord.id, 'resolved'); setDrawerRecord(null); }}>Selesaikan</Button>
          </Space>
        )}
      />
    </div>
  );
};

export default ComplaintPage;
```

**Step 2: Commit**

```bash
git add apps/web/src/pages/ComplaintPage.tsx
git commit -m "feat(web): redesign Complaint page with SLA countdown, bulk assign, DetailDrawer"
```

---

### Task 19: Schedule, Payment, User Pages

These follow the exact same pattern. Key differences per page:

**SchedulePage:**
- Columns: route_name, vehicle (plate), driver (name), type (Rutin/On-Demand), day/date, start_time, status
- Visual day picker in create form (checkbox group for Mon-Sun)
- Filter by status, type

**PaymentPage:**
- Summary StatCards row at top (Total Tagihan, Sudah Dibayar, Pending)
- Columns: user, type, amount (Rp format), status, date, reference
- Tabs by status + "Jatuh Tempo" tab
- Date range filter
- Currency formatting: `Rp${Number(amount).toLocaleString('id-ID')}`

**UserPage:**
- Tabs by role
- Columns: name, email/phone, role (color tag), area, status, registered date
- Create form with role-based conditional fields (stepper if complex, or progressive disclosure)
- Search by name, email, phone

**Step 1:** Rewrite each page following the TPS/Fleet/Complaint pattern above. Each page uses:
- `<PageHeader>` with breadcrumb
- `useTableState` hook
- `<SmartTable>` with columns, filters, export
- CRUD modal with grouped form fields
- `<DetailDrawer>` for detail view

**Step 2:** Commit each page individually:

```bash
git add apps/web/src/pages/SchedulePage.tsx
git commit -m "feat(web): redesign Schedule page with SmartTable"

git add apps/web/src/pages/PaymentPage.tsx
git commit -m "feat(web): redesign Payment page with SmartTable, summary stats"

git add apps/web/src/pages/UserPage.tsx
git commit -m "feat(web): redesign User page with SmartTable, role tabs"
```

---

### Task 20: Report Page Redesign

**Files:**
- Rewrite: `apps/web/src/pages/ReportPage.tsx`

**Step 1: Rewrite with enhanced charts and date range**

Key changes from current:
- Use `<PageHeader>` with breadcrumb
- Date range picker in PageHeader extra slot
- 3 tabs remain: Volume Sampah, Performa Driver, Statistik Laporan
- Volume tab: use AreaChart (stacked) instead of BarChart
- Driver tab: use SmartTable instead of plain Table
- Complaint tab: keep Statistic cards + PieChart but with glass-card styling
- Export available on driver performance table

Follow similar structure to DashboardPage charts.

**Step 2: Commit**

```bash
git add apps/web/src/pages/ReportPage.tsx
git commit -m "feat(web): redesign Report page with enhanced charts and SmartTable"
```

---

### Task 21: Login Page Polish

**Files:**
- Modify: `apps/web/src/pages/LoginPage.tsx`

**Step 1: Polish login page**

Minimal changes — add:
- Centered card with glass-card effect
- Buzzr logo/title at top
- Subtle background gradient
- Form validation messages in Indonesian
- Loading state on submit button
- Footer link "Butuh bantuan? Hubungi administrator"

**Step 2: Commit**

```bash
git add apps/web/src/pages/LoginPage.tsx
git commit -m "feat(web): polish Login page with glass-card styling"
```
