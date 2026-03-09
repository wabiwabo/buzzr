import React, { useMemo } from 'react';
import { MapContainer, TileLayer, CircleMarker, Polyline, Popup, useMap } from 'react-leaflet';
import type { LatLngExpression } from 'leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.heat';
import { useLiveOpsStore } from '../store';
import type { VehicleWithStatus, TpsMapItem, ActiveSchedule } from '../types';

const BANDUNG_CENTER: LatLngExpression = [-6.9175, 107.6191];

const vehicleStatusColors: Record<string, string> = {
  moving: '#22C55E',
  idle: '#EAB308',
  offline: '#9CA3AF',
  alert: '#EF4444',
};

function tpsFillColor(fillPercent: number): string {
  if (fillPercent >= 90) return '#EF4444';
  if (fillPercent >= 70) return '#F59E0B';
  return '#22C55E';
}

function FitBoundsOnSelect({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  React.useEffect(() => {
    map.setView([lat, lng], 15, { animate: true });
  }, [lat, lng, map]);
  return null;
}

function HeatmapLayer({ points }: { points: { latitude: number; longitude: number; total_kg: number }[] }) {
  const map = useMap();

  React.useEffect(() => {
    if (points.length === 0) return;

    const maxKg = Math.max(...points.map((p) => p.total_kg));
    const heatData: [number, number, number][] = points.map((p) => [
      p.latitude,
      p.longitude,
      p.total_kg / maxKg,
    ]);

    const heat = (L as any).heatLayer(heatData, {
      radius: 25,
      blur: 15,
      maxZoom: 17,
      gradient: { 0.4: 'green', 0.65: 'yellow', 1: 'red' },
    });

    heat.addTo(map);
    return () => { map.removeLayer(heat); };
  }, [map, points]);

  return null;
}

interface LiveMapProps {
  className?: string;
}

export const LiveMap: React.FC<LiveMapProps> = ({ className }) => {
  const {
    vehicles,
    tpsLocations,
    activeSchedules,
    activeLayers,
    selectedVehicleId,
    selectVehicle,
    selectTps,
    heatmapData,
  } = useLiveOpsStore();

  const selectedVehicle = useMemo(
    () => vehicles.find((v) => v.id === selectedVehicleId),
    [vehicles, selectedVehicleId],
  );

  return (
    <MapContainer
      center={BANDUNG_CENTER}
      zoom={12}
      className={className}
      style={{ height: '100%', width: '100%' }}
      scrollWheelZoom
      zoomControl={false}
    >
      <TileLayer
        attribution='&copy; <a href="https://carto.com">CARTO</a>'
        url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
      />

      {/* Vehicle markers */}
      {activeLayers.has('vehicles') &&
        vehicles
          .filter((v) => v.latitude != null && v.longitude != null)
          .map((v) => (
            <CircleMarker
              key={v.id}
              center={[v.latitude!, v.longitude!]}
              radius={8}
              pathOptions={{
                color: vehicleStatusColors[v.status],
                fillColor: vehicleStatusColors[v.status],
                fillOpacity: v.id === selectedVehicleId ? 1 : 0.7,
                weight: v.id === selectedVehicleId ? 3 : 2,
              }}
              eventHandlers={{
                click: () => selectVehicle(v.id),
              }}
            >
              <Popup>
                <div className="space-y-1 min-w-[180px]">
                  <p className="font-semibold text-sm">{v.plate_number}</p>
                  <p className="text-xs text-gray-600">{v.driver_name || 'Tidak ada pengemudi'}</p>
                  <p className="text-xs">
                    Status: <span className="font-medium capitalize">{v.status}</span>
                    {v.speed != null && ` · ${v.speed.toFixed(1)} km/h`}
                  </p>
                </div>
              </Popup>
            </CircleMarker>
          ))}

      {/* TPS markers */}
      {activeLayers.has('tps') &&
        tpsLocations
          .filter((t) => t.latitude != null && t.longitude != null)
          .map((t) => (
            <CircleMarker
              key={t.id}
              center={[t.latitude, t.longitude]}
              radius={10}
              pathOptions={{
                color: tpsFillColor(t.fill_percent),
                fillColor: tpsFillColor(t.fill_percent),
                fillOpacity: 0.7,
                weight: 2,
              }}
              eventHandlers={{
                click: () => selectTps(t.id),
              }}
            >
              <Popup>
                <div className="space-y-1 min-w-[180px]">
                  <p className="font-semibold text-sm">{t.name}</p>
                  <p className="text-xs text-gray-600">{t.type}</p>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="h-2 rounded-full"
                      style={{
                        width: `${Math.min(100, t.fill_percent)}%`,
                        backgroundColor: tpsFillColor(t.fill_percent),
                      }}
                    />
                  </div>
                  <p className="text-xs">
                    {t.current_load_tons.toFixed(1)} / {t.capacity_tons.toFixed(1)} ton ({t.fill_percent}%)
                  </p>
                </div>
              </Popup>
            </CircleMarker>
          ))}

      {/* Route polylines */}
      {activeLayers.has('routes') &&
        activeSchedules
          .filter((s) => s.stops && s.stops.length > 0)
          .map((schedule) => {
            const stops = schedule.stops!;
            const positions: LatLngExpression[] = stops
              .map((stop) => {
                const tps = tpsLocations.find((t) => t.id === stop.tps_id);
                return tps ? [tps.latitude, tps.longitude] as LatLngExpression : null;
              })
              .filter((p): p is LatLngExpression => p !== null);

            if (positions.length < 2) return null;

            return (
              <Polyline
                key={schedule.id}
                positions={positions}
                pathOptions={{
                  color: schedule.status === 'completed' ? '#22C55E' : '#3B82F6',
                  weight: 3,
                  opacity: 0.7,
                  dashArray: schedule.status === 'in_progress' ? '10 5' : undefined,
                }}
              />
            );
          })}

      {/* Heatmap layer */}
      {activeLayers.has('heatmap') && heatmapData.length > 0 && (
        <HeatmapLayer points={heatmapData} />
      )}

      {/* Pan to selected vehicle */}
      {selectedVehicle && selectedVehicle.latitude != null && selectedVehicle.longitude != null && (
        <FitBoundsOnSelect lat={selectedVehicle.latitude} lng={selectedVehicle.longitude} />
      )}
    </MapContainer>
  );
};
