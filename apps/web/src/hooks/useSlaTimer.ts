import { useState, useEffect, useCallback } from 'react';

export type SlaPhase = 'normal' | 'warning' | 'critical' | 'breached';

interface SlaState {
  remaining: number; // milliseconds (negative = breached)
  phase: SlaPhase;
  label: string;
}

function formatDuration(ms: number): string {
  const abs = Math.abs(ms);
  const hours = Math.floor(abs / 3_600_000);
  const minutes = Math.floor((abs % 3_600_000) / 60_000);
  const prefix = ms < 0 ? '-' : '';
  if (hours > 0) return `${prefix}${hours}j ${minutes}m`;
  return `${prefix}${minutes}m`;
}

function getPhase(remaining: number): SlaPhase {
  if (remaining <= 0) return 'breached';
  if (remaining <= 3_600_000) return 'critical'; // <1h
  if (remaining <= 14_400_000) return 'warning'; // <4h
  return 'normal';
}

export function useSlaTimer(deadline: string | Date | null, slaHours = 72): SlaState {
  const calcRemaining = useCallback(() => {
    if (!deadline) return slaHours * 3_600_000;
    const deadlineMs = new Date(deadline).getTime() + slaHours * 3_600_000;
    return deadlineMs - Date.now();
  }, [deadline, slaHours]);

  const [remaining, setRemaining] = useState(calcRemaining);

  useEffect(() => {
    setRemaining(calcRemaining());
    const interval = setInterval(() => setRemaining(calcRemaining()), 60_000);
    return () => clearInterval(interval);
  }, [calcRemaining]);

  const phase = getPhase(remaining);
  const label = formatDuration(remaining);

  return { remaining, phase, label };
}
