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
import { ROLE_LABELS, WASTE_CATEGORY_LABELS } from '@buzzr/constants';
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
  status?: string;
  checkpoint_at?: string;
  checkpointAt?: string;
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
    case 'pending': return '#fa8c16';
    case 'in_transit': return '#1890ff';
    case 'delivered': return '#52c41a';
    case 'verified': return '#13c2c2';
    default: return '#999';
  }
};

export default function DriverProfilScreen() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const [manifest, setManifest] = useState<ManifestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [submittingManifest, setSubmittingManifest] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const manifestRes = await api
        .get('/transfer/manifest/' + (user?.id || ''))
        .catch(() => ({ data: [] }));

      const items: ManifestItem[] = Array.isArray(manifestRes.data)
        ? manifestRes.data
        : manifestRes.data?.data || [];

      setManifest(items);
    } catch {
      Alert.alert('Error', 'Gagal memuat data.');
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

  const completedCount = manifest.filter(
    (item) => item.status === 'delivered' || item.status === 'verified',
  ).length;

  const handleSubmitToTpst = () => {
    const pendingItems = manifest.filter(
      (item) => item.status !== 'verified',
    );
    if (pendingItems.length === 0) {
      Alert.alert('Info', 'Tidak ada manifest untuk diserahkan.');
      return;
    }
    Alert.alert(
      'Serah Terima TPST',
      `Serahkan ${pendingItems.length} item manifest ke TPST?`,
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Serahkan',
          onPress: async () => {
            setSubmittingManifest(true);
            try {
              await Promise.all(
                pendingItems.map((item) =>
                  api.put(`/transfer/${item.id}/verify`).catch(() => null),
                ),
              );
              Alert.alert('Berhasil', 'Manifest telah diserahkan ke TPST.');
              fetchData();
            } catch {
              Alert.alert('Error', 'Gagal menyerahkan manifest.');
            } finally {
              setSubmittingManifest(false);
            }
          },
        },
      ],
    );
  };

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
            <Text style={styles.statValue}>{manifest.length}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
        </View>
      </View>

      {/* Manifest List */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Manifest Trip</Text>
        {manifest.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>Belum ada manifest hari ini</Text>
          </View>
        ) : (
          manifest.map((item) => {
            const statusColor = getStatusColor(item.status);
            const catLabel =
              WASTE_CATEGORY_LABELS[
                item.category as keyof typeof WASTE_CATEGORY_LABELS
              ] || item.category || '-';
            return (
              <View key={item.id} style={styles.manifestCard}>
                <View style={styles.manifestHeader}>
                  <Text style={styles.manifestTps}>
                    {item.tps_name || item.tpsName || item.source_tps_id || item.sourceTpsId || 'TPS'}
                  </Text>
                  <View style={[styles.statusBadge, { backgroundColor: statusColor + '18' }]}>
                    <Text style={[styles.statusText, { color: statusColor }]}>
                      {STATUS_LABELS[item.status || ''] || item.status || '-'}
                    </Text>
                  </View>
                </View>
                <Text style={styles.manifestDetail}>
                  {catLabel} - {item.volume_kg || item.volumeKg || 0} kg
                </Text>
                <Text style={styles.manifestDate}>
                  {formatDate(item.checkpoint_at || item.checkpointAt || item.created_at || item.createdAt)}
                </Text>
              </View>
            );
          })
        )}
      </View>

      {/* Submit to TPST */}
      {manifest.length > 0 && (
        <View style={styles.section}>
          <TouchableOpacity
            style={[styles.submitTpstBtn, submittingManifest && styles.submitDisabled]}
            onPress={handleSubmitToTpst}
            disabled={submittingManifest}
          >
            {submittingManifest ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.submitTpstText}>Serahkan Manifest ke TPST</Text>
            )}
          </TouchableOpacity>
        </View>
      )}

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
  manifestCard: {
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
  manifestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  manifestTps: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    flex: 1,
    marginRight: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
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
    marginTop: 6,
  },
  manifestDate: {
    fontSize: 12,
    color: '#999',
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
  submitTpstBtn: {
    backgroundColor: '#52c41a',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  submitDisabled: {
    opacity: 0.6,
  },
  submitTpstText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
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
