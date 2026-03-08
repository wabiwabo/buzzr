import { useState, useEffect } from 'react';
import type { ChecklistItem } from '../components/onboarding/ProgressChecklist';

const STORAGE_KEY = 'buzzr_checklist';
const DISMISSED_KEY = 'buzzr_checklist_dismissed';

interface UseChecklistReturn {
  items: ChecklistItem[];
  dismissed: boolean;
  markComplete: (key: string) => void;
  dismiss: () => void;
  reset: () => void;
}

const DEFAULT_ITEMS: Omit<ChecklistItem, 'completed'>[] = [
  { key: 'view_dashboard', label: 'Lihat Dashboard', description: 'Kunjungi halaman utama', path: '/' },
  { key: 'view_tps', label: 'Lihat Data TPS', description: 'Cek daftar TPS', path: '/tps' },
  { key: 'view_complaints', label: 'Lihat Laporan Warga', description: 'Pantau keluhan masuk', path: '/complaints' },
  { key: 'view_fleet', label: 'Lihat Armada', description: 'Cek kendaraan dan driver', path: '/fleet' },
  { key: 'view_schedules', label: 'Lihat Jadwal', description: 'Pantau jadwal pengangkutan', path: '/schedules' },
  { key: 'view_analytics', label: 'Buka Analytics', description: 'Jelajahi laporan analisis', path: '/analytics' },
];

export function useChecklist(): UseChecklistReturn {
  const [completed, setCompleted] = useState<Set<string>>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? new Set(JSON.parse(stored)) : new Set();
    } catch {
      return new Set();
    }
  });

  const [dismissed, setDismissed] = useState(() => {
    return localStorage.getItem(DISMISSED_KEY) === 'true';
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...completed]));
  }, [completed]);

  const items: ChecklistItem[] = DEFAULT_ITEMS.map((item) => ({
    ...item,
    completed: completed.has(item.key),
  }));

  const markComplete = (key: string) => {
    setCompleted((prev) => new Set([...prev, key]));
  };

  const dismiss = () => {
    setDismissed(true);
    localStorage.setItem(DISMISSED_KEY, 'true');
  };

  const reset = () => {
    setCompleted(new Set());
    setDismissed(false);
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(DISMISSED_KEY);
  };

  return { items, dismissed, markComplete, dismiss, reset };
}
