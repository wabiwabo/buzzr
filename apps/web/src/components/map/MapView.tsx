import React from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import { Card, Tag, Typography, Space } from 'antd';
import type { LatLngExpression } from 'leaflet';
import 'leaflet/dist/leaflet.css';

const { Text } = Typography;

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
  active: '#52c41a',
  full: '#ff4d4f',
  maintenance: '#faad14',
  available: '#1677ff',
  in_use: '#722ed1',
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
  <Card title={title} className="glass-card" loading={loading} size="small" style={{ height: '100%' }}>
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
            color: statusColors[m.status || 'active'] || '#1677ff',
            fillColor: statusColors[m.status || 'active'] || '#1677ff',
            fillOpacity: 0.7,
            weight: 2,
          }}
        >
          <Popup>
            <Space direction="vertical" size={2}>
              <Text strong style={{ fontSize: 13 }}>{m.label}</Text>
              {m.status && <Tag color={statusColors[m.status]}>{m.status}</Tag>}
              {m.detail && <Text style={{ fontSize: 12 }}>{m.detail}</Text>}
            </Space>
          </Popup>
        </CircleMarker>
      ))}
    </MapContainer>
  </Card>
);
