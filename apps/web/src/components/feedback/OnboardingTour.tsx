import React from 'react';
import { Tour } from 'antd';
import type { TourProps } from 'antd';

interface OnboardingTourProps {
  open: boolean;
  onClose: () => void;
  refs: {
    sidebar?: React.RefObject<HTMLElement>;
    dashboard?: React.RefObject<HTMLElement>;
    notificationBell?: React.RefObject<HTMLElement>;
  };
}

export const OnboardingTour: React.FC<OnboardingTourProps> = ({ open, onClose, refs }) => {
  const steps: TourProps['steps'] = [
    {
      title: 'Selamat Datang di Buzzr!',
      description: 'Buzzr membantu Anda mengelola operasional persampahan. Mari kami tunjukkan fitur utamanya dalam 1 menit.',
      target: null,
    },
    {
      title: 'Menu Navigasi',
      description: 'Akses semua fitur dari sidebar: TPS, Armada, Jadwal, Laporan Warga, dan lainnya. Tekan "/" untuk pencarian cepat.',
      target: refs.sidebar?.current || null,
    },
    {
      title: 'Dashboard',
      description: 'Pantau semua operasional dari satu layar: status TPS, driver aktif, dan complaint yang butuh perhatian.',
      target: refs.dashboard?.current || null,
    },
    {
      title: 'Notifikasi',
      description: 'Notifikasi real-time untuk complaint baru, TPS penuh, dan pembayaran jatuh tempo.',
      target: refs.notificationBell?.current || null,
    },
    {
      title: 'Siap!',
      description: 'Anda bisa mengulang tour ini kapan saja dari menu Bantuan di sidebar. Selamat bekerja!',
      target: null,
    },
  ];

  return (
    <Tour
      open={open}
      onClose={onClose}
      steps={steps}
      type="primary"
    />
  );
};
