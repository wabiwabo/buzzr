// apps/web/src/pages/TpsPage/components/TpsForm.tsx

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { createTps, updateTps } from '../api';
import type { TpsItem } from '../types';

const TYPE_OPTIONS = [
  { value: 'tps', label: 'TPS' },
  { value: 'tps3r', label: 'TPS3R' },
  { value: 'bank_sampah', label: 'Bank Sampah' },
];

interface TpsFormProps {
  open: boolean;
  onClose: () => void;
  tps?: TpsItem | null;
  onSuccess: () => void;
}

export const TpsForm: React.FC<TpsFormProps> = ({ open, onClose, tps, onSuccess }) => {
  const isEdit = !!tps;
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    name: '',
    type: 'tps',
    address: '',
    capacityTons: '',
    latitude: '',
    longitude: '',
    areaId: '',
  });

  useEffect(() => {
    if (tps) {
      setForm({
        name: tps.name,
        type: tps.type,
        address: tps.address || '',
        capacityTons: String(tps.capacity_tons),
        latitude: String(tps.latitude),
        longitude: String(tps.longitude),
        areaId: tps.area_id || '',
      });
    } else {
      setForm({
        name: '',
        type: 'tps',
        address: '',
        capacityTons: '',
        latitude: '',
        longitude: '',
        areaId: '',
      });
    }
  }, [tps, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.name || !form.address || !form.capacityTons || !form.latitude || !form.longitude) {
      toast.error('Semua field wajib diisi');
      return;
    }

    setSubmitting(true);
    try {
      const body = {
        name: form.name,
        type: form.type,
        address: form.address,
        capacityTons: Number(form.capacityTons),
        latitude: Number(form.latitude),
        longitude: Number(form.longitude),
        areaId: form.areaId || undefined,
      };

      if (isEdit) {
        await updateTps(tps!.id, body);
        toast.success('TPS berhasil diperbarui');
      } else {
        await createTps(body as any);
        toast.success('TPS berhasil ditambahkan');
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Gagal menyimpan TPS');
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
          <DialogTitle>{isEdit ? 'Edit TPS' : 'Tambah TPS Baru'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nama</Label>
            <Input
              id="name"
              value={form.name}
              onChange={(e) => update('name', e.target.value)}
              placeholder="TPS Cempaka"
            />
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
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Alamat</Label>
            <Input
              id="address"
              value={form.address}
              onChange={(e) => update('address', e.target.value)}
              placeholder="Jl. Contoh No. 123"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="capacityTons">Kapasitas (ton)</Label>
            <Input
              id="capacityTons"
              type="number"
              step="0.1"
              min="0.1"
              value={form.capacityTons}
              onChange={(e) => update('capacityTons', e.target.value)}
              placeholder="5.0"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="latitude">Latitude</Label>
              <Input
                id="latitude"
                type="number"
                step="any"
                value={form.latitude}
                onChange={(e) => update('latitude', e.target.value)}
                placeholder="-6.2088"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="longitude">Longitude</Label>
              <Input
                id="longitude"
                type="number"
                step="any"
                value={form.longitude}
                onChange={(e) => update('longitude', e.target.value)}
                placeholder="106.8456"
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Batal
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Menyimpan...' : isEdit ? 'Simpan' : 'Tambah'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
