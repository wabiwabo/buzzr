import React from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import type { LatLngExpression } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

export interface MapMarker {
  id: string;
  lat: number;
  lng: number;
  type: 'tps' | 'driver';
  label: string;
  status?: string;
  detail?: string;
}

const statusColors: Record<string, string> = {
  active: '#22C55E',
  full: '#EF4444',
  maintenance: '#F59E0B',
  available: '#3B82F6',
  in_use: '#8B5CF6',
};

interface MapViewProps {
  markers: MapMarker[];
  center?: LatLngExpression;
  zoom?: number;
  height?: number;
  title?: string;
  loading?: boolean;
}

export const MapView: React.FC<MapViewProps> = ({
  markers,
  center = [-6.9175, 107.6191],
  zoom = 12,
  height = 400,
  title = 'Peta',
  loading = false,
}) => (
  <Card className="h-full">
    <CardHeader className="pb-3">
      <CardTitle className="text-sm font-medium">{title}</CardTitle>
    </CardHeader>
    <CardContent>
      {loading ? (
        <Skeleton className="w-full" style={{ height }} />
      ) : (
        <MapContainer
          center={center}
          zoom={zoom}
          style={{ height, borderRadius: 8 }}
          scrollWheelZoom
        >
          <TileLayer
            attribution='&copy; <a href="https://carto.com">CARTO</a>'
            url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          />
          {markers.map((m) => (
            <CircleMarker
              key={m.id}
              center={[m.lat, m.lng]}
              radius={m.type === 'tps' ? 10 : 7}
              pathOptions={{
                color: statusColors[m.status || 'active'] || '#3B82F6',
                fillColor: statusColors[m.status || 'active'] || '#3B82F6',
                fillOpacity: 0.7,
                weight: 2,
              }}
            >
              <Popup>
                <div className="space-y-1">
                  <p className="text-sm font-medium">{m.label}</p>
                  {m.status && (
                    <Badge variant="outline" className="text-[10px]">{m.status}</Badge>
                  )}
                  {m.detail && <p className="text-xs">{m.detail}</p>}
                </div>
              </Popup>
            </CircleMarker>
          ))}
        </MapContainer>
      )}
    </CardContent>
  </Card>
);
