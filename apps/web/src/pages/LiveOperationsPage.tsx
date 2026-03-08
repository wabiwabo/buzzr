import React from 'react';
import { PageHeader, PageTransition } from '../components/common';

const LiveOperationsPage: React.FC = () => (
  <PageTransition>
    <div>
      <PageHeader
        title="Live Operations"
        description="Pantau operasional secara real-time"
        breadcrumbs={[{ label: 'Dashboard', path: '/' }, { label: 'Live Operations' }]}
      />
    </div>
  </PageTransition>
);

export default LiveOperationsPage;
