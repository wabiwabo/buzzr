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
import api from '../../services/api';
import { useAuthStore } from '../../stores/auth.store';
import { parsePoints } from '../../utils/format';

interface Schedule {
  id: string;
  area_name?: string;
  areaName?: string;
  scheduled_time?: string;
  scheduledTime?: string;
  status?: string;
}

interface Notification {
  id: string;
  title: string;
  body?: string;
  message?: string;
  read: boolean;
  created_at?: string;
  createdAt?: string;
}

export default function BerandaScreen() {
  const user = useAuthStore((s) => s.user);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [points, setPoints] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [schedulesRes, notificationsRes, pointsRes] = await Promise.all([
        api.get('/schedules/today').catch(() => ({ data: [] })),
        api.get('/notifications', { params: { limit: 5 } }).catch(() => ({ data: [] })),
        api.get('/payments/bank-sampah/reward/points').catch(() => ({ data: { points: 0 } })),
      ]);

      setSchedules(
        Array.isArray(schedulesRes.data) ? schedulesRes.data : schedulesRes.data?.data || [],
      );
      setNotifications(
        Array.isArray(notificationsRes.data)
          ? notificationsRes.data
          : notificationsRes.data?.data || [],
      );

      setPoints(parsePoints(pointsRes.data));
    } catch {
      Alert.alert('Error', 'Gagal memuat data. Silakan coba lagi.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchData();
  }, [fetchData]);

  const markAsRead = async (id: string) => {
    try {
      await api.post(`/notifications/${id}/read`);
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    } catch {
      // silent fail
    }
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
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#1890ff']} />}
    >
      <View style={styles.header}>
        <Text style={styles.greeting}>Halo, {user?.name || 'Warga'}!</Text>
        <Text style={styles.subGreeting}>Selamat datang di Buzzr</Text>
      </View>

      {/* Poin Reward */}
      <View style={styles.pointsCard}>
        <Text style={styles.pointsLabel}>Poin Reward Anda</Text>
        <Text style={styles.pointsValue}>{points.toLocaleString('id-ID')}</Text>
      </View>

      {/* Jadwal Angkut */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Jadwal Angkut Hari Ini</Text>
        {schedules.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>Tidak ada jadwal angkut hari ini</Text>
          </View>
        ) : (
          schedules.map((schedule) => (
            <View key={schedule.id} style={styles.card}>
              <Text style={styles.cardTitle}>
                {schedule.area_name || schedule.areaName || 'Area'}
              </Text>
              <Text style={styles.cardSub}>
                Waktu: {schedule.scheduled_time || schedule.scheduledTime || '-'}
              </Text>
              {schedule.status && <Text style={styles.cardSub}>Status: {schedule.status}</Text>}
            </View>
          ))
        )}
      </View>

      {/* Notifikasi */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Notifikasi Terbaru</Text>
        {notifications.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>Belum ada notifikasi</Text>
          </View>
        ) : (
          notifications.map((notif) => (
            <TouchableOpacity
              key={notif.id}
              style={[styles.card, !notif.read && styles.unreadCard]}
              onPress={() => !notif.read && markAsRead(notif.id)}
            >
              <Text style={[styles.cardTitle, !notif.read && styles.unreadText]}>
                {notif.title}
              </Text>
              <Text style={styles.cardSub} numberOfLines={2}>
                {notif.body || notif.message || ''}
              </Text>
            </TouchableOpacity>
          ))
        )}
      </View>

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
  greeting: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
  },
  subGreeting: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.85)',
    marginTop: 4,
  },
  pointsCard: {
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
  pointsLabel: {
    fontSize: 14,
    color: '#666',
  },
  pointsValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1890ff',
    marginTop: 4,
  },
  section: {
    marginTop: 20,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 14,
    marginBottom: 8,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  unreadCard: {
    borderLeftWidth: 3,
    borderLeftColor: '#1890ff',
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  unreadText: {
    color: '#1890ff',
  },
  cardSub: {
    fontSize: 12,
    color: '#888',
    marginTop: 4,
  },
  emptyCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 20,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
  },
  bottomSpacer: {
    height: 24,
  },
});
