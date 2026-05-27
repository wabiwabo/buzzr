import React, { useMemo } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import type { LatLngBounds } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Badge } from '@/components/ui/badge';
import { StatusBadge } from '@/components/common';
import { SlaCountdown } from '@/components/triage/SlaCountdown';
import type { MapComplaint } from '../types';
import { CATEGORY_LABELS, STATUS_COLOR_MAP } from '../types';

const DEFAULT_CENTER: [number, number] = [-6.2088, 106.8456];
const DEFAULT_ZOOM = 12;
const SLA_HOURS = 72;

function isSlaBreach(c: MapComplaint): boolean {
  if (c.status === 'resolved' || c.status === 'rejected') return false;
  return Date.now() - new Date(c.created_at).getTime() > SLA_HOURS * 60 * 60 * 1000;
}

function markerColor(c: MapComplaint): string {
  if (isSlaBreach(c)) return '#DC2626';
  return STATUS_COLOR_MAP[c.status] || '#6B7280';
}

function FitBounds({ data }: { data: MapComplaint[] }) {
  const map = useMap();

  React.useEffect(() => {
    const valid = data.filter((c) => c.latitude && c.longitude);
    if (valid.length === 0) return;
    const bounds: LatLngBounds = L.latLngBounds(
      valid.map((c) => [c.latitude, c.longitude]),
    );
    map.fitBounds(bounds, { padding: [40, 40], maxZoom: 15 });
  }, [map, data]);

  return null;
}

function SinglePin({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();

  React.useEffect(() => {
    if (lat && lng) {
      map.setView([lat, lng], 15, { animate: false });
    }
  }, [map, lat, lng]);

  return (
    <CircleMarker
      center={[lat, lng]}
      radius={8}
      pathOptions={{ color: '#2563EB', fillColor: '#2563EB', fillOpacity: 0.8, weight: 2 }}
    />
  );
}

interface ComplaintMapProps {
  data: MapComplaint[];
  height?: string;
  singlePin?: { lat: number; lng: number };
  interactive?: boolean;
  className?: string;
}

export const ComplaintMap: React.FC<ComplaintMapProps> = ({
  data,
  height = '100%',
  singlePin,
  interactive = true,
  className,
}) => {
  const validData = useMemo(
    () => data.filter((c) => c.latitude && c.longitude),
    [data],
  );

  const center: [number, number] = singlePin
    ? [singlePin.lat, singlePin.lng]
    : DEFAULT_CENTER;

  const zoom = singlePin ? 15 : DEFAULT_ZOOM;

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

      {singlePin ? (
        <SinglePin lat={singlePin.lat} lng={singlePin.lng} />
      ) : (
        <>
          <FitBounds data={validData} />
          {validData.map((c) => {
            const breach = isSlaBreach(c);
            return (
              <CircleMarker
                key={c.id}
                center={[c.latitude, c.longitude]}
                radius={breach ? 12 : 9}
                pathOptions={{
                  color: markerColor(c),
                  fillColor: markerColor(c),
                  fillOpacity: 0.7,
                  weight: breach ? 3 : 2,
                  className: breach ? 'animate-pulse' : undefined,
                }}
              >
                <Popup>
                  <div className="space-y-2 min-w-[200px]">
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className="text-xs">
                        {CATEGORY_LABELS[c.category] || c.category}
                      </Badge>
                      <StatusBadge status={c.status} />
                    </div>
                    <SlaCountdown createdAt={c.created_at} slaHours={72} className="text-xs" />
                  </div>
                </Popup>
              </CircleMarker>
            );
          })}
        </>
      )}
    </MapContainer>
  );
};
