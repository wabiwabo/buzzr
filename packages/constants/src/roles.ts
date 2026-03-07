import { UserRole } from '@buzzr/shared-types';

export const ROLE_LABELS: Record<UserRole, string> = {
  [UserRole.CITIZEN]: 'Masyarakat',
  [UserRole.SWEEPER]: 'Petugas Kebersihan',
  [UserRole.TPS_OPERATOR]: 'Operator TPS / Bank Sampah',
  [UserRole.COLLECTOR]: 'Pemulung / Pengepul',
  [UserRole.DRIVER]: 'Driver Truk',
  [UserRole.TPST_OPERATOR]: 'Operator TPST',
  [UserRole.DLH_ADMIN]: 'Admin DLH',
  [UserRole.SUPER_ADMIN]: 'Super Admin',
};
