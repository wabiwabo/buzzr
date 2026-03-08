import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { TpsStatus } from '@buzzr/shared-types';
import api from '../../services/api';

const STATUS_LABELS: Record<string, string> = {
  [TpsStatus.ACTIVE]: 'Aktif',
  [TpsStatus.FULL]: 'Penuh',
  [TpsStatus.MAINTENANCE]: 'Dalam Perawatan',
};

const STATUS_COLORS: Record<string, string> = {
  [TpsStatus.ACTIVE]: '#52c41a',
  [TpsStatus.FULL]: '#ff4d4f',
  [TpsStatus.MAINTENANCE]: '#faad14',
};

interface TpsDetail {
  id: string;
  name: string;
  status: string;
  capacity: number;
  current_load: number;
  currentLoad?: number;
  address?: string;
  type?: string;
}

function getCapacityColor(percentage: number): string {
  if (percentage > 90) return '#ff4d4f';
  if (percentage >= 70) return '#faad14';
  return '#52c41a';
}

export default function StatusTpsScreen() {
  const [tpsId, setTpsId] = useState('');
  const [tpsDetail, setTpsDetail] = useState<TpsDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const activeTpsIdRef = useRef('');

  const fetchTpsDetail = useCallback(async (id: string) => {
    if (!id.trim()) return;
    setLoading(true);
    try {
      const { data } = await api.get(`/tps/${id.trim()}`);
      setTpsDetail({
        id: data.id,
        name: data.name,
        status: data.status,
        capacity: data.capacity ?? 0,
        current_load: data.current_load ?? data.currentLoad ?? 0,
        address: data.address,
        type: data.type,
      });
      setAutoRefresh(true);
    } catch {
      Alert.alert('Error', 'TPS tidak ditemukan atau gagal memuat data.');
      setTpsDetail(null);
      setAutoRefresh(false);
    } finally {
      setLoading(false);
    }
  }, []);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    if (autoRefresh && activeTpsIdRef.current) {
      intervalRef.current = setInterval(() => {
        fetchTpsDetail(activeTpsIdRef.current);
      }, 30000);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [autoRefresh, fetchTpsDetail]);

  const handleFetch = () => {
    if (!tpsId.trim()) {
      Alert.alert('Peringatan', 'Masukkan ID TPS.');
      return;
    }
    activeTpsIdRef.current = tpsId.trim();
    fetchTpsDetail(tpsId.trim());
  };

  const percentage =
    tpsDetail && tpsDetail.capacity > 0
      ? Math.min(100, Math.round((tpsDetail.current_load / tpsDetail.capacity) * 100))
      : 0;

  const capacityColor = getCapacityColor(percentage);

  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Status TPS</Text>
        <Text style={styles.headerSub}>Pantau kapasitas dan status TPS</Text>
      </View>

      {/* TPS ID Input */}
      <View style={styles.section}>
        <Text style={styles.label}>ID TPS</Text>
        <View style={styles.searchRow}>
          <TextInput
            style={[styles.input, styles.searchInput]}
            placeholder="Masukkan ID TPS"
            value={tpsId}
            onChangeText={setTpsId}
            placeholderTextColor="#bbb"
            autoCapitalize="none"
          />
          <TouchableOpacity
            style={styles.searchButton}
            onPress={handleFetch}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.searchButtonText}>Cari</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* TPS Detail */}
      {tpsDetail && (
        <View style={styles.detailContainer}>
          {/* TPS Name & Status */}
          <View style={styles.detailCard}>
            <View style={styles.nameRow}>
              <Text style={styles.tpsName}>{tpsDetail.name}</Text>
              <View
                style={[
                  styles.statusBadge,
                  { backgroundColor: STATUS_COLORS[tpsDetail.status] || '#999' },
                ]}
              >
                <Text style={styles.statusText}>
                  {STATUS_LABELS[tpsDetail.status] || tpsDetail.status}
                </Text>
              </View>
            </View>
            {tpsDetail.address && (
              <Text style={styles.tpsAddress}>{tpsDetail.address}</Text>
            )}
            {tpsDetail.type && (
              <Text style={styles.tpsType}>
                Tipe: {tpsDetail.type.toUpperCase().replace('_', ' ')}
              </Text>
            )}
          </View>

          {/* Capacity Bar */}
          <View style={styles.capacityCard}>
            <Text style={styles.capacityTitle}>Kapasitas</Text>

            <View style={styles.capacityBarContainer}>
              <View style={styles.capacityBarBackground}>
                <View
                  style={[
                    styles.capacityBarFill,
                    {
                      width: `${percentage}%`,
                      backgroundColor: capacityColor,
                    },
                  ]}
                />
              </View>
              <Text style={[styles.capacityPercentage, { color: capacityColor }]}>
                {percentage}%
              </Text>
            </View>

            <View style={styles.capacityNumbers}>
              <View style={styles.capacityItem}>
                <Text style={styles.capacityLabel}>Terisi</Text>
                <Text style={styles.capacityValue}>
                  {tpsDetail.current_load.toLocaleString('id-ID')} kg
                </Text>
              </View>
              <View style={styles.capacityDivider} />
              <View style={styles.capacityItem}>
                <Text style={styles.capacityLabel}>Kapasitas Maks</Text>
                <Text style={styles.capacityValue}>
                  {tpsDetail.capacity.toLocaleString('id-ID')} kg
                </Text>
              </View>
              <View style={styles.capacityDivider} />
              <View style={styles.capacityItem}>
                <Text style={styles.capacityLabel}>Sisa</Text>
                <Text style={styles.capacityValue}>
                  {Math.max(0, tpsDetail.capacity - tpsDetail.current_load).toLocaleString('id-ID')} kg
                </Text>
              </View>
            </View>
          </View>

          {/* Auto-refresh indicator */}
          {autoRefresh && (
            <View style={styles.refreshInfo}>
              <Text style={styles.refreshText}>
                Otomatis diperbarui setiap 30 detik
              </Text>
            </View>
          )}
        </View>
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
  section: {
    paddingHorizontal: 16,
    marginTop: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 6,
  },
  searchRow: {
    flexDirection: 'row',
    gap: 8,
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#d9d9d9',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#333',
  },
  searchInput: {
    flex: 1,
  },
  searchButton: {
    backgroundColor: '#1890ff',
    borderRadius: 8,
    paddingHorizontal: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  detailContainer: {
    marginTop: 16,
  },
  detailCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
  },
  nameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tpsName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  statusBadge: {
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginLeft: 8,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  tpsAddress: {
    fontSize: 13,
    color: '#888',
    marginTop: 6,
  },
  tpsType: {
    fontSize: 13,
    color: '#666',
    marginTop: 4,
    fontWeight: '500',
  },
  capacityCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
  },
  capacityTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  capacityBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  capacityBarBackground: {
    flex: 1,
    height: 20,
    backgroundColor: '#f0f0f0',
    borderRadius: 10,
    overflow: 'hidden',
  },
  capacityBarFill: {
    height: '100%',
    borderRadius: 10,
  },
  capacityPercentage: {
    fontSize: 18,
    fontWeight: 'bold',
    minWidth: 50,
    textAlign: 'right',
  },
  capacityNumbers: {
    flexDirection: 'row',
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  capacityItem: {
    flex: 1,
    alignItems: 'center',
  },
  capacityDivider: {
    width: 1,
    backgroundColor: '#f0f0f0',
  },
  capacityLabel: {
    fontSize: 12,
    color: '#888',
  },
  capacityValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 4,
  },
  refreshInfo: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  refreshText: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
  },
  bottomSpacer: {
    height: 32,
  },
});
