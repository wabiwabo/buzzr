import React from 'react';
import { PageHeader } from '../components/common';

const AnalyticsPage: React.FC = () => (
  <div>
    <PageHeader
      title="Analytics"
      description="Laporan dan analitik operasional"
      breadcrumbs={[{ label: 'Dashboard', path: '/' }, { label: 'Analytics' }]}
    />
  </div>
);

export default AnalyticsPage;
