import { PaymentStatus } from '@buzzr/shared-types';

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  [PaymentStatus.PENDING]: 'Menunggu Pembayaran',
  [PaymentStatus.PAID]: 'Lunas',
  [PaymentStatus.FAILED]: 'Gagal',
  [PaymentStatus.EXPIRED]: 'Kadaluarsa',
  [PaymentStatus.REFUNDED]: 'Dikembalikan',
};
