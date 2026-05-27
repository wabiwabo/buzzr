import React, { useState, useEffect } from 'react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { createVehicle, updateVehicle } from '../api';
import { VEHICLE_TYPE_OPTIONS } from '../types';

interface VehicleFormData {
  id: string;
  plate_number: string;
  type: string;
  capacity_tons: number;
  is_active: boolean;
}

interface FleetFormProps {
  open: boolean;
  onClose: () => void;
  vehicle?: VehicleFormData | null;
  onSuccess: () => void;
}

export const FleetForm: React.FC<FleetFormProps> = ({ open, onClose, vehicle, onSuccess }) => {
  const isEdit = !!vehicle;
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    plateNumber: '',
    type: 'truck',
    capacityTons: '',
    isActive: true,
  });

  useEffect(() => {
    if (vehicle) {
      setForm({
        plateNumber: vehicle.plate_number,
        type: vehicle.type,
        capacityTons: String(vehicle.capacity_tons),
        isActive: vehicle.is_active,
      });
    } else {
      setForm({ plateNumber: '', type: 'truck', capacityTons: '', isActive: true });
    }
  }, [vehicle, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.plateNumber || !form.capacityTons) {
      toast.error('Plat nomor dan kapasitas wajib diisi');
      return;
    }

    setSubmitting(true);
    try {
      const body = {
        plateNumber: form.plateNumber,
        type: form.type,
        capacityTons: Number(form.capacityTons),
      };

      if (isEdit) {
        await updateVehicle(vehicle!.id, { ...body, isActive: form.isActive });
        toast.success('Kendaraan berhasil diperbarui');
      } else {
        await createVehicle(body);
        toast.success('Kendaraan berhasil ditambahkan');
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Gagal menyimpan kendaraan');
    } finally {
      setSubmitting(false);
    }
  };

  const update = (key: string, value: string | boolean) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Kendaraan' : 'Tambah Kendaraan Baru'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="plateNumber">Plat Nomor</Label>
            <Input
              id="plateNumber"
              value={form.plateNumber}
              onChange={(e) => update('plateNumber', e.target.value)}
              placeholder="B 1234 XYZ"
              className="font-mono"
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
              {VEHICLE_TYPE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
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
              placeholder="2.0"
            />
          </div>

          {isEdit && (
            <div className="flex items-center gap-2">
              <input
                id="isActive"
                type="checkbox"
                checked={form.isActive}
                onChange={(e) => update('isActive', e.target.checked)}
                className="h-4 w-4 rounded border-input"
              />
              <Label htmlFor="isActive" className="cursor-pointer">Aktif</Label>
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Batal</Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Menyimpan...' : isEdit ? 'Simpan' : 'Tambah'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
