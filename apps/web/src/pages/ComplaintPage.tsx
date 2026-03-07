import React, { useEffect, useState } from 'react';
import { Table, Button, Modal, Input, Tag, Space, Tabs, message, Alert } from 'antd';
import { ComplaintStatus, ComplaintCategory } from '@buzzr/shared-types';
import { COMPLAINT_STATUS_LABELS } from '@buzzr/constants';
import type { ColumnsType } from 'antd/es/table';
import api from '../services/api';

interface Complaint {
  id: string;
  reporter_id: string;
  reporter_name?: string;
  category: ComplaintCategory;
  status: ComplaintStatus;
  description: string;
  address: string;
  assignee_id: string | null;
  assignee_name?: string;
  created_at: string;
  resolved_at: string | null;
}

const statusColors: Record<string, string> = {
  submitted: 'blue',
  verified: 'cyan',
  assigned: 'orange',
  in_progress: 'gold',
  resolved: 'green',
  rejected: 'red',
};

const categoryLabels: Record<string, string> = {
  illegal_dumping: 'Pembuangan Ilegal',
  tps_full: 'TPS Penuh',
  missed_pickup: 'Tidak Diangkut',
  other: 'Lainnya',
};

export default function ComplaintPage() {
  const [data, setData] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>('all');
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [assigneeId, setAssigneeId] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchData = async (status?: string) => {
    try {
      setLoading(true);
      const params: Record<string, string> = {};
      if (status && status !== 'all') params.status = status;
      const res = await api.get('/complaints', { params });
      setData(res.data);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Gagal memuat data laporan');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(activeTab); }, [activeTab]);

  const handleAssign = async () => {
    if (!selectedComplaint) return;
    try {
      setSubmitting(true);
      await api.patch(`/complaints/${selectedComplaint.id}/assign`, { assigneeId });
      message.success('Petugas berhasil ditugaskan');
      setAssignModalOpen(false);
      setAssigneeId('');
      fetchData(activeTab);
    } catch (err: any) {
      message.error(err.response?.data?.message || 'Gagal menugaskan petugas');
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusChange = async (id: string, status: string) => {
    try {
      await api.patch(`/complaints/${id}/status`, { status });
      message.success('Status berhasil diubah');
      fetchData(activeTab);
    } catch (err: any) {
      message.error(err.response?.data?.message || 'Gagal mengubah status');
    }
  };

  const columns: ColumnsType<Complaint> = [
    {
      title: 'Pelapor', key: 'reporter',
      render: (_: any, r: Complaint) => r.reporter_name || r.reporter_id,
      ellipsis: true,
    },
    {
      title: 'Kategori', dataIndex: 'category', key: 'category',
      render: (c: string) => categoryLabels[c] || c,
    },
    {
      title: 'Status', dataIndex: 'status', key: 'status',
      render: (s: ComplaintStatus) => (
        <Tag color={statusColors[s] || 'default'}>
          {COMPLAINT_STATUS_LABELS[s] || s}
        </Tag>
      ),
    },
    {
      title: 'Tanggal', dataIndex: 'created_at', key: 'created_at',
      render: (d: string) => d ? new Date(d).toLocaleDateString('id-ID') : '-',
    },
    { title: 'Alamat', dataIndex: 'address', key: 'address', ellipsis: true },
    {
      title: 'Assignee', key: 'assignee',
      render: (_: any, r: Complaint) => r.assignee_name || r.assignee_id || <Tag>Belum ditugaskan</Tag>,
    },
    {
      title: 'Aksi', key: 'actions',
      render: (_: any, record: Complaint) => (
        <Space>
          <Button size="small" onClick={() => { setSelectedComplaint(record); setAssignModalOpen(true); }}>
            Assign
          </Button>
          {record.status !== ComplaintStatus.RESOLVED && record.status !== ComplaintStatus.REJECTED && (
            <Button size="small" type="primary" onClick={() => handleStatusChange(record.id, 'resolved')}>
              Selesai
            </Button>
          )}
          {record.status === ComplaintStatus.SUBMITTED && (
            <Button size="small" danger onClick={() => handleStatusChange(record.id, 'rejected')}>
              Tolak
            </Button>
          )}
        </Space>
      ),
    },
  ];

  const tabItems = [
    { key: 'all', label: 'Semua' },
    ...Object.values(ComplaintStatus).map((s) => ({
      key: s,
      label: COMPLAINT_STATUS_LABELS[s] || s,
    })),
  ];

  if (error && !data.length) return <Alert type="error" message={error} />;

  return (
    <>
      <Tabs activeKey={activeTab} onChange={setActiveTab} items={tabItems} style={{ marginBottom: 16 }} />

      <Table columns={columns} dataSource={data} rowKey="id" loading={loading} pagination={{ pageSize: 10 }} />

      <Modal title="Assign Petugas" open={assignModalOpen} onOk={handleAssign}
        onCancel={() => setAssignModalOpen(false)} confirmLoading={submitting}>
        <p>Laporan: {selectedComplaint?.description}</p>
        <Input placeholder="ID Petugas (UUID)" value={assigneeId} onChange={(e) => setAssigneeId(e.target.value)} />
      </Modal>
    </>
  );
}
