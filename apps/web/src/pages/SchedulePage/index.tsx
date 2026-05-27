import React, { useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ClipboardList, CalendarDays, BarChart3 } from 'lucide-react';
import { PageHeader, PageTransition } from '@/components/common';
import { useSchedulePageStore } from './store';
import { fetchTodayAdmin } from './api';
import { ManageTab } from './tabs/ManageTab';
import { TodayTab } from './tabs/TodayTab';
import { AnalyticsTab } from './tabs/AnalyticsTab';
import type { ScheduleTab } from './types';

const TABS: { id: ScheduleTab; label: string; icon: React.ElementType }[] = [
  { id: 'kelola', label: 'Kelola', icon: ClipboardList },
  { id: 'hari-ini', label: 'Hari Ini', icon: CalendarDays },
  { id: 'analitik', label: 'Analitik', icon: BarChart3 },
];

const SchedulePage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { activeTab, setActiveTab, setTodaySchedules, setLoading, dataVersion } = useSchedulePageStore();

  useEffect(() => {
    const tabParam = searchParams.get('tab') as ScheduleTab | null;
    if (tabParam && ['kelola', 'hari-ini', 'analitik'].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [searchParams, setActiveTab]);

  const handleTabChange = (tab: ScheduleTab) => {
    setActiveTab(tab);
    setSearchParams({ tab }, { replace: true });
  };

  const loadToday = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchTodayAdmin();
      setTodaySchedules(data);
    } catch (err) {
      console.error('Failed to load today schedules:', err);
    } finally {
      setLoading(false);
    }
  }, [setTodaySchedules, setLoading]);

  useEffect(() => {
    loadToday();
  }, [loadToday, dataVersion]);

  return (
    <PageTransition>
      <div>
        <PageHeader
          title="Jadwal"
          description="Kelola dan pantau jadwal operasional"
          breadcrumbs={[{ label: 'Dashboard', path: '/' }, { label: 'Jadwal' }]}
        />

        <div className="border-b mb-4">
          <div className="flex gap-0" role="tablist" aria-label="Schedule Tabs">
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
          {activeTab === 'hari-ini' && <TodayTab />}
          {activeTab === 'analitik' && <AnalyticsTab />}
        </div>
      </div>
    </PageTransition>
  );
};

export default SchedulePage;
