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
import api from '../../services/api';
import { formatDate } from '../../utils/format';

interface TpsStop {
  id: string;
  tps_name?: string;
  tpsName?: string;
  name?: string;
  address?: string;
  estimated_time?: string;
  estimatedTime?: string;
  status?: string;
}

interface Schedule {
  id: string;
  area_name?: string;
  areaName?: string;
  scheduled_time?: string;
  scheduledTime?: string;
  scheduled_date?: string;
  scheduledDate?: string;
  status?: string;
  stops?: TpsStop[];
  tps_stops?: TpsStop[];
}

const getStatusColor = (status?: string): string => {
  switch (status) {
    case 'completed':
      return '#52c41a';
    case 'in_progress':
      return '#1890ff';
    case 'pending':
      return '#fa8c16';
    case 'cancelled':
      return '#f5222d';
    default:
      return '#999';
  }
};

const getStatusLabel = (status?: string): string => {
  switch (status) {
    case 'completed':
      return 'Selesai';
    case 'in_progress':
      return 'Sedang Berjalan';
    case 'pending':
      return 'Menunggu';
    case 'cancelled':
      return 'Dibatalkan';
    default:
      return status || '-';
  }
};

export default function JadwalScreen() {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchSchedules = useCallback(async () => {
    try {
      const res = await api.get('/schedules/today');
      const data = Array.isArray(res.data) ? res.data : res.data?.data || [];
      setSchedules(data);
    } catch {
      Alert.alert('Error', 'Gagal memuat jadwal. Silakan coba lagi.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchSchedules();
  }, [fetchSchedules]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchSchedules();
  }, [fetchSchedules]);

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
        <Text style={styles.headerTitle}>Jadwal Hari Ini</Text>
        <Text style={styles.headerSub}>
          {formatDate(new Date().toISOString())}
        </Text>
      </View>

      {schedules.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyText}>
            Tidak ada jadwal untuk hari ini
          </Text>
        </View>
      ) : (
        schedules.map((schedule) => {
          const stops = schedule.stops || schedule.tps_stops || [];
          const statusColor = getStatusColor(schedule.status);

          return (
            <View key={schedule.id} style={styles.scheduleCard}>
              <View style={styles.scheduleHeader}>
                <Text style={styles.areaName}>
                  {schedule.area_name || schedule.areaName || 'Area'}
                </Text>
                {schedule.status && (
                  <View
                    style={[
                      styles.statusBadge,
                      { backgroundColor: statusColor + '18' },
                    ]}
                  >
                    <Text style={[styles.statusText, { color: statusColor }]}>
                      {getStatusLabel(schedule.status)}
                    </Text>
                  </View>
                )}
              </View>

              <View style={styles.scheduleInfo}>
                <Text style={styles.infoLabel}>Waktu</Text>
                <Text style={styles.infoValue}>
                  {schedule.scheduled_time ||
                    schedule.scheduledTime ||
                    '-'}
                </Text>
              </View>

              {stops.length > 0 && (
                <View style={styles.stopsSection}>
                  <Text style={styles.stopsTitle}>
                    Titik TPS ({stops.length})
                  </Text>
                  {stops.map((stop, index) => (
                    <View key={stop.id || String(index)} style={styles.stopItem}>
                      <View style={styles.stopIndicator}>
                        <View style={styles.stopDot} />
                        {index < stops.length - 1 && (
                          <View style={styles.stopLine} />
                        )}
                      </View>
                      <View style={styles.stopContent}>
                        <Text style={styles.stopName}>
                          {stop.tps_name || stop.tpsName || stop.name || `TPS ${index + 1}`}
                        </Text>
                        {stop.address && (
                          <Text style={styles.stopAddress}>{stop.address}</Text>
                        )}
                        {(stop.estimated_time || stop.estimatedTime) && (
                          <Text style={styles.stopTime}>
                            Est: {stop.estimated_time || stop.estimatedTime}
                          </Text>
                        )}
                      </View>
                    </View>
                  ))}
                </View>
              )}
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
  scheduleCard: {
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
  scheduleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  areaName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  scheduleInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  infoLabel: {
    fontSize: 13,
    color: '#888',
  },
  infoValue: {
    fontSize: 13,
    color: '#333',
    fontWeight: '500',
  },
  stopsSection: {
    marginTop: 12,
  },
  stopsTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  stopItem: {
    flexDirection: 'row',
    minHeight: 40,
  },
  stopIndicator: {
    width: 20,
    alignItems: 'center',
  },
  stopDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#1890ff',
    marginTop: 4,
  },
  stopLine: {
    width: 2,
    flex: 1,
    backgroundColor: '#d9d9d9',
    marginTop: 2,
  },
  stopContent: {
    flex: 1,
    paddingLeft: 8,
    paddingBottom: 12,
  },
  stopName: {
    fontSize: 13,
    fontWeight: '500',
    color: '#333',
  },
  stopAddress: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
  },
  stopTime: {
    fontSize: 11,
    color: '#1890ff',
    marginTop: 2,
  },
  bottomSpacer: {
    height: 24,
  },
});
