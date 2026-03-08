import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { WASTE_CATEGORY_LABELS } from '@buzzr/constants';
import { WasteCategory } from '@buzzr/shared-types';
import api from '../../services/api';
import { useAuthStore } from '../../stores/auth.store';
import { formatDate } from '../../utils/format';

interface TransferItem {
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

export default function VerifikasiScreen() {
  const user = useAuthStore((s) => s.user);
  const [transfers, setTransfers] = useState<TransferItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [verifyingId, setVerifyingId] = useState<string | null>(null);

  const fetchTransfers = useCallback(async () => {
    try {
      const res = await api
        .get('/transfer/manifest/' + (user?.id || ''))
        .catch(() => ({ data: [] }));

      const items: TransferItem[] = Array.isArray(res.data)
        ? res.data
        : res.data?.data || [];

      // Show only items that can be verified (delivered or in_transit)
      const pending = items.filter(
        (item) =>
          item.status === 'delivered' ||
          item.status === 'in_transit',
      );

      setTransfers(pending);
    } catch {
      Alert.alert('Error', 'Gagal memuat data transfer.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchTransfers();
  }, [fetchTransfers]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchTransfers();
  }, [fetchTransfers]);

  const handleVerify = (item: TransferItem) => {
    const tpsLabel =
      item.tps_name ||
      item.tpsName ||
      item.source_tps_id ||
      item.sourceTpsId ||
      'TPS';
    const vol = item.volume_kg || item.volumeKg || 0;

    Alert.alert(
      'Verifikasi Transfer',
      `Verifikasi transfer dari ${tpsLabel} (${vol} kg)?`,
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Verifikasi',
          onPress: async () => {
            setVerifyingId(item.id);
            try {
              await api.put(`/transfer/${item.id}/verify`);
              Alert.alert('Berhasil', 'Transfer berhasil diverifikasi.');
              fetchTransfers();
            } catch {
              Alert.alert(
                'Error',
                'Gagal memverifikasi transfer. Silakan coba lagi.',
              );
            } finally {
              setVerifyingId(null);
            }
          },
        },
      ],
    );
  };

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
        <Text style={styles.headerTitle}>Verifikasi</Text>
        <Text style={styles.headerSub}>
          Verifikasi transfer yang masuk
        </Text>
      </View>

      {/* Pending count */}
      <View style={styles.countCard}>
        <Text style={styles.countLabel}>Menunggu Verifikasi</Text>
        <Text style={styles.countValue}>{transfers.length}</Text>
      </View>

      {transfers.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyText}>
            Tidak ada transfer yang perlu diverifikasi
          </Text>
        </View>
      ) : (
        transfers.map((item) => {
          const statusColor = getStatusColor(item.status);
          const catLabel =
            WASTE_CATEGORY_LABELS[
              item.category as WasteCategory
            ] ||
            item.category ||
            '-';
          const isVerifying = verifyingId === item.id;

          return (
            <View key={item.id} style={styles.transferCard}>
              <View style={styles.transferHeader}>
                <Text style={styles.transferTps}>
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
                  <Text
                    style={[styles.statusText, { color: statusColor }]}
                  >
                    {STATUS_LABELS[item.status || ''] ||
                      item.status ||
                      '-'}
                  </Text>
                </View>
              </View>

              <Text style={styles.transferDetail}>
                {catLabel} - {item.volume_kg || item.volumeKg || 0} kg
              </Text>

              {(item.driver_name || item.driverName) && (
                <Text style={styles.transferDriver}>
                  Driver: {item.driver_name || item.driverName}
                </Text>
              )}

              <Text style={styles.transferDate}>
                {formatDate(item.created_at || item.createdAt)}
              </Text>

              <TouchableOpacity
                style={[
                  styles.verifyBtn,
                  isVerifying && styles.verifyBtnDisabled,
                ]}
                onPress={() => handleVerify(item)}
                disabled={isVerifying}
                activeOpacity={0.8}
              >
                {isVerifying ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.verifyBtnText}>Verifikasi</Text>
                )}
              </TouchableOpacity>
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
  countCard: {
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
  countLabel: {
    fontSize: 14,
    color: '#666',
  },
  countValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fa8c16',
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
  transferCard: {
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
  transferHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  transferTps: {
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
  transferDetail: {
    fontSize: 13,
    color: '#666',
    marginTop: 8,
  },
  transferDriver: {
    fontSize: 13,
    color: '#888',
    marginTop: 4,
  },
  transferDate: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  verifyBtn: {
    backgroundColor: '#52c41a',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 12,
  },
  verifyBtnDisabled: {
    opacity: 0.6,
  },
  verifyBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: 'bold',
  },
  bottomSpacer: {
    height: 24,
  },
});
