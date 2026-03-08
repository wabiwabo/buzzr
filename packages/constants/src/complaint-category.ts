import { ComplaintCategory } from '@buzzr/shared-types';

export const COMPLAINT_CATEGORY_LABELS: Record<ComplaintCategory, string> = {
  [ComplaintCategory.ILLEGAL_DUMPING]: 'Sampah Liar',
  [ComplaintCategory.TPS_FULL]: 'TPS Penuh',
  [ComplaintCategory.MISSED_PICKUP]: 'Tidak Diangkut',
  [ComplaintCategory.OTHER]: 'Lainnya',
};
