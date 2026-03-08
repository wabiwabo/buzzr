import React from 'react';
import { PageHeader } from '../components/common';

const LiveOperationsPage: React.FC = () => (
  <div>
    <PageHeader
      title="Live Operations"
      description="Pantau operasional secara real-time"
      breadcrumbs={[{ label: 'Dashboard', path: '/' }, { label: 'Live Operations' }]}
    />
  </div>
);

export default LiveOperationsPage;
