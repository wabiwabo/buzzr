export enum UserRole {
  CITIZEN = 'citizen',
  SWEEPER = 'sweeper',
  TPS_OPERATOR = 'tps_operator',
  COLLECTOR = 'collector',
  DRIVER = 'driver',
  TPST_OPERATOR = 'tpst_operator',
  DLH_ADMIN = 'dlh_admin',
  SUPER_ADMIN = 'super_admin',
}

export const OTP_ROLES = [UserRole.CITIZEN, UserRole.COLLECTOR] as const;
export const PASSWORD_ROLES = [
  UserRole.SWEEPER,
  UserRole.TPS_OPERATOR,
  UserRole.DRIVER,
  UserRole.TPST_OPERATOR,
  UserRole.DLH_ADMIN,
  UserRole.SUPER_ADMIN,
] as const;
