import React, { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ClipboardList, BarChart3 } from 'lucide-react';
import { PageHeader, PageTransition } from '@/components/common';
import { usePaymentPageStore } from './store';
import { ManageTab } from './tabs/ManageTab';
import { AnalyticsTab } from './tabs/AnalyticsTab';
import type { PaymentTab } from './types';

const TABS: { id: PaymentTab; label: string; icon: React.ElementType }[] = [
  { id: 'kelola', label: 'Kelola', icon: ClipboardList },
  { id: 'analitik', label: 'Analitik', icon: BarChart3 },
];

const PaymentPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { activeTab, setActiveTab } = usePaymentPageStore();

  useEffect(() => {
    const tabParam = searchParams.get('tab') as PaymentTab | null;
    if (tabParam && ['kelola', 'analitik'].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [searchParams, setActiveTab]);

  const handleTabChange = (tab: PaymentTab) => {
    setActiveTab(tab);
    setSearchParams({ tab }, { replace: true });
  };

  return (
    <PageTransition>
      <div>
        <PageHeader
          title="Pembayaran"
          description="Kelola dan pantau transaksi pembayaran retribusi"
          breadcrumbs={[{ label: 'Dashboard', path: '/' }, { label: 'Pembayaran' }]}
        />

        <div className="border-b mb-4">
          <div className="flex gap-0" role="tablist" aria-label="Payment Tabs">
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
          {activeTab === 'analitik' && <AnalyticsTab />}
        </div>
      </div>
    </PageTransition>
  );
};

export default PaymentPage;
