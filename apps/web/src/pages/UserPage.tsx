import React, { useMemo, useRef, useState } from 'react';
import { Eye, MoreHorizontal } from 'lucide-react';
import dayjs from 'dayjs';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { createColumnHelper } from '@tanstack/react-table';
import api from '../services/api';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { PageHeader, SlideOver, VisualSelector, PageTransition } from '../components/common';
import { DetailDrawer } from '../components/data';
import { DataTable, DataTableColumnHeader, Highlight } from '@/components/data-table';
import type { FilterDef } from '@/components/data-table';
import { useServerTable } from '@/hooks/useServerTable';

interface User {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  role: string;
  area_id: string | null;
  is_active: boolean;
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

const userFilterDefs: FilterDef[] = [
  {
    key: 'role',
    label: 'Peran',
    type: 'select',
    options: Object.entries(roleLabels).map(([value, label]) => ({ value, label })),
  },
];

const createUserSchema = z.object({
  name: z.string().min(2, 'Minimal 2 karakter'),
  role: z.string().min(1, 'Pilih peran'),
  email: z.string().email('Email tidak valid').optional().or(z.literal('')),
  password: z.string().min(8, 'Minimal 8 karakter').optional().or(z.literal('')),
  phone: z.string().regex(/^08\d{8,12}$/, 'Format: 08xxxxxxxxxx').optional().or(z.literal('')),
  areaId: z.string().optional(),
});

type CreateUserForm = z.infer<typeof createUserSchema>;

const columnHelper = createColumnHelper<User>();

const UserPage: React.FC = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const [drawerRecord, setDrawerRecord] = useState<User | null>(null);
  const [selectedRole, setSelectedRole] = useState<string | undefined>();
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<CreateUserForm>({
    resolver: zodResolver(createUserSchema),
    defaultValues: { name: '', role: '', email: '', password: '', phone: '', areaId: '' },
  });

  const searchTextRef = useRef('');

  const columnDefs = useMemo(() => [
    columnHelper.accessor('name', {
      header: ({ column }) => <DataTableColumnHeader column={column} title="Nama" />,
      cell: ({ getValue }) => <Highlight text={getValue()} query={searchTextRef.current} />,
      size: 160,
      enableSorting: true,
    }),
    columnHelper.accessor('email', {
      id: 'contact',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Email / HP" />,
      cell: ({ row }) => {
        const value = row.original.email || row.original.phone || '-';
        return <Highlight text={value} query={searchTextRef.current} />;
      },
      size: 180,
      enableSorting: false,
    }),
    columnHelper.accessor('role', {
      header: ({ column }) => <DataTableColumnHeader column={column} title="Peran" />,
      cell: ({ getValue }) => {
        const v = getValue();
        return (
          <Badge variant="outline" className={roleColors[v] || ''}>
            {roleLabels[v] || v}
          </Badge>
        );
      },
      size: 130,
      enableSorting: false,
    }),
    columnHelper.accessor('area_id', {
      header: ({ column }) => <DataTableColumnHeader column={column} title="Area" />,
      cell: ({ getValue }) => getValue() || '-',
      size: 120,
      enableSorting: false,
    }),
    columnHelper.accessor('created_at', {
      header: ({ column }) => <DataTableColumnHeader column={column} title="Terdaftar" />,
      cell: ({ getValue }) => dayjs(getValue()).format('DD MMM YYYY'),
      size: 120,
      enableSorting: true,
    }),
    columnHelper.display({
      id: 'actions',
      header: () => <span className="text-xs font-medium">Aksi</span>,
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => e.stopPropagation()}>
              <MoreHorizontal className="h-3.5 w-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setDrawerRecord(row.original); }}>
              <Eye className="h-3.5 w-3.5 mr-2" />
              Detail
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
      size: 80,
    }),
  ], []);

  const {
    table, data, isLoading, meta, searchText, setSearchText,
    filters, setFilter, resetFilters, activeFilterCount, refetch, setPage, setLimit,
  } = useServerTable<User>({
    endpoint: '/users',
    columnDefs,
    defaultSort: { field: 'name', order: 'asc' },
    filterDefs: userFilterDefs,
  });

  searchTextRef.current = searchText;

  const handleCreate = async (values: CreateUserForm) => {
    setSubmitting(true);
    try {
      await api.post('/users', values);
      toast.success('Pengguna berhasil dibuat');
      setModalOpen(false);
      form.reset();
      setSelectedRole(undefined);
      refetch();
    } catch { toast.error('Gagal membuat pengguna'); }
    setSubmitting(false);
  };

  return (
    <PageTransition>
    <div>
      <PageHeader
        title="Manajemen Pengguna"
        description="Kelola semua pengguna sistem"
        breadcrumbs={[{ label: 'Dashboard', path: '/' }, { label: 'Pengguna' }]}
        primaryAction={{ label: 'Tambah Pengguna', onClick: () => setModalOpen(true) }}
      />

      <DataTable
        table={table}
        meta={meta}
        isLoading={isLoading}
        searchText={searchText}
        onSearchChange={setSearchText}
        searchPlaceholder="Cari nama, email, atau nomor HP..."
        filters={filters}
        onFilterChange={setFilter}
        onResetFilters={resetFilters}
        activeFilterCount={activeFilterCount}
        filterDefs={userFilterDefs}
        filterLabels={{ role: 'Peran' }}
        onPageChange={setPage}
        onLimitChange={setLimit}
        onRefresh={refetch}
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
          { label: 'Area', value: drawerRecord.area_id || '-' },
          { label: 'Terdaftar', value: dayjs(drawerRecord.created_at).format('DD MMM YYYY, HH:mm') },
        ] : []}
      />
    </div>
    </PageTransition>
  );
};

export default UserPage;
