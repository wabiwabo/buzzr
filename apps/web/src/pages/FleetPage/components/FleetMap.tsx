import React, { useMemo } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import type { LatLngBounds } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Badge } from '@/components/ui/badge';
import dayjs from 'dayjs';
import type { FleetPosition } from '../types';
import { VEHICLE_TYPE_LABELS, STATUS_COLOR, STATUS_LABEL_ID, deriveVehicleStatus } from '../types';

const DEFAULT_CENTER: [number, number] = [-6.2088, 106.8456];
const DEFAULT_ZOOM = 12;

function FitBounds({ data }: { data: FleetPosition[] }) {
  const map = useMap();

  React.useEffect(() => {
    const valid = data.filter((v) => v.latitude != null && v.longitude != null);
    if (valid.length === 0) return;
    const bounds: LatLngBounds = L.latLngBounds(
      valid.map((v) => [v.latitude!, v.longitude!]),
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

interface FleetMapProps {
  data: FleetPosition[];
  onVehicleClick?: (id: string) => void;
  selectedId?: string | null;
  height?: string;
  singlePin?: { lat: number; lng: number };
  interactive?: boolean;
}

export const FleetMap: React.FC<FleetMapProps> = ({
  data,
  onVehicleClick,
  selectedId,
  height = '100%',
  singlePin,
  interactive = true,
}) => {
  const valid = useMemo(
    () => data.filter((v) => v.latitude != null && v.longitude != null),
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
          <FitBounds data={valid} />
          {valid.map((v) => {
            const status = deriveVehicleStatus(v.is_active, v.speed, v.last_update);
            const color = STATUS_COLOR[status];
            return (
              <CircleMarker
                key={v.id}
                center={[v.latitude!, v.longitude!]}
                radius={v.id === selectedId ? 12 : 9}
                pathOptions={{
                  color,
                  fillColor: color,
                  fillOpacity: v.id === selectedId ? 1 : 0.7,
                  weight: v.id === selectedId ? 3 : 2,
                  className: status === 'online' ? 'animate-pulse' : undefined,
                }}
                eventHandlers={{ click: () => onVehicleClick?.(v.id) }}
              >
                <Popup>
                  <div className="space-y-2 min-w-[200px]">
                    <div>
                      <p className="font-semibold text-sm font-mono">{v.plate_number}</p>
                      <p className="text-xs text-gray-500">
                        {VEHICLE_TYPE_LABELS[v.type] || v.type} · {STATUS_LABEL_ID[status]}
                      </p>
                    </div>
                    {v.driver_name && (
                      <p className="text-xs">
                        <span className="text-gray-500">Pengemudi: </span>
                        {v.driver_name}
                      </p>
                    )}
                    {v.speed != null && (
                      <Badge variant="outline" className="text-xs">
                        {v.speed.toFixed(1)} km/jam
                      </Badge>
                    )}
                    {v.last_update && (
                      <p className="text-xs text-gray-400">
                        Update: {dayjs(v.last_update).format('HH:mm:ss')}
                      </p>
                    )}
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
