import React, { useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ClipboardList, Map, BarChart3 } from 'lucide-react';
import { PageHeader, PageTransition } from '@/components/common';
import { useFleetPageStore } from './store';
import { fetchFleetPositions } from './api';
import { ManageTab } from './tabs/ManageTab';
import { MapTab } from './tabs/MapTab';
import { AnalyticsTab } from './tabs/AnalyticsTab';
import type { FleetTab } from './types';

const TABS: { id: FleetTab; label: string; icon: React.ElementType }[] = [
  { id: 'kelola', label: 'Kelola', icon: ClipboardList },
  { id: 'peta', label: 'Peta', icon: Map },
  { id: 'analitik', label: 'Analitik', icon: BarChart3 },
];

const FleetPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { activeTab, setActiveTab, setPositions, setLoading, dataVersion } = useFleetPageStore();

  useEffect(() => {
    const tabParam = searchParams.get('tab') as FleetTab | null;
    if (tabParam && ['kelola', 'peta', 'analitik'].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [searchParams, setActiveTab]);

  const handleTabChange = (tab: FleetTab) => {
    setActiveTab(tab);
    setSearchParams({ tab }, { replace: true });
  };

  const loadPositions = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchFleetPositions();
      setPositions(data);
    } catch (err) {
      console.error('Failed to load fleet positions:', err);
    } finally {
      setLoading(false);
    }
  }, [setPositions, setLoading]);

  useEffect(() => {
    loadPositions();
  }, [loadPositions, dataVersion]);

  return (
    <PageTransition>
      <div>
        <PageHeader
          title="Armada"
          description="Kelola dan pantau kendaraan operasional"
          breadcrumbs={[{ label: 'Dashboard', path: '/' }, { label: 'Armada' }]}
        />

        <div className="border-b mb-4">
          <div className="flex gap-0" role="tablist" aria-label="Fleet Tabs">
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

        <div role="tabpanel" id={`tabpanel-${activeTab}`} aria-labelledby={`tab-${activeTab}`}>
          {activeTab === 'kelola' && <ManageTab />}
          {activeTab === 'peta' && <MapTab />}
          {activeTab === 'analitik' && <AnalyticsTab />}
        </div>
      </div>
    </PageTransition>
  );
};

export default FleetPage;
