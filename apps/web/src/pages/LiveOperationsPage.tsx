import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PageHeader, PageTransition } from '../components/common';

const LiveOperationsPage: React.FC = () => (
  <PageTransition>
    <div>
      <PageHeader
        title="Live Operations"
        description="Pantau operasional secara real-time"
        breadcrumbs={[{ label: 'Dashboard', path: '/' }, { label: 'Live Operations' }]}
      />
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Real-time Map</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[400px]">
            <p className="text-sm text-muted-foreground">Peta operasional real-time akan ditampilkan di sini</p>
          </div>
        </CardContent>
      </Card>
    </div>
  </PageTransition>
);

export default LiveOperationsPage;
