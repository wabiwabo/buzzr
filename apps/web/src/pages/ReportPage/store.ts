import { create } from 'zustand';
import type { ReportTab } from './types';

interface ReportPageState {
  activeTab: ReportTab;
  from: string;
  to: string;
  setActiveTab: (tab: ReportTab) => void;
  setDateRange: (from: string, to: string) => void;
}

const today = () => new Date().toISOString().slice(0, 10);
const daysAgo = (n: number) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
};

export const useReportPageStore = create<ReportPageState>((set) => ({
  activeTab: 'sampah',
  from: daysAgo(30),
  to: today(),
  setActiveTab: (activeTab) => set({ activeTab }),
  setDateRange: (from, to) => set({ from, to }),
}));
