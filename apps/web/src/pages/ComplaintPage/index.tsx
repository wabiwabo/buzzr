import React, { useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AlertCircle, MapPin, BarChart3 } from 'lucide-react';
import { PageHeader, PageTransition } from '@/components/common';
import { useComplaintPageStore } from './store';
import { fetchComplaintMapData } from './api';
import { TriageTab } from './tabs/TriageTab';
import { MapTab } from './tabs/MapTab';
import { AnalyticsTab } from './tabs/AnalyticsTab';
import type { ComplaintTab } from './types';

const TABS: { id: ComplaintTab; label: string; icon: React.ElementType }[] = [
  { id: 'triage', label: 'Triage', icon: AlertCircle },
  { id: 'peta', label: 'Peta', icon: MapPin },
  { id: 'analitik', label: 'Analitik', icon: BarChart3 },
];

const ComplaintPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { activeTab, setActiveTab, setMapComplaints, setLoading, dataVersion } = useComplaintPageStore();

  useEffect(() => {
    const tabParam = searchParams.get('tab') as ComplaintTab | null;
    if (tabParam && ['triage', 'peta', 'analitik'].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [searchParams, setActiveTab]);

  const handleTabChange = (tab: ComplaintTab) => {
    setActiveTab(tab);
    setSearchParams({ tab }, { replace: true });
  };

  const loadMapData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchComplaintMapData();
      setMapComplaints(data);
    } catch (err) {
      console.error('Failed to load complaint map data:', err);
    } finally {
      setLoading(false);
    }
  }, [setMapComplaints, setLoading]);

  useEffect(() => {
    loadMapData();
  }, [loadMapData, dataVersion]);

  return (
    <PageTransition>
      <div>
        <PageHeader
          title="Pengaduan"
          description="Kelola dan pantau laporan pengaduan masyarakat"
          breadcrumbs={[{ label: 'Dashboard', path: '/' }, { label: 'Pengaduan' }]}
        />

        <div className="border-b mb-4">
          <div className="flex gap-0" role="tablist" aria-label="Complaint Tabs">
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
          {activeTab === 'triage' && <TriageTab />}
          {activeTab === 'peta' && <MapTab />}
          {activeTab === 'analitik' && <AnalyticsTab />}
        </div>
      </div>
    </PageTransition>
  );
};

export default ComplaintPage;
