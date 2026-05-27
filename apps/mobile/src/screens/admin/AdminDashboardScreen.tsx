import React, { useCallback, useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, RefreshControl, ActivityIndicator,
} from 'react-native';
import api from '../../services/api';
import { useAuthStore } from '../../stores/auth.store';

interface DashboardSummary {
  totalWasteTodayKg: number;
  activeDrivers: number;
  pendingComplaints: number;
  collectionRate: number;
}

export default function AdminDashboardScreen() {
  const user = useAuthStore((s) => s.user);
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const { data } = await api.get('/reports/dashboard');
      setSummary({
        totalWasteTodayKg: Number(data.totalWasteTodayKg) || 0,
        activeDrivers: Number(data.activeDrivers) || 0,
        pendingComplaints: Number(data.pendingComplaints) || 0,
        collectionRate: Number(data.collectionRate) || 0,
      });
    } catch {
      // Silent failure — show empty/zero state
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const onRefresh = useCallback(() => { setRefreshing(true); fetchData(); }, [fetchData]);

  if (loading) {
    return <View style={styles.centered}><ActivityIndicator size="large" color="#1890ff" /></View>;
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#1890ff']} />}
    >
      <View style={styles.header}>
        <Text style={styles.greeting}>Halo, {user?.name || 'Admin'}!</Text>
        <Text style={styles.subGreeting}>{user?.role === 'super_admin' ? 'Super Admin' : 'Admin DLH'}</Text>
      </View>

      <View style={styles.statsGrid}>
        <View style={[styles.statCard, { borderTopColor: '#22C55E' }]}>
          <Text style={styles.statLabel}>Sampah Hari Ini</Text>
          <Text style={styles.statValue}>
            {(summary?.totalWasteTodayKg || 0).toFixed(1)}
            <Text style={styles.statUnit}> kg</Text>
          </Text>
        </View>
        <View style={[styles.statCard, { borderTopColor: '#3B82F6' }]}>
          <Text style={styles.statLabel}>Driver Aktif</Text>
          <Text style={styles.statValue}>{summary?.activeDrivers || 0}</Text>
        </View>
        <View style={[styles.statCard, { borderTopColor: '#EF4444' }]}>
          <Text style={styles.statLabel}>Pengaduan Pending</Text>
          <Text style={styles.statValue}>{summary?.pendingComplaints || 0}</Text>
        </View>
        <View style={[styles.statCard, { borderTopColor: '#F59E0B' }]}>
          <Text style={styles.statLabel}>Tingkat Penagihan</Text>
          <Text style={styles.statValue}>
            {(summary?.collectionRate || 0).toFixed(1)}
            <Text style={styles.statUnit}> %</Text>
          </Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionRow}>
          <View style={[styles.actionCard, { backgroundColor: '#1890ff' }]}>
            <Text style={styles.actionTitle}>Inbox Pengaduan</Text>
            <Text style={styles.actionHint}>Tinjau & tindak lanjuti</Text>
          </View>
          <View style={[styles.actionCard, { backgroundColor: '#22C55E' }]}>
            <Text style={styles.actionTitle}>Posisi Armada</Text>
            <Text style={styles.actionHint}>Live tracking driver</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f5f5f5' },
  header: { backgroundColor: '#1890ff', paddingHorizontal: 20, paddingTop: 20, paddingBottom: 28 },
  greeting: { fontSize: 22, fontWeight: 'bold', color: '#fff' },
  subGreeting: { fontSize: 14, color: 'rgba(255,255,255,0.85)', marginTop: 4 },
  statsGrid: {
    flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 12, marginTop: -16, gap: 8,
  },
  statCard: {
    flexBasis: '47%', flexGrow: 1,
    backgroundColor: '#fff', borderRadius: 12, padding: 16,
    borderTopWidth: 3,
    elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 3,
  },
  statLabel: { fontSize: 12, color: '#888' },
  statValue: { fontSize: 26, fontWeight: 'bold', color: '#333', marginTop: 4, fontVariant: ['tabular-nums'] },
  statUnit: { fontSize: 14, fontWeight: 'normal', color: '#888' },
  section: { marginTop: 24, paddingHorizontal: 16 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 12 },
  actionRow: { flexDirection: 'row', gap: 10 },
  actionCard: { flex: 1, borderRadius: 12, padding: 16 },
  actionTitle: { fontSize: 14, fontWeight: '600', color: '#fff' },
  actionHint: { fontSize: 12, color: 'rgba(255,255,255,0.85)', marginTop: 4 },
});
