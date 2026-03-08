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
import { ROLE_LABELS } from '@buzzr/constants';
import api from '../../services/api';
import { useAuthStore } from '../../stores/auth.store';

interface ManifestItem {
  id: string;
  status?: string;
}

export default function DriverProfilScreen() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const [completedCount, setCompletedCount] = useState<number>(0);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      // Fetch today's manifest to get checkpoint counts
      const manifestRes = await api
        .get('/transfer/manifest/' + (user?.id || ''))
        .catch(() => ({ data: [] }));

      const manifest: ManifestItem[] = Array.isArray(manifestRes.data)
        ? manifestRes.data
        : manifestRes.data?.data || [];

      setTotalCount(manifest.length);
      setCompletedCount(
        manifest.filter(
          (item) =>
            item.status === 'delivered' || item.status === 'verified',
        ).length,
      );
    } catch {
      Alert.alert('Error', 'Gagal memuat data profil.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchData();
  }, [fetchData]);

  const handleLogout = () => {
    Alert.alert('Keluar', 'Apakah Anda yakin ingin keluar?', [
      { text: 'Batal', style: 'cancel' },
      {
        text: 'Keluar',
        style: 'destructive',
        onPress: async () => {
          try {
            await logout();
          } catch {
            Alert.alert('Error', 'Gagal keluar. Silakan coba lagi.');
          }
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#1890ff" />
      </View>
    );
  }

  const roleLabel =
    ROLE_LABELS[user?.role as keyof typeof ROLE_LABELS] || user?.role || 'Pengemudi';

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
      {/* User Info Header */}
      <View style={styles.profileHeader}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {(user?.name || 'D').charAt(0).toUpperCase()}
          </Text>
        </View>
        <Text style={styles.userName}>{user?.name || 'Pengemudi'}</Text>
        <Text style={styles.userRole}>{roleLabel}</Text>
      </View>

      {/* Contact Info */}
      <View style={styles.infoCard}>
        {user?.phone && (
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Telepon</Text>
            <Text style={styles.infoValue}>{user.phone}</Text>
          </View>
        )}
        {user?.email && (
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Email</Text>
            <Text style={styles.infoValue}>{user.email}</Text>
          </View>
        )}
      </View>

      {/* Today's Stats */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Statistik Hari Ini</Text>
        <View style={styles.statsCard}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{completedCount}</Text>
            <Text style={styles.statLabel}>Selesai</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{totalCount}</Text>
            <Text style={styles.statLabel}>Total Checkpoint</Text>
          </View>
        </View>
      </View>

      {/* Logout */}
      <View style={styles.section}>
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Text style={styles.logoutText}>Keluar</Text>
        </TouchableOpacity>
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
  profileHeader: {
    backgroundColor: '#1890ff',
    paddingTop: 24,
    paddingBottom: 28,
    alignItems: 'center',
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255,255,255,0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  userRole: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.85)',
    marginTop: 4,
  },
  infoCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: -12,
    borderRadius: 12,
    padding: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  infoLabel: {
    fontSize: 14,
    color: '#888',
  },
  infoValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  section: {
    paddingHorizontal: 16,
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  statsCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1890ff',
  },
  statLabel: {
    fontSize: 13,
    color: '#888',
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#f0f0f0',
  },
  logoutBtn: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#f5222d',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  logoutText: {
    color: '#f5222d',
    fontSize: 16,
    fontWeight: 'bold',
  },
  bottomSpacer: {
    height: 32,
  },
});
