// apps/web/src/pages/TpsPage/components/TpsMap.tsx

import React, { useMemo } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet';
import type { LatLngBounds } from 'leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { TpsItem } from '../types';
import { CapacityBar } from './CapacityBar';

const DEFAULT_CENTER: [number, number] = [-6.2088, 106.8456]; // Jakarta
const DEFAULT_ZOOM = 12;

const TYPE_LABELS: Record<string, string> = {
  tps: 'TPS',
  tps3r: 'TPS3R',
  bank_sampah: 'Bank Sampah',
};

const STATUS_LABELS: Record<string, string> = {
  active: 'Aktif',
  full: 'Penuh',
  maintenance: 'Pemeliharaan',
};

function fillColor(pct: number, status: string): string {
  if (status === 'maintenance') return '#9CA3AF';
  if (pct >= 90) return '#EF4444';
  if (pct >= 70) return '#F59E0B';
  return '#22C55E';
}

function FitBounds({ data }: { data: TpsItem[] }) {
  const map = useMap();

  React.useEffect(() => {
    const valid = data.filter((t) => t.latitude && t.longitude);
    if (valid.length === 0) return;
    const bounds: LatLngBounds = L.latLngBounds(
      valid.map((t) => [t.latitude, t.longitude]),
    );
    map.fitBounds(bounds, { padding: [40, 40], maxZoom: 15 });
  }, [map, data]);

  return null;
}

function SingleMarker({ tps }: { tps: TpsItem }) {
  const map = useMap();

  React.useEffect(() => {
    if (tps.latitude && tps.longitude) {
      map.setView([tps.latitude, tps.longitude], 15, { animate: false });
    }
  }, [map, tps.latitude, tps.longitude]);

  return (
    <CircleMarker
      center={[tps.latitude, tps.longitude]}
      radius={8}
      pathOptions={{
        color: fillColor(tps.fill_percent, tps.status),
        fillColor: fillColor(tps.fill_percent, tps.status),
        fillOpacity: 0.8,
        weight: 2,
      }}
    />
  );
}

interface TpsMapProps {
  data: TpsItem[];
  onTpsClick?: (id: string) => void;
  selectedId?: string | null;
  height?: string;
  singleMarker?: TpsItem;
  interactive?: boolean;
  className?: string;
}

export const TpsMap: React.FC<TpsMapProps> = ({
  data,
  onTpsClick,
  selectedId,
  height = '100%',
  singleMarker,
  interactive = true,
  className,
}) => {
  const filteredData = useMemo(
    () => data.filter((t) => t.latitude && t.longitude),
    [data],
  );

  const center: [number, number] = singleMarker
    ? [singleMarker.latitude, singleMarker.longitude]
    : DEFAULT_CENTER;

  const zoom = singleMarker ? 15 : DEFAULT_ZOOM;

  return (
    <MapContainer
      center={center}
      zoom={zoom}
      style={{ height, width: '100%' }}
      className={className}
      scrollWheelZoom={interactive}
      dragging={interactive}
      zoomControl={interactive}
      doubleClickZoom={interactive}
      touchZoom={interactive}
    >
      <TileLayer
        attribution='&copy; <a href="https://carto.com">CARTO</a>'
        url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
      />

      {singleMarker ? (
        <SingleMarker tps={singleMarker} />
      ) : (
        <>
          <FitBounds data={filteredData} />
          {filteredData.map((t) => (
            <CircleMarker
              key={t.id}
              center={[t.latitude, t.longitude]}
              radius={10}
              pathOptions={{
                color: fillColor(t.fill_percent, t.status),
                fillColor: fillColor(t.fill_percent, t.status),
                fillOpacity: t.id === selectedId ? 1 : 0.7,
                weight: t.id === selectedId ? 3 : 2,
              }}
              eventHandlers={{
                click: () => onTpsClick?.(t.id),
              }}
            >
              <Popup>
                <div className="space-y-2 min-w-[200px]">
                  <div>
                    <p className="font-semibold text-sm">{t.name}</p>
                    <p className="text-xs text-gray-500">
                      {TYPE_LABELS[t.type] || t.type} · {STATUS_LABELS[t.status] || t.status}
                    </p>
                  </div>
                  <CapacityBar current={t.current_load_tons} max={t.capacity_tons} />
                  <p className="text-xs text-gray-500">
                    {t.current_load_tons.toFixed(1)} / {t.capacity_tons.toFixed(1)} ton
                  </p>
                  {t.address && (
                    <p className="text-xs text-gray-400">{t.address}</p>
                  )}
                </div>
              </Popup>
            </CircleMarker>
          ))}
        </>
      )}
    </MapContainer>
  );
};
