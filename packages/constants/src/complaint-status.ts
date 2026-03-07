import { ComplaintStatus } from '@buzzr/shared-types';

export const COMPLAINT_STATUS_LABELS: Record<ComplaintStatus, string> = {
  [ComplaintStatus.SUBMITTED]: 'Dilaporkan',
  [ComplaintStatus.VERIFIED]: 'Diverifikasi',
  [ComplaintStatus.ASSIGNED]: 'Ditugaskan',
  [ComplaintStatus.IN_PROGRESS]: 'Dalam Proses',
  [ComplaintStatus.RESOLVED]: 'Selesai',
  [ComplaintStatus.REJECTED]: 'Ditolak',
};
