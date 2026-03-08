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
import { ComplaintStatus } from '@buzzr/shared-types';
import { COMPLAINT_STATUS_LABELS } from '@buzzr/constants';
import { ROLE_LABELS } from '@buzzr/constants';
import api from '../../services/api';
import { useAuthStore } from '../../stores/auth.store';

interface Complaint {
  id: string;
  category: string;
  description?: string;
  status: ComplaintStatus;
  created_at?: string;
  createdAt?: string;
}

const CATEGORY_LABELS: Record<string, string> = {
  illegal_dumping: 'Sampah Liar',
  tps_full: 'TPS Penuh',
  missed_pickup: 'Tidak Diangkut',
  other: 'Lainnya',
};

const getComplaintStatusColor = (status: ComplaintStatus): string => {
  switch (status) {
    case ComplaintStatus.SUBMITTED:
      return '#fa8c16';
    case ComplaintStatus.VERIFIED:
      return '#1890ff';
    case ComplaintStatus.ASSIGNED:
      return '#722ed1';
    case ComplaintStatus.IN_PROGRESS:
      return '#13c2c2';
    case ComplaintStatus.RESOLVED:
      return '#52c41a';
    case ComplaintStatus.REJECTED:
      return '#f5222d';
    default:
      return '#999';
  }
};

const formatDate = (dateStr?: string): string => {
  if (!dateStr) return '-';
  try {
    return new Date(dateStr).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
};

export default function ProfilScreen() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const [points, setPoints] = useState<number>(0);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [pointsRes, complaintsRes] = await Promise.all([
        api.get('/payments/bank-sampah/reward/points').catch(() => ({ data: { points: 0 } })),
        api
          .get('/complaints', { params: { reporter_id: user?.id } })
          .catch(() => ({ data: [] })),
      ]);

      const pts =
        typeof pointsRes.data === 'number'
          ? pointsRes.data
          : pointsRes.data?.points ?? pointsRes.data?.data?.points ?? 0;
      setPoints(pts);

      const list = Array.isArray(complaintsRes.data)
        ? complaintsRes.data
        : complaintsRes.data?.data || [];
      setComplaints(list);
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
    ROLE_LABELS[user?.role as keyof typeof ROLE_LABELS] || user?.role || 'Pengguna';

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#1890ff']} />}
    >
      {/* User Info Card */}
      <View style={styles.profileHeader}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {(user?.name || 'U').charAt(0).toUpperCase()}
          </Text>
        </View>
        <Text style={styles.userName}>{user?.name || 'Pengguna'}</Text>
        <Text style={styles.userRole}>{roleLabel}</Text>
      </View>

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

      {/* Points */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Poin Reward</Text>
        <View style={styles.pointsCard}>
          <Text style={styles.pointsValue}>{points.toLocaleString('id-ID')}</Text>
          <Text style={styles.pointsLabel}>poin</Text>
        </View>
      </View>

      {/* Complaint History */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Riwayat Laporan</Text>
        {complaints.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>Belum ada laporan</Text>
          </View>
        ) : (
          complaints.map((complaint) => {
            const statusColor = getComplaintStatusColor(complaint.status);
            return (
              <View key={complaint.id} style={styles.complaintCard}>
                <View style={styles.complaintHeader}>
                  <Text style={styles.complaintCategory}>
                    {CATEGORY_LABELS[complaint.category] || complaint.category}
                  </Text>
                  <View style={[styles.statusBadge, { backgroundColor: statusColor + '18' }]}>
                    <Text style={[styles.statusText, { color: statusColor }]}>
                      {COMPLAINT_STATUS_LABELS[complaint.status] || complaint.status}
                    </Text>
                  </View>
                </View>
                {complaint.description && (
                  <Text style={styles.complaintDesc} numberOfLines={2}>
                    {complaint.description}
                  </Text>
                )}
                <Text style={styles.complaintDate}>
                  {formatDate(complaint.created_at || complaint.createdAt)}
                </Text>
              </View>
            );
          })
        )}
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
  pointsCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  pointsValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1890ff',
  },
  pointsLabel: {
    fontSize: 16,
    color: '#888',
    marginLeft: 6,
  },
  complaintCard: {
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
  complaintHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  complaintCategory: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
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
  complaintDesc: {
    fontSize: 13,
    color: '#666',
    marginTop: 6,
  },
  complaintDate: {
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
