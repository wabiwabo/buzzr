import React, { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Trash2, Truck, AlertCircle, Wallet, Activity } from 'lucide-react';
import dayjs from 'dayjs';
import { PageHeader, PageTransition } from '@/components/common';
import { Input } from '@/components/ui/input';
import { useReportPageStore } from './store';
import { WasteTab } from './tabs/WasteTab';
import { DriverTab } from './tabs/DriverTab';
import { ComplaintTab } from './tabs/ComplaintTab';
import { PaymentTab } from './tabs/PaymentTab';
import { ActivityTab } from './tabs/ActivityTab';
import type { ReportTab } from './types';

const TABS: { id: ReportTab; label: string; icon: React.ElementType }[] = [
  { id: 'sampah', label: 'Sampah', icon: Trash2 },
  { id: 'driver', label: 'Driver', icon: Truck },
  { id: 'pengaduan', label: 'Pengaduan', icon: AlertCircle },
  { id: 'pembayaran', label: 'Pembayaran', icon: Wallet },
  { id: 'aktivitas', label: 'Aktivitas', icon: Activity },
];

const ReportPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { activeTab, setActiveTab, from, to, setDateRange } = useReportPageStore();

  useEffect(() => {
    const tabParam = searchParams.get('tab') as ReportTab | null;
    if (tabParam && TABS.some((t) => t.id === tabParam)) {
      setActiveTab(tabParam);
    }
  }, [searchParams, setActiveTab]);

  const handleTabChange = (tab: ReportTab) => {
    setActiveTab(tab);
    setSearchParams({ tab }, { replace: true });
  };

  // Activity tab has no date range; hide the range picker for it
  const showDateRange = activeTab !== 'aktivitas';

  return (
    <PageTransition>
      <div>
        <PageHeader
          title="Laporan & Analitik"
          description="Pantau performa operasional persampahan"
          breadcrumbs={[{ label: 'Dashboard', path: '/' }, { label: 'Laporan' }]}
          extra={
            showDateRange ? (
              <div className="flex items-center gap-2">
                <Input
                  type="date"
                  className="h-8 w-40 text-sm"
                  value={from}
                  max={to}
                  onChange={(e) => setDateRange(e.target.value, to)}
                />
                <span className="text-sm text-muted-foreground">—</span>
                <Input
                  type="date"
                  className="h-8 w-40 text-sm"
                  value={to}
                  min={from}
                  max={dayjs().format('YYYY-MM-DD')}
                  onChange={(e) => setDateRange(from, e.target.value)}
                />
              </div>
            ) : undefined
          }
        />

        <div className="border-b mb-4">
          <div className="flex gap-0 overflow-x-auto" role="tablist" aria-label="Report Tabs">
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
                  className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
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
          {activeTab === 'sampah' && <WasteTab />}
          {activeTab === 'driver' && <DriverTab />}
          {activeTab === 'pengaduan' && <ComplaintTab />}
          {activeTab === 'pembayaran' && <PaymentTab />}
          {activeTab === 'aktivitas' && <ActivityTab />}
        </div>
      </div>
    </PageTransition>
  );
};

export default ReportPage;
