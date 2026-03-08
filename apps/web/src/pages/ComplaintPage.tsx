import React, { useEffect, useState } from 'react';
import { Form, Select, Button, Space, Dropdown, Tabs, Tag, Typography, message } from 'antd';
import { EyeOutlined, MoreOutlined, UserAddOutlined, CheckOutlined, CloseOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import api from '../services/api';
import { PageHeader, StatusBadge, InfoTooltip, QuickAction } from '../components/common';
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

const SLA_HOURS = 72;

const ComplaintPage: React.FC = () => {
  const tableState = useTableState<Complaint>({ searchFields: ['reporter_name', 'address', 'description'] });
  const [activeTab, setActiveTab] = useState('all');
  const [drawerRecord, setDrawerRecord] = useState<Complaint | null>(null);
  const [staffList, setStaffList] = useState<{ id: string; name: string; role: string }[]>([]);
  const [selectedStaff, setSelectedStaff] = useState<string>('');

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
            {
              key: 'assign', icon: <UserAddOutlined />,
              label: (
                <QuickAction
                  title="Assign Petugas"
                  trigger={<span>Assign</span>}
                  onConfirm={async () => {
                    if (!selectedStaff) return;
                    await api.patch(`/complaints/${record.id}/assign`, { assigneeId: selectedStaff });
                    message.success('Laporan berhasil ditugaskan');
                    setSelectedStaff('');
                    fetchData(activeTab);
                  }}
                >
                  <Select
                    showSearch
                    optionFilterProp="label"
                    placeholder="Pilih petugas..."
                    style={{ width: '100%' }}
                    options={staffList.map((s) => ({ label: `${s.name} (${s.role})`, value: s.id }))}
                    onChange={setSelectedStaff}
                  />
                </QuickAction>
              ),
            },
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
            <Button type="primary" onClick={() => { handleStatusChange(drawerRecord.id, 'resolved'); setDrawerRecord(null); }}>Selesaikan</Button>
          </Space>
        )}
      />
    </div>
  );
};

export default ComplaintPage;
