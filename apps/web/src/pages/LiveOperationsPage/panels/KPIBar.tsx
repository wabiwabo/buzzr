import React from 'react';
import { Truck, Users, Package, AlertTriangle, CheckCircle, Bell } from 'lucide-react';
import { useLiveOpsStore } from '../store';

export const KPIBar: React.FC = () => {
  const { vehicles, kpis, tpsLocations, alerts } = useLiveOpsStore();

  const activeVehicles = vehicles.filter((v) => v.status !== 'offline').length;
  const totalVehicles = vehicles.length;
  const movingVehicles = vehicles.filter((v) => v.status === 'moving').length;
  const nearCapacityTps = tpsLocations.filter((t) => t.fill_percent >= 80).length;
  const unacknowledgedAlerts = alerts.filter((a) => !a.acknowledged).length;

  const metrics = [
    {
      label: 'Kendaraan Aktif',
      value: `${activeVehicles}/${totalVehicles}`,
      icon: Truck,
      color: 'text-emerald-400',
    },
    {
      label: 'Bergerak',
      value: `${movingVehicles}`,
      icon: Truck,
      color: 'text-blue-400',
    },
    {
      label: 'Pengemudi Aktif',
      value: `${kpis?.activeDrivers ?? '-'}`,
      icon: Users,
      color: 'text-sky-400',
    },
    {
      label: 'Sampah Hari Ini',
      value: kpis ? `${(kpis.totalWasteTodayKg / 1000).toFixed(1)} ton` : '-',
      icon: Package,
      color: 'text-amber-400',
    },
    {
      label: 'TPS Hampir Penuh',
      value: `${nearCapacityTps}`,
      icon: AlertTriangle,
      color: nearCapacityTps > 0 ? 'text-red-400' : 'text-emerald-400',
    },
    {
      label: 'Tingkat Retribusi',
      value: kpis ? `${kpis.collectionRate}%` : '-',
      icon: CheckCircle,
      color: 'text-emerald-400',
    },
    {
      label: 'Peringatan',
      value: `${unacknowledgedAlerts}`,
      icon: Bell,
      color: unacknowledgedAlerts > 0 ? 'text-red-400' : 'text-gray-400',
    },
  ];

  return (
    <div className="absolute top-0 left-0 right-0 z-50 bg-gray-900/90 backdrop-blur-sm border-b border-gray-700/50">
      <div className="flex items-center justify-between px-4 h-12">
        {metrics.map((m) => (
          <div key={m.label} className="flex items-center gap-2 px-3">
            <m.icon className={`h-4 w-4 ${m.color}`} />
            <div className="flex flex-col">
              <span className="text-[10px] text-gray-400 leading-tight">{m.label}</span>
              <span className="text-sm font-semibold text-white leading-tight">{m.value}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
