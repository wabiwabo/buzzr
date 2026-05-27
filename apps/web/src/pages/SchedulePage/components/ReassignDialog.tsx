import React, { useState, useEffect } from 'react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import api from '@/services/api';
import { reassignSchedule } from '../api';

interface DriverOption {
  id: string;
  name: string;
}
interface VehicleOption {
  id: string;
  plate_number: string;
}

interface ReassignDialogProps {
  open: boolean;
  scheduleId: string | null;
  currentDriverId: string | null;
  currentVehicleId: string | null;
  onClose: () => void;
  onSuccess: () => void;
}

export const ReassignDialog: React.FC<ReassignDialogProps> = ({
  open, scheduleId, currentDriverId, currentVehicleId, onClose, onSuccess,
}) => {
  const [drivers, setDrivers] = useState<DriverOption[]>([]);
  const [vehicles, setVehicles] = useState<VehicleOption[]>([]);
  const [driverId, setDriverId] = useState<string>('');
  const [vehicleId, setVehicleId] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    setDriverId(currentDriverId || '');
    setVehicleId(currentVehicleId || '');

    // Load options
    Promise.all([
      api.get('/users', { params: { role: 'driver' } }).then((r) => Array.isArray(r.data) ? r.data : []),
      api.get('/fleet').then((r) => Array.isArray(r.data) ? r.data : []),
    ])
      .then(([drv, veh]) => {
        setDrivers(drv.map((u: any) => ({ id: u.id, name: u.name })));
        setVehicles(veh.map((v: any) => ({ id: v.id, plate_number: v.plate_number })));
      })
      .catch(() => {
        toast.error('Gagal memuat data driver/kendaraan');
      });
  }, [open, currentDriverId, currentVehicleId]);

  const handleSubmit = async () => {
    if (!scheduleId) return;
    if (driverId === (currentDriverId || '') && vehicleId === (currentVehicleId || '')) {
      toast.info('Tidak ada perubahan');
      return;
    }
    setSubmitting(true);
    try {
      const body: { driverId?: string; vehicleId?: string } = {};
      if (driverId !== (currentDriverId || '')) body.driverId = driverId;
      if (vehicleId !== (currentVehicleId || '')) body.vehicleId = vehicleId;
      await reassignSchedule(scheduleId, body);
      toast.success('Jadwal berhasil ditugaskan ulang');
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Gagal menugaskan ulang');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Tugaskan Ulang Jadwal</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="driver">Pengemudi</Label>
            <select
              id="driver"
              value={driverId}
              onChange={(e) => setDriverId(e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="">— Tidak ditugaskan —</option>
              {drivers.map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="vehicle">Kendaraan</Label>
            <select
              id="vehicle"
              value={vehicleId}
              onChange={(e) => setVehicleId(e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="">— Tidak ditugaskan —</option>
              {vehicles.map((v) => (
                <option key={v.id} value={v.id}>{v.plate_number}</option>
              ))}
            </select>
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>Batal</Button>
          <Button type="button" onClick={handleSubmit} disabled={submitting}>
            {submitting ? 'Menyimpan...' : 'Simpan'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
