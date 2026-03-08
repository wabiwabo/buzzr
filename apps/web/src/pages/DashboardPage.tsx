import React from 'react';
import { usePermission } from '../hooks/usePermission';
import { ExecutiveDashboard, OperationalDashboard } from '../components/dashboard';
import { PageTransition } from '../components/common';

const DashboardPage: React.FC = () => {
  const { isExecutive, role } = usePermission();

  return (
    <PageTransition>
      {isExecutive
        ? <ExecutiveDashboard />
        : <OperationalDashboard role={role} />}
    </PageTransition>
  );
};

export default DashboardPage;
