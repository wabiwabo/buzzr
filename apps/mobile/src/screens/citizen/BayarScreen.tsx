import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  Alert,
  Linking,
} from 'react-native';
import { PaymentStatus } from '@buzzr/shared-types';
import { PAYMENT_STATUS_LABELS } from '@buzzr/constants';
import api from '../../services/api';

interface Payment {
  id: string;
  description?: string;
  amount: number;
  status: PaymentStatus;
  payment_url?: string;
  paymentUrl?: string;
  due_date?: string;
  dueDate?: string;
  paid_at?: string;
  paidAt?: string;
  created_at?: string;
  createdAt?: string;
}

const formatCurrency = (amount: number): string => {
  return `Rp ${amount.toLocaleString('id-ID')}`;
};

const getStatusColor = (status: PaymentStatus): string => {
  switch (status) {
    case PaymentStatus.PENDING:
      return '#fa8c16';
    case PaymentStatus.PAID:
      return '#52c41a';
    case PaymentStatus.EXPIRED:
      return '#f5222d';
    case PaymentStatus.FAILED:
      return '#f5222d';
    case PaymentStatus.REFUNDED:
      return '#722ed1';
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

export default function BayarScreen() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchPayments = useCallback(async () => {
    try {
      const { data } = await api.get('/payments');
      const list = Array.isArray(data) ? data : data?.data || [];
      setPayments(list);
    } catch {
      Alert.alert('Error', 'Gagal memuat data pembayaran.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchPayments();
  }, [fetchPayments]);

  const handlePay = (payment: Payment) => {
    const url = payment.payment_url || payment.paymentUrl;
    if (url) {
      Linking.openURL(url).catch(() => {
        Alert.alert('Error', 'Tidak dapat membuka halaman pembayaran.');
      });
    } else {
      Alert.alert('Info', 'Link pembayaran belum tersedia.');
    }
  };

  const activePayments = payments.filter((p) => p.status === PaymentStatus.PENDING);
  const historyPayments = payments.filter((p) => p.status !== PaymentStatus.PENDING);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#1890ff" />
      </View>
    );
  }

  const renderPaymentCard = (payment: Payment, showPayButton = false) => {
    const statusColor = getStatusColor(payment.status);
    const dateStr =
      payment.status === PaymentStatus.PAID
        ? formatDate(payment.paid_at || payment.paidAt)
        : formatDate(payment.due_date || payment.dueDate || payment.created_at || payment.createdAt);

    return (
      <View key={payment.id} style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle} numberOfLines={2}>
            {payment.description || 'Tagihan Retribusi'}
          </Text>
          <View style={[styles.statusBadge, { backgroundColor: statusColor + '18' }]}>
            <Text style={[styles.statusText, { color: statusColor }]}>
              {PAYMENT_STATUS_LABELS[payment.status] || payment.status}
            </Text>
          </View>
        </View>
        <Text style={styles.amount}>{formatCurrency(payment.amount)}</Text>
        <Text style={styles.dateText}>{dateStr}</Text>
        {showPayButton && (
          <View style={styles.payBtnContainer}>
            <Text style={styles.payBtn} onPress={() => handlePay(payment)}>
              Bayar Sekarang
            </Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#1890ff']} />}
    >
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Pembayaran</Text>
        <Text style={styles.headerSub}>Kelola tagihan retribusi Anda</Text>
      </View>

      {/* Tagihan Aktif */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Tagihan Aktif</Text>
        {activePayments.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>Tidak ada tagihan aktif</Text>
          </View>
        ) : (
          activePayments.map((p) => renderPaymentCard(p, true))
        )}
      </View>

      {/* Riwayat Pembayaran */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Riwayat Pembayaran</Text>
        {historyPayments.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>Belum ada riwayat pembayaran</Text>
          </View>
        ) : (
          historyPayments.map((p) => renderPaymentCard(p))
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
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerSub: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.85)',
    marginTop: 4,
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
  card: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 14,
    marginBottom: 10,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  cardTitle: {
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
  amount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1890ff',
    marginTop: 8,
  },
  dateText: {
    fontSize: 12,
    color: '#888',
    marginTop: 4,
  },
  payBtnContainer: {
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 12,
  },
  payBtn: {
    color: '#1890ff',
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
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
