import React, { useCallback, useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, RefreshControl, ActivityIndicator,
} from 'react-native';
import api from '../../services/api';

interface FleetPosition {
  id: string;
  plate_number: string;
  type: string;
  driver_name: string | null;
  is_active: boolean;
  latitude: number | null;
  longitude: number | null;
  speed: number | null;
  last_update: string | null;
}

function deriveStatus(v: FleetPosition): 'online' | 'idle' | 'offline' | 'inactive' {
  if (!v.is_active) return 'inactive';
  if (!v.last_update) return 'offline';
  const age = Date.now() - new Date(v.last_update).getTime();
  if (age > 30 * 60 * 1000) return 'offline';
  if (v.speed != null && v.speed > 5) return 'online';
  return 'idle';
}

const STATUS_COLOR = {
  online: '#22C55E', idle: '#F59E0B', offline: '#9CA3AF', inactive: '#6B7280',
};
const STATUS_LABEL = {
  online: 'Bergerak', idle: 'Diam', offline: 'Offline', inactive: 'Nonaktif',
};

const TYPE_LABELS: Record<string, string> = {
  truck: 'Truk', cart: 'Gerobak', motorcycle: 'Motor',
};

export default function AdminLiveScreen() {
  const [positions, setPositions] = useState<FleetPosition[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const { data } = await api.get('/fleet/positions');
      const list: FleetPosition[] = Array.isArray(data) ? data.map((v: any) => ({
        ...v,
        latitude: v.latitude != null ? Number(v.latitude) : null,
        longitude: v.longitude != null ? Number(v.longitude) : null,
        speed: v.speed != null ? Number(v.speed) : null,
      })) : [];
      setPositions(list);
    } catch {
      // ignore
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    // Poll every 30s while screen is mounted
    const t = setInterval(fetchData, 30_000);
    return () => clearInterval(t);
  }, [fetchData]);

  const onRefresh = useCallback(() => { setRefreshing(true); fetchData(); }, [fetchData]);

  if (loading) {
    return <View style={styles.centered}><ActivityIndicator size="large" color="#1890ff" /></View>;
  }

  const onlineCount = positions.filter((v) => {
    const s = deriveStatus(v);
    return s === 'online' || s === 'idle';
  }).length;

  const renderItem = ({ item }: { item: FleetPosition }) => {
    const status = deriveStatus(item);
    const lastUpdateStr = item.last_update
      ? new Date(item.last_update).toLocaleString('id-ID', { hour: '2-digit', minute: '2-digit' })
      : '—';

    return (
      <View style={styles.card}>
        <View style={styles.cardLeft}>
          <View style={[styles.statusDot, { backgroundColor: STATUS_COLOR[status] }]} />
          <View>
            <Text style={styles.plate}>{item.plate_number}</Text>
            <Text style={styles.meta}>
              {TYPE_LABELS[item.type] || item.type} · {item.driver_name || 'Belum ditugaskan'}
            </Text>
          </View>
        </View>
        <View style={styles.cardRight}>
          <Text style={[styles.statusLabel, { color: STATUS_COLOR[status] }]}>
            {STATUS_LABEL[status]}
          </Text>
          {item.speed != null && status !== 'offline' && status !== 'inactive' && (
            <Text style={styles.meta}>{item.speed.toFixed(1)} km/jam</Text>
          )}
          <Text style={styles.metaSmall}>Update: {lastUpdateStr}</Text>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Posisi Armada</Text>
        <Text style={styles.headerSub}>
          {positions.length} kendaraan · {onlineCount} online
        </Text>
      </View>

      <FlatList
        data={positions}
        keyExtractor={(v) => v.id}
        renderItem={renderItem}
        contentContainerStyle={{ padding: 12 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#1890ff']} />}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>Tidak ada kendaraan aktif</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { backgroundColor: '#1890ff', paddingHorizontal: 20, paddingVertical: 16 },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#fff' },
  headerSub: { fontSize: 13, color: 'rgba(255,255,255,0.85)', marginTop: 2 },
  card: {
    backgroundColor: '#fff', borderRadius: 8, padding: 12, marginBottom: 8,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  cardLeft: { flexDirection: 'row', alignItems: 'center', flex: 1, gap: 12 },
  cardRight: { alignItems: 'flex-end' },
  statusDot: { width: 10, height: 10, borderRadius: 5 },
  plate: { fontSize: 14, fontWeight: '600', color: '#333' },
  statusLabel: { fontSize: 12, fontWeight: '600' },
  meta: { fontSize: 12, color: '#888', marginTop: 2 },
  metaSmall: { fontSize: 10, color: '#aaa', marginTop: 2 },
  emptyState: { padding: 40, alignItems: 'center' },
  emptyText: { color: '#999' },
});
