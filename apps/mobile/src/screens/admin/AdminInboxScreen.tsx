import React, { useCallback, useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, RefreshControl, TouchableOpacity,
  Alert, ActivityIndicator, Modal,
} from 'react-native';
import api from '../../services/api';

interface Complaint {
  id: string;
  description: string;
  category: string;
  status: string;
  address: string;
  reporter_name: string;
  created_at: string;
}

const STATUS_LABELS: Record<string, string> = {
  submitted: 'Baru', verified: 'Terverifikasi', assigned: 'Ditugaskan',
  in_progress: 'Berjalan', resolved: 'Selesai', rejected: 'Ditolak',
};
const STATUS_COLOR: Record<string, string> = {
  submitted: '#EF4444', verified: '#3B82F6', assigned: '#3B82F6',
  in_progress: '#F59E0B', resolved: '#22C55E', rejected: '#6B7280',
};
const TRANSITIONS: Record<string, string[]> = {
  submitted: ['verified', 'rejected'],
  verified: ['assigned', 'rejected'],
  assigned: ['in_progress'],
  in_progress: ['resolved', 'rejected'],
  resolved: [],
  rejected: [],
};

const STATUS_FILTERS = [
  { value: '', label: 'Semua' },
  { value: 'submitted', label: 'Baru' },
  { value: 'verified', label: 'Verifikasi' },
  { value: 'assigned', label: 'Ditugaskan' },
  { value: 'in_progress', label: 'Berjalan' },
  { value: 'resolved', label: 'Selesai' },
];

