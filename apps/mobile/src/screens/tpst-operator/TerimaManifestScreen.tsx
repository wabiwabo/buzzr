import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { WASTE_CATEGORY_LABELS } from '@buzzr/constants';
import { WasteCategory } from '@buzzr/shared-types';
import api from '../../services/api';
import { useAuthStore } from '../../stores/auth.store';
import { formatDate } from '../../utils/format';

interface ManifestItem {
  id: string;
  source_tps_id?: string;
  sourceTpsId?: string;
  tps_name?: string;
  tpsName?: string;
  category?: string;
  volume_kg?: number;
  volumeKg?: number;
  driver_name?: string;
  driverName?: string;
  status?: string;
  created_at?: string;
  createdAt?: string;
}

const STATUS_LABELS: Record<string, string> = {
  pending: 'Menunggu',
  in_transit: 'Dalam Perjalanan',
  delivered: 'Terkirim',
  verified: 'Terverifikasi',
};

const getStatusColor = (status?: string): string => {
  switch (status) {
    case 'pending':
      return '#fa8c16';
    case 'in_transit':
      return '#1890ff';
    case 'delivered':
      return '#52c41a';
    case 'verified':
      return '#13c2c2';
    default:
      return '#999';
  }
};

export default function TerimaManifestScreen() {
  const user = useAuthStore((s) => s.user);
  const [manifests, setManifests] = useState<ManifestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchManifests = useCallback(async () => {
    try {
      const res = await api
        .get('/transfer/manifest/' + (user?.id || ''))
        .catch(() => ({ data: [] }));

      const items: ManifestItem[] = Array.isArray(res.data)
        ? res.data
        : res.data?.data || [];

      setManifests(items);
    } catch {
      Alert.alert('Error', 'Gagal memuat manifest.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchManifests();
  }, [fetchManifests]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchManifests();
  }, [fetchManifests]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#1890ff" />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={['#1890ff']}
        />
      }
    >
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Terima Manifest</Text>
        <Text style={styles.headerSub}>
          Manifest transfer masuk ke TPST
        </Text>
      </View>

      {/* Summary */}
      <View style={styles.summaryCard}>
        <Text style={styles.summaryLabel}>Total Manifest</Text>
        <Text style={styles.summaryValue}>{manifests.length}</Text>
      </View>

      {manifests.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyText}>
            Belum ada manifest masuk hari ini
          </Text>
        </View>
      ) : (
        manifests.map((item) => {
          const statusColor = getStatusColor(item.status);
          const catLabel =
            WASTE_CATEGORY_LABELS[
              item.category as WasteCategory
            ] ||
            item.category ||
            '-';

          return (
            <View key={item.id} style={styles.manifestCard}>
              <View style={styles.manifestHeader}>
                <Text style={styles.manifestTps}>
                  {item.tps_name ||
                    item.tpsName ||
                    item.source_tps_id ||
                    item.sourceTpsId ||
                    'TPS'}
                </Text>
                <View
                  style={[
                    styles.statusBadge,
                    { backgroundColor: statusColor + '18' },
                  ]}
                >
                  <Text style={[styles.statusText, { color: statusColor }]}>
                    {STATUS_LABELS[item.status || ''] || item.status || '-'}
                  </Text>
                </View>
              </View>

              <Text style={styles.manifestDetail}>
                {catLabel} - {item.volume_kg || item.volumeKg || 0} kg
              </Text>

              {(item.driver_name || item.driverName) && (
                <Text style={styles.manifestDriver}>
                  Driver: {item.driver_name || item.driverName}
                </Text>
              )}

              <Text style={styles.manifestDate}>
                {formatDate(item.created_at || item.createdAt)}
              </Text>
            </View>
          );
        })
      )}

      <View style={styles.bottomSpacer} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#1890ff',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 24,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerSub: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.85)',
    marginTop: 4,
  },
  summaryCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: -12,
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#666',
  },
  summaryValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1890ff',
    marginTop: 4,
  },
  emptyCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 20,
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 16,
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
  },
  manifestCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginHorizontal: 16,
    marginTop: 12,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
  },
  manifestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  manifestTps: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
    flex: 1,
    marginRight: 8,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  manifestDetail: {
    fontSize: 13,
    color: '#666',
    marginTop: 8,
  },
  manifestDriver: {
    fontSize: 13,
    color: '#888',
    marginTop: 4,
  },
  manifestDate: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  bottomSpacer: {
    height: 24,
  },
});
