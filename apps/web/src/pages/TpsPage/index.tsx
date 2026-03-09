// apps/web/src/pages/TpsPage/index.tsx

import React from 'react';
import { PageHeader, PageTransition } from '@/components/common';

const TpsPage: React.FC = () => {
  return (
    <PageTransition>
      <div>
        <PageHeader
          title="Tempat Penampungan Sementara"
          description="Kelola titik pengumpulan sampah"
          breadcrumbs={[{ label: 'Dashboard', path: '/' }, { label: 'TPS' }]}
        />
        <p className="text-muted-foreground p-4">Tabs coming soon...</p>
      </div>
    </PageTransition>
  );
};

export default TpsPage;
