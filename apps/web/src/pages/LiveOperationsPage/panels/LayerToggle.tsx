import React from 'react';
import { Truck, MapPin, Route, Thermometer, Map, AlertTriangle } from 'lucide-react';
import { useLiveOpsStore } from '../store';
import type { MapLayer } from '../types';

const layers: { id: MapLayer; label: string; icon: React.ElementType }[] = [
  { id: 'vehicles', label: 'Kendaraan', icon: Truck },
  { id: 'tps', label: 'TPS', icon: MapPin },
  { id: 'routes', label: 'Rute', icon: Route },
  { id: 'heatmap', label: 'Heatmap', icon: Thermometer },
  { id: 'areas', label: 'Wilayah', icon: Map },
  { id: 'complaints', label: 'Pengaduan', icon: AlertTriangle },
];

export const LayerToggle: React.FC = () => {
  const { activeLayers, toggleLayer } = useLiveOpsStore();

  return (
    <div className="absolute top-16 right-2 z-40 bg-white rounded-lg shadow-lg overflow-hidden">
      {layers.map((layer) => {
        const isActive = activeLayers.has(layer.id);
        return (
          <button
            key={layer.id}
            onClick={() => toggleLayer(layer.id)}
            className={`flex items-center justify-center w-9 h-9 transition-colors ${
              isActive ? 'bg-blue-50 text-blue-600' : 'text-gray-400 hover:bg-gray-50'
            }`}
            title={layer.label}
          >
            <layer.icon className="h-4 w-4" />
          </button>
        );
      })}
    </div>
  );
};
