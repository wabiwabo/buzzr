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
import { formatCurrency, formatDate } from '../../utils/format';
import { WasteCategory } from '@buzzr/shared-types';
import { WASTE_CATEGORY_LABELS } from '@buzzr/constants';

interface Transaction {
  id: string;
  category: string;
  volume_kg?: number;
  volumeKg?: number;
  price_per_kg?: number;
  pricePerKg?: number;
  total?: number;
  type?: string;
  created_at?: string;
  createdAt?: string;
}

export default function DompetScreen() {
  const user = useAuthStore((s) => s.user);
  const [balance, setBalance] = useState<number | null>(null);
  const [loadingBalance, setLoadingBalance] = useState(true);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loadingTx, setLoadingTx] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchBalance = useCallback(async () => {
    if (!user?.id) return;
    try {
      const { data } = await api.get(
        `/payments/bank-sampah/wallet/${user.id}`,
      );
      setBalance(data.balance ?? data.data?.balance ?? 0);
    } catch {
      setBalance(null);
    } finally {
      setLoadingBalance(false);
    }
  }, [user?.id]);

  const fetchTransactions = useCallback(async () => {
    try {
      const { data } = await api.get('/payments/bank-sampah/buy', {
        params: { limit: 20 },
      });
      const list = Array.isArray(data) ? data : data?.data || [];
      setTransactions(list);
    } catch {
      setTransactions([]);
    } finally {
      setLoadingTx(false);
    }
  }, []);

  const fetchAll = useCallback(async () => {
    await Promise.all([fetchBalance(), fetchTransactions()]);
    setRefreshing(false);
  }, [fetchBalance, fetchTransactions]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchAll();
  }, [fetchAll]);

  const handleRequestPayout = () => {
    Alert.alert(
      'Tarik Saldo',
      'Apakah Anda yakin ingin menarik saldo ke rekening Anda?',
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Konfirmasi',
          onPress: () => {
            Alert.alert(
              'Dalam Pengembangan',
              'Fitur penarikan saldo akan segera tersedia.',
            );
          },
        },
      ],
    );
  };

  const loading = loadingBalance && loadingTx;

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
        <Text style={styles.headerTitle}>Dompet</Text>
        <Text style={styles.headerSub}>Saldo dan riwayat transaksi</Text>
      </View>

      {/* Balance Card */}
      <View style={styles.balanceCard}>
        <Text style={styles.balanceLabel}>Saldo Anda</Text>
        {loadingBalance ? (
          <ActivityIndicator size="small" color="#1890ff" />
        ) : (
          <Text style={styles.balanceAmount}>
            {balance !== null ? formatCurrency(balance) : '-'}
          </Text>
        )}
        <TouchableOpacity
          style={styles.payoutBtn}
          onPress={handleRequestPayout}
          activeOpacity={0.8}
        >
          <Text style={styles.payoutBtnText}>Tarik Saldo</Text>
        </TouchableOpacity>
      </View>

      {/* Transaction History */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Riwayat Transaksi</Text>
        {loadingTx ? (
          <ActivityIndicator
            size="small"
            color="#1890ff"
            style={{ paddingVertical: 12 }}
          />
        ) : transactions.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>Belum ada transaksi</Text>
          </View>
        ) : (
          transactions.map((tx) => {
            const txVolume = tx.volume_kg ?? tx.volumeKg ?? 0;
            const txPrice = tx.price_per_kg ?? tx.pricePerKg ?? 0;
            const txTotal = tx.total ?? txVolume * txPrice;
            return (
              <View key={tx.id} style={styles.txCard}>
                <View style={styles.txRow}>
                  <Text style={styles.txCategory}>
                    {WASTE_CATEGORY_LABELS[tx.category as WasteCategory] ||
                      tx.category}
                  </Text>
                  {txTotal > 0 && (
                    <Text style={styles.txTotal}>
                      {formatCurrency(txTotal)}
                    </Text>
                  )}
                </View>
                <Text style={styles.txDetail}>
                  {txVolume} kg
                  {txPrice > 0 ? ` x ${formatCurrency(txPrice)}/kg` : ''}
                </Text>
                {(tx.created_at || tx.createdAt) && (
                  <Text style={styles.txDate}>
                    {formatDate(tx.created_at || tx.createdAt)}
                  </Text>
                )}
              </View>
            );
          })
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
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerSub: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.85)',
    marginTop: 4,
  },
  balanceCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: -12,
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  balanceLabel: {
    fontSize: 14,
    color: '#666',
  },
  balanceAmount: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1890ff',
    marginTop: 4,
  },
  payoutBtn: {
    backgroundColor: '#52c41a',
    borderRadius: 8,
    paddingHorizontal: 24,
    paddingVertical: 10,
    marginTop: 16,
  },
  payoutBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
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
  txCard: {
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
  txRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  txCategory: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  txTotal: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1890ff',
  },
  txDetail: {
    fontSize: 12,
    color: '#888',
    marginTop: 4,
  },
  txDate: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  bottomSpacer: {
    height: 32,
  },
});
