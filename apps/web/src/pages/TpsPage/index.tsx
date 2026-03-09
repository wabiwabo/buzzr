// apps/web/src/pages/TpsPage/index.tsx

import React, { useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Map, ClipboardList, BarChart3 } from 'lucide-react';
import { PageHeader, PageTransition } from '@/components/common';
import { useTpsPageStore } from './store';
import { fetchTpsMapData } from './api';
import { MapTab } from './tabs/MapTab';
import { ManageTab } from './tabs/ManageTab';
import { AnalyticsTab } from './tabs/AnalyticsTab';
import type { TpsTab } from './types';

const TABS: { id: TpsTab; label: string; icon: React.ElementType }[] = [
  { id: 'peta', label: 'Peta', icon: Map },
  { id: 'kelola', label: 'Kelola', icon: ClipboardList },
  { id: 'analitik', label: 'Analitik', icon: BarChart3 },
];

const TpsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { activeTab, setActiveTab, setAllTps, setLoading, dataVersion } = useTpsPageStore();

  // Sync tab from URL
  useEffect(() => {
    const tabParam = searchParams.get('tab') as TpsTab | null;
    if (tabParam && ['peta', 'kelola', 'analitik'].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [searchParams, setActiveTab]);

  const handleTabChange = (tab: TpsTab) => {
    setActiveTab(tab);
    setSearchParams({ tab }, { replace: true });
  };

  // Load map data (used by Map and Analytics tabs)
  const loadMapData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchTpsMapData();
      setAllTps(data);
    } catch (err) {
      console.error('Failed to load TPS map data:', err);
    } finally {
      setLoading(false);
    }
  }, [setAllTps, setLoading]);

  useEffect(() => {
    loadMapData();
  }, [loadMapData, dataVersion]);

  return (
    <PageTransition>
      <div>
        <PageHeader
          title="Tempat Penampungan Sementara"
          description="Kelola dan pantau titik pengumpulan sampah"
          breadcrumbs={[{ label: 'Dashboard', path: '/' }, { label: 'TPS' }]}
        />

        {/* Tabs */}
        <div className="border-b mb-4">
          <div className="flex gap-0" role="tablist" aria-label="TPS Tabs">
            {TABS.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  role="tab"
                  aria-selected={isActive}
                  aria-controls={`tabpanel-${tab.id}`}
                  id={`tab-${tab.id}`}
                  onClick={() => handleTabChange(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                    isActive
                      ? 'border-primary text-primary'
                      : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
                  }`}
                >
                  <tab.icon className="h-4 w-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab content */}
        <div role="tabpanel" id={`tabpanel-${activeTab}`} aria-labelledby={`tab-${activeTab}`}>
          {activeTab === 'peta' && <MapTab />}
          {activeTab === 'kelola' && <ManageTab />}
          {activeTab === 'analitik' && <AnalyticsTab />}
        </div>
      </div>
    </PageTransition>
  );
};

export default TpsPage;
