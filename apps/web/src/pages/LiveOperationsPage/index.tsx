import React from 'react';
import { LiveMap } from './map/LiveMap';
import { KPIBar } from './panels/KPIBar';
import { VehiclePanel } from './panels/VehiclePanel';
import { VehicleDetail } from './panels/VehicleDetail';
import { AlertFeed } from './panels/AlertFeed';
import { LayerToggle } from './panels/LayerToggle';
import { RouteTimeline } from './panels/RouteTimeline';
import { useLiveData } from './hooks';
import { useLiveOpsStore } from './store';

const LiveOperationsPage: React.FC = () => {
  useLiveData();
  const { selectedVehicleId } = useLiveOpsStore();

  return (
    <div className="relative w-full h-[calc(100vh-64px)] overflow-hidden">
      {/* Full-screen map */}
      <LiveMap className="absolute inset-0" />

      {/* Floating panels */}
      <KPIBar />
      <VehiclePanel />
      {selectedVehicleId && <VehicleDetail />}
      <LayerToggle />
      <AlertFeed />
      <RouteTimeline />
    </div>
  );
};

export default LiveOperationsPage;
