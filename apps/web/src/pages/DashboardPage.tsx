import React from 'react';
import { usePermission } from '../hooks/usePermission';
import { ExecutiveDashboard, OperationalDashboard } from '../components/dashboard';

const DashboardPage: React.FC = () => {
  const { isExecutive, role } = usePermission();

  return isExecutive
    ? <ExecutiveDashboard />
    : <OperationalDashboard role={role} />;
};

export default DashboardPage;
