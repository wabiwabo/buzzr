import React, { useState } from 'react';
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface OnboardingTourProps {
  open: boolean;
  onClose: () => void;
  refs: {
    sidebar?: React.RefObject<HTMLElement>;
    dashboard?: React.RefObject<HTMLElement>;
    notificationBell?: React.RefObject<HTMLElement>;
  };
}

const steps = [
  {
    title: 'Selamat Datang di Buzzr!',
    description: 'Buzzr membantu Anda mengelola operasional persampahan. Mari kami tunjukkan fitur utamanya dalam 1 menit.',
  },
  {
    title: 'Menu Navigasi',
    description: 'Akses semua fitur dari sidebar: TPS, Armada, Jadwal, Laporan Warga, dan lainnya. Tekan "/" untuk pencarian cepat.',
  },
  {
    title: 'Dashboard',
    description: 'Pantau semua operasional dari satu layar: status TPS, driver aktif, dan complaint yang butuh perhatian.',
  },
  {
    title: 'Notifikasi',
    description: 'Notifikasi real-time untuk complaint baru, TPS penuh, dan pembayaran jatuh tempo.',
  },
  {
    title: 'Siap!',
    description: 'Anda bisa mengulang tour ini kapan saja dari menu Bantuan di sidebar. Selamat bekerja!',
  },
];

export const OnboardingTour: React.FC<OnboardingTourProps> = ({ open, onClose }) => {
  const [step, setStep] = useState(0);
  const current = steps[step];
  const isLast = step === steps.length - 1;

  const handleNext = () => {
    if (isLast) {
      setStep(0);
      onClose();
    } else {
      setStep(step + 1);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) { setStep(0); onClose(); } }}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>{current.title}</DialogTitle>
          <DialogDescription>{current.description}</DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex-row justify-between items-center">
          <span className="text-xs text-muted-foreground">{step + 1} / {steps.length}</span>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={() => { setStep(0); onClose(); }}>
              Lewati
            </Button>
            <Button size="sm" onClick={handleNext}>
              {isLast ? 'Selesai' : 'Lanjut'}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