export default function AdminInboxScreen() {
  const [items, setItems] = useState<Complaint[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selected, setSelected] = useState<Complaint | null>(null);
  const [updating, setUpdating] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const filters = statusFilter ? JSON.stringify({ 'c.status': statusFilter }) : undefined;
      const { data } = await api.get('/complaints/paginated', {
        params: { page: 1, limit: 50, sort: 'c.created_at', order: 'desc', filters },
      });
      setItems(Array.isArray(data?.data) ? data.data : []);
    } catch {
      // ignore — table can stay empty if fetch fails
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [statusFilter]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const onRefresh = useCallback(() => { setRefreshing(true); fetchData(); }, [fetchData]);

  const handleStatusChange = async (id: string, status: string) => {
    setUpdating(true);
    try {
      await api.patch(`/complaints/${id}/status`, { status });
      Alert.alert('Berhasil', `Status diubah ke ${STATUS_LABELS[status] || status}`);
      setSelected(null);
      fetchData();
    } catch {
      Alert.alert('Gagal', 'Tidak dapat mengubah status.');
    } finally {
      setUpdating(false);
    }
  };

  const formatDate = (s: string) => {
    const d = new Date(s);
    return d.toLocaleString('id-ID', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
  };

  if (loading) {
    return <View style={styles.centered}><ActivityIndicator size="large" color="#1890ff" /></View>;
  }

  const renderItem = ({ item }: { item: Complaint }) => (
    <TouchableOpacity style={styles.card} onPress={() => setSelected(item)}>
      <View style={styles.cardRow}>
        <Text style={styles.cardCategory}>{item.category.replace(/_/g, ' ').toUpperCase()}</Text>
        <View style={[styles.badge, { backgroundColor: STATUS_COLOR[item.status] || '#888' }]}>
          <Text style={styles.badgeText}>{STATUS_LABELS[item.status] || item.status}</Text>
        </View>
      </View>
      <Text style={styles.cardDesc} numberOfLines={2}>{item.description}</Text>
      <View style={styles.cardRow}>
        <Text style={styles.cardMeta}>{item.reporter_name}</Text>
        <Text style={styles.cardMeta}>{formatDate(item.created_at)}</Text>
      </View>
      {item.address && <Text style={styles.cardAddress} numberOfLines={1}>{item.address}</Text>}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Inbox Pengaduan</Text>
        <Text style={styles.headerSub}>{items.length} laporan</Text>
      </View>

      <View style={styles.filterBar}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={STATUS_FILTERS}
          keyExtractor={(f) => f.value || 'all'}
          renderItem={({ item: f }) => {
            const active = statusFilter === f.value;
            return (
              <TouchableOpacity
                style={[styles.filterChip, active && styles.filterChipActive]}
                onPress={() => setStatusFilter(f.value)}
              >
                <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>
                  {f.label}
                </Text>
              </TouchableOpacity>
            );
          }}
          contentContainerStyle={{ paddingHorizontal: 12 }}
        />
      </View>

      <FlatList
        data={items}
        keyExtractor={(c) => c.id}
        renderItem={renderItem}
        contentContainerStyle={{ padding: 12 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#1890ff']} />}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>Tidak ada laporan</Text>
          </View>
        }
      />

      {/* Detail modal */}
      <Modal visible={!!selected} animationType="slide" transparent onRequestClose={() => setSelected(null)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Detail Pengaduan</Text>
              <TouchableOpacity onPress={() => setSelected(null)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>
            {selected && (
              <View>
                <Text style={styles.detailLabel}>Kategori</Text>
                <Text style={styles.detailValue}>{selected.category.replace(/_/g, ' ').toUpperCase()}</Text>

                <Text style={styles.detailLabel}>Status</Text>
                <View style={[styles.badge, { backgroundColor: STATUS_COLOR[selected.status] || '#888', alignSelf: 'flex-start' }]}>
                  <Text style={styles.badgeText}>{STATUS_LABELS[selected.status] || selected.status}</Text>
                </View>

                <Text style={styles.detailLabel}>Deskripsi</Text>
                <Text style={styles.detailValue}>{selected.description}</Text>

                <Text style={styles.detailLabel}>Lokasi</Text>
                <Text style={styles.detailValue}>{selected.address || '-'}</Text>

                <Text style={styles.detailLabel}>Pelapor</Text>
                <Text style={styles.detailValue}>{selected.reporter_name}</Text>

                <Text style={styles.detailLabel}>Tanggal</Text>
                <Text style={styles.detailValue}>{formatDate(selected.created_at)}</Text>

                {TRANSITIONS[selected.status]?.length > 0 && (
                  <>
                    <Text style={styles.detailLabel}>Aksi</Text>
                    <View style={styles.actionRow}>
                      {TRANSITIONS[selected.status].map((next) => (
                        <TouchableOpacity
                          key={next}
                          style={[styles.actionButton, { backgroundColor: STATUS_COLOR[next] || '#1890ff' }]}
                          onPress={() => handleStatusChange(selected.id, next)}
                          disabled={updating}
                        >
                          <Text style={styles.actionButtonText}>{STATUS_LABELS[next] || next}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </>
                )}
              </View>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { backgroundColor: '#1890ff', paddingHorizontal: 20, paddingVertical: 16 },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#fff' },
  headerSub: { fontSize: 13, color: 'rgba(255,255,255,0.85)', marginTop: 2 },
  filterBar: { backgroundColor: '#fff', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  filterChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 14, marginHorizontal: 4, backgroundColor: '#f0f0f0' },
  filterChipActive: { backgroundColor: '#1890ff' },
  filterChipText: { fontSize: 12, color: '#666' },
  filterChipTextActive: { color: '#fff', fontWeight: '600' },
  card: { backgroundColor: '#fff', borderRadius: 8, padding: 12, marginBottom: 8 },
  cardRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  cardCategory: { fontSize: 11, fontWeight: '600', color: '#888' },
  cardDesc: { fontSize: 14, color: '#333', marginBottom: 8 },
  cardMeta: { fontSize: 11, color: '#999' },
  cardAddress: { fontSize: 11, color: '#aaa', marginTop: 4 },
  badge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  badgeText: { fontSize: 10, color: '#fff', fontWeight: '600' },
  emptyState: { padding: 40, alignItems: 'center' },
  emptyText: { color: '#999' },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalCard: { backgroundColor: '#fff', borderTopLeftRadius: 16, borderTopRightRadius: 16, padding: 20, maxHeight: '85%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  modalTitle: { fontSize: 18, fontWeight: 'bold' },
  modalClose: { fontSize: 20, color: '#999', paddingHorizontal: 8 },
  detailLabel: { fontSize: 12, color: '#888', marginTop: 12, marginBottom: 4 },
  detailValue: { fontSize: 14, color: '#333' },
  actionRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
  actionButton: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 8 },
  actionButtonText: { color: '#fff', fontWeight: '600', fontSize: 13 },
});
