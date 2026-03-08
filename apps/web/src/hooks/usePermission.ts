import { useAuthStore } from '../stores/auth.store';

const PERMISSIONS: Record<string, string[]> = {
  super_admin: [
    'tenant:manage', 'user:create', 'user:edit', 'user:delete',
    'tps:create', 'tps:edit', 'tps:delete', 'tps:record_waste',
    'complaint:assign', 'complaint:resolve', 'complaint:reject',
    'schedule:create', 'schedule:edit', 'schedule:delete',
    'fleet:create', 'fleet:edit', 'fleet:assign_driver',
    'payment:create', 'payment:view_all',
    'report:view', 'analytics:view',
    'area:create', 'area:edit',
    'audit:view', 'settings:manage',
  ],
  dlh_admin: [
    'user:create', 'user:edit',
    'tps:create', 'tps:edit', 'tps:record_waste',
    'complaint:assign', 'complaint:resolve', 'complaint:reject',
    'schedule:create', 'schedule:edit',
    'fleet:create', 'fleet:edit', 'fleet:assign_driver',
    'payment:create', 'payment:view_all',
    'report:view', 'analytics:view',
    'area:create', 'area:edit',
  ],
  tps_operator: [
    'tps:record_waste', 'tps:view',
    'schedule:view',
  ],
  driver: [
    'schedule:update_status', 'schedule:view',
    'transfer:create', 'transfer:view',
    'fleet:view_own',
  ],
  sweeper: [
    'complaint:update_status', 'tps:record_waste',
  ],
  tpst_operator: [
    'transfer:verify', 'transfer:view',
    'schedule:view',
  ],
  collector: [],
  citizen: [],
};

export function usePermission() {
  const { user } = useAuthStore();
  const role = user?.role || '';
  const perms = PERMISSIONS[role] || [];

  const can = (permission: string): boolean => perms.includes(permission);

  const canAny = (...permissions: string[]): boolean =>
    permissions.some((p) => perms.includes(p));

  const isExecutive = ['dlh_admin', 'super_admin'].includes(role);
  const isSuperAdmin = role === 'super_admin';

  return { can, canAny, isExecutive, isSuperAdmin, role };
}
