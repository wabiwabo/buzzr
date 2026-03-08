import React, { useEffect, useState } from 'react';
import { Eye, MoreHorizontal } from 'lucide-react';
import dayjs from 'dayjs';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import api from '../services/api';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { PageHeader, StatusBadge, SlideOver, VisualSelector, PageTransition } from '../components/common';
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
  citizen: 'bg-neutral/10 text-neutral border-neutral/20',
  sweeper: 'bg-cyan-500/10 text-cyan-600 border-cyan-500/20',
  tps_operator: 'bg-info/10 text-info border-info/20',
  collector: 'bg-purple-500/10 text-purple-600 border-purple-500/20',
  driver: 'bg-warning/10 text-warning border-warning/20',
  tpst_operator: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20',
  dlh_admin: 'bg-positive/10 text-positive border-positive/20',
  super_admin: 'bg-negative/10 text-negative border-negative/20',
};

const roleLabels: Record<string, string> = {
  citizen: 'Warga', sweeper: 'Penyapu', tps_operator: 'Operator TPS',
  collector: 'Pengumpul', driver: 'Driver', tpst_operator: 'Operator TPST',
  dlh_admin: 'Admin DLH', super_admin: 'Super Admin',
};

const OTP_ROLES = ['citizen'];
const PASSWORD_ROLES = ['sweeper', 'tps_operator', 'collector', 'driver', 'tpst_operator', 'dlh_admin', 'super_admin'];

const createUserSchema = z.object({
  name: z.string().min(2, 'Minimal 2 karakter'),
  role: z.string().min(1, 'Pilih peran'),
  email: z.string().email('Email tidak valid').optional().or(z.literal('')),
  password: z.string().min(8, 'Minimal 8 karakter').optional().or(z.literal('')),
  phone: z.string().regex(/^08\d{8,12}$/, 'Format: 08xxxxxxxxxx').optional().or(z.literal('')),
  areaId: z.string().optional(),
});

type CreateUserForm = z.infer<typeof createUserSchema>;

