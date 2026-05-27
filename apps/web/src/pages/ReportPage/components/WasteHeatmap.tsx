import React, { useEffect } from 'react';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.heat';
import type { HeatmapPoint } from '../types';

const DEFAULT_CENTER: [number, number] = [-6.2088, 106.8456];
const DEFAULT_ZOOM = 11;

function HeatLayer({ points }: { points: HeatmapPoint[] }) {
  const map = useMap();

  useEffect(() => {
    const valid = points.filter((p) => Number.isFinite(p.latitude) && Number.isFinite(p.longitude));
    if (valid.length === 0) return;

    const maxKg = Math.max(...valid.map((p) => p.total_kg)) || 1;
    const heatData: [number, number, number][] = valid.map((p) => [
      p.latitude,
      p.longitude,
      // normalize intensity to 0..1
      Math.min(1, p.total_kg / maxKg),
    ]);

    // @ts-expect-error leaflet.heat extends L at runtime; no bundled types
    const layer = L.heatLayer(heatData, {
      radius: 25,
      blur: 18,
      maxZoom: 14,
      gradient: { 0.2: '#3B82F6', 0.4: '#22C55E', 0.6: '#EAB308', 0.8: '#F59E0B', 1.0: '#EF4444' },
    }).addTo(map);

    // Fit bounds to data
    const bounds = L.latLngBounds(valid.map((p) => [p.latitude, p.longitude] as [number, number]));
    if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
    }

    return () => {
      map.removeLayer(layer);
    };
  }, [map, points]);

  return null;
}

interface WasteHeatmapProps {
  points: HeatmapPoint[];
  height?: string;
}

export const WasteHeatmap: React.FC<WasteHeatmapProps> = ({ points, height = '400px' }) => {
  return (
    <MapContainer
      center={DEFAULT_CENTER}
      zoom={DEFAULT_ZOOM}
      style={{ height, width: '100%' }}
      scrollWheelZoom={false}
    >
      <TileLayer
        attribution='&copy; <a href="https://carto.com">CARTO</a>'
        url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
      />
      <HeatLayer points={points} />
    </MapContainer>
  );
};
