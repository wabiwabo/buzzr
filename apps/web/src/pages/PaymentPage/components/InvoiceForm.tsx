import React, { useState, useEffect } from 'react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import api from '@/services/api';
import { createInvoice } from '../api';
import { TYPE_OPTIONS } from '../types';

interface UserOption { id: string; name: string; phone: string | null; }

interface InvoiceFormProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const InvoiceForm: React.FC<InvoiceFormProps> = ({ open, onClose, onSuccess }) => {
  const [users, setUsers] = useState<UserOption[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    userId: '',
    type: 'retribution',
    amount: '',
    description: '',
  });

  useEffect(() => {
    if (!open) return;
    setForm({ userId: '', type: 'retribution', amount: '', description: '' });

    api.get('/users', { params: { role: 'citizen' } })
      .then((r) => {
        const list = Array.isArray(r.data) ? r.data : [];
        setUsers(list.map((u: any) => ({ id: u.id, name: u.name, phone: u.phone })));
      })
      .catch(() => toast.error('Gagal memuat data pengguna'));
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.userId || !form.amount) {
      toast.error('Pengguna dan jumlah wajib diisi');
      return;
    }
    const amount = Number(form.amount);
    if (!Number.isFinite(amount) || amount <= 0) {
      toast.error('Jumlah harus angka positif');
      return;
    }

    setSubmitting(true);
    try {
      await createInvoice({
        userId: form.userId,
        type: form.type,
        amount,
        description: form.description || undefined,
      });
      toast.success('Faktur berhasil dibuat');
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Gagal membuat faktur');
    } finally {
      setSubmitting(false);
    }
  };

  const update = (key: string, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Buat Faktur Baru</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="userId">Pengguna</Label>
            <select
              id="userId"
              value={form.userId}
              onChange={(e) => update('userId', e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="">— Pilih pengguna —</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}{u.phone ? ` (${u.phone})` : ''}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="type">Tipe</Label>
            <select
              id="type"
              value={form.type}
              onChange={(e) => update('type', e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              {TYPE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Jumlah (IDR)</Label>
            <Input
              id="amount"
              type="number"
              step="1000"
              min="1000"
              value={form.amount}
              onChange={(e) => update('amount', e.target.value)}
              placeholder="50000"
              className="tabular-nums"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Deskripsi (opsional)</Label>
            <Input
              id="description"
              value={form.description}
              onChange={(e) => update('description', e.target.value)}
              placeholder="Retribusi bulan Mei 2026"
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Batal</Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Menyimpan...' : 'Buat'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