const UserPage: React.FC = () => {
  const tableState = useTableState<User>({ searchFields: ['name', 'email', 'phone'] });
  const [activeTab, setActiveTab] = useState('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [drawerRecord, setDrawerRecord] = useState<User | null>(null);
  const [selectedRole, setSelectedRole] = useState<string | undefined>();
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<CreateUserForm>({
    resolver: zodResolver(createUserSchema),
    defaultValues: { name: '', role: '', email: '', password: '', phone: '', areaId: '' },
  });

  const fetchData = async (role?: string) => {
    tableState.setLoading(true);
    try {
      const params = role && role !== 'all' ? { role } : {};
      const { data } = await api.get('/users', { params });
      tableState.setData(Array.isArray(data) ? data : []);
    } catch { toast.error('Gagal memuat data pengguna'); }
    tableState.setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const handleTabChange = (key: string) => {
    setActiveTab(key);
    fetchData(key);
  };

  const handleCreate = async (values: CreateUserForm) => {
    setSubmitting(true);
    try {
      await api.post('/users', values);
      toast.success('Pengguna berhasil dibuat');
      setModalOpen(false);
      form.reset();
      setSelectedRole(undefined);
      fetchData(activeTab);
    } catch { toast.error('Gagal membuat pengguna'); }
    setSubmitting(false);
  };

  const columns = [
    { title: 'Nama', dataIndex: 'name', sorter: true, width: 160 },
    {
      title: 'Email / HP', key: 'contact', width: 180, ellipsis: true,
      render: (_: any, r: User) => r.email || r.phone || '-',
    },
    {
      title: 'Role', dataIndex: 'role', width: 130,
      render: (v: string) => (
        <Badge variant="outline" className={roleColors[v] || ''}>
          {roleLabels[v] || v}
        </Badge>
      ),
    },
    { title: 'Area', dataIndex: 'area_id', width: 120, ellipsis: true, render: (v: string) => v || '-' },
    { title: 'Status', dataIndex: 'status', width: 100, render: (v: string) => <StatusBadge status={v || 'active'} /> },
    { title: 'Terdaftar', dataIndex: 'created_at', width: 120, render: (v: string) => dayjs(v).format('DD MMM YYYY') },
    {
      title: 'Aksi', key: 'actions', width: 80,
      render: (_: any, record: User) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => e.stopPropagation()}>
              <MoreHorizontal className="h-3.5 w-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setDrawerRecord(record); }}>
              <Eye className="h-3.5 w-3.5 mr-2" />
              Detail
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  const tabItems = [
    { key: 'all', label: 'Semua' },
    ...Object.entries(roleLabels).map(([key, label]) => ({ key, label })),
  ];

  return (
    <PageTransition>
    <div>
      <PageHeader
        title="Manajemen Pengguna"
        description="Kelola semua pengguna sistem"
        breadcrumbs={[{ label: 'Dashboard', path: '/' }, { label: 'Pengguna' }]}
        primaryAction={{ label: 'Tambah Pengguna', onClick: () => setModalOpen(true) }}
      />

      <Tabs value={activeTab} onValueChange={handleTabChange} className="mb-4">
        <TabsList className="h-auto flex-wrap">
          {tabItems.map((item) => (
            <TabsTrigger key={item.key} value={item.key} className="text-xs">
              {item.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

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
        onClose={() => { setModalOpen(false); setSelectedRole(undefined); form.reset(); }}
        title="Tambah Pengguna"
        footer={
          <>
            <Button variant="outline" onClick={() => { setModalOpen(false); form.reset(); setSelectedRole(undefined); }}>Batal</Button>
            <Button onClick={form.handleSubmit(handleCreate)} disabled={submitting}>
              {submitting ? 'Menyimpan...' : 'Simpan'}
            </Button>
          </>
        }
      >
        <form onSubmit={form.handleSubmit(handleCreate)} className="space-y-4">
          <div>
            <Label htmlFor="name">Nama</Label>
            <Input id="name" placeholder="Nama lengkap" {...form.register('name')} />
            {form.formState.errors.name && (
              <p className="text-xs text-destructive mt-1">{form.formState.errors.name.message}</p>
            )}
          </div>
          <div>
            <Label>Peran</Label>
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
              onChange={(v) => { setSelectedRole(v); form.setValue('role', v); }}
            />
            {form.formState.errors.role && (
              <p className="text-xs text-destructive mt-1">{form.formState.errors.role.message}</p>
            )}
          </div>
          {selectedRole && PASSWORD_ROLES.includes(selectedRole) && (
            <>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" placeholder="email@example.com" {...form.register('email')} />
                {form.formState.errors.email && (
                  <p className="text-xs text-destructive mt-1">{form.formState.errors.email.message}</p>
                )}
              </div>
              <div>
                <Label htmlFor="password">Password</Label>
                <Input id="password" type="password" placeholder="Minimal 8 karakter" {...form.register('password')} />
                {form.formState.errors.password && (
                  <p className="text-xs text-destructive mt-1">{form.formState.errors.password.message}</p>
                )}
              </div>
            </>
          )}
          {selectedRole && OTP_ROLES.includes(selectedRole) && (
            <div>
              <Label htmlFor="phone">Nomor HP</Label>
              <Input id="phone" placeholder="08xxxxxxxxxx" {...form.register('phone')} />
              {form.formState.errors.phone && (
                <p className="text-xs text-destructive mt-1">{form.formState.errors.phone.message}</p>
              )}
            </div>
          )}
          <div>
            <Label htmlFor="areaId">Area ID</Label>
            <Input id="areaId" placeholder="UUID area (opsional)" {...form.register('areaId')} />
          </div>
        </form>
      </SlideOver>

      <DetailDrawer
        open={!!drawerRecord}
        onClose={() => setDrawerRecord(null)}
        title={`Pengguna: ${drawerRecord?.name || ''}`}
        fields={drawerRecord ? [
          { label: 'Role', value: <Badge variant="outline" className={roleColors[drawerRecord.role]}>{roleLabels[drawerRecord.role] || drawerRecord.role}</Badge> },
          { label: 'Email', value: drawerRecord.email || '-' },
          { label: 'HP', value: drawerRecord.phone || '-' },
          { label: 'Status', value: <StatusBadge status={drawerRecord.status || 'active'} /> },
          { label: 'Area', value: drawerRecord.area_id || '-' },
          { label: 'Terdaftar', value: dayjs(drawerRecord.created_at).format('DD MMM YYYY, HH:mm') },
        ] : []}
      />
    </div>
    </PageTransition>
  );
};

export default UserPage;
