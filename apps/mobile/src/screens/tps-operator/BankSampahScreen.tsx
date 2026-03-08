import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { WasteCategory } from '@buzzr/shared-types';
import { WASTE_CATEGORY_LABELS } from '@buzzr/constants';
import api from '../../services/api';
import { useAuthStore } from '../../stores/auth.store';
import { formatCurrency } from '../../utils/format';

const CATEGORIES = Object.values(WasteCategory);

interface Transaction {
  id: string;
  seller_id?: string;
  sellerId?: string;
  category: string;
  volume_kg?: number;
  volumeKg?: number;
  price_per_kg?: number;
  pricePerKg?: number;
  total?: number;
  created_at?: string;
  createdAt?: string;
}

export default function BankSampahScreen() {
  const user = useAuthStore((s) => s.user);
  const [sellerId, setSellerId] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<WasteCategory>(
    WasteCategory.RECYCLABLE,
  );
  const [volume, setVolume] = useState('');
  const [pricePerKg, setPricePerKg] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [walletBalance, setWalletBalance] = useState<number | null>(null);
  const [loadingWallet, setLoadingWallet] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loadingTransactions, setLoadingTransactions] = useState(false);

  const calculatedTotal =
    volume && pricePerKg && !isNaN(Number(volume)) && !isNaN(Number(pricePerKg))
      ? Number(volume) * Number(pricePerKg)
      : 0;

  const fetchWallet = useCallback(async () => {
    if (!user?.id) return;
    setLoadingWallet(true);
    try {
      const { data } = await api.get(`/payments/bank-sampah/wallet/${user.id}`);
      setWalletBalance(data.balance ?? data.data?.balance ?? 0);
    } catch {
      setWalletBalance(null);
    } finally {
      setLoadingWallet(false);
    }
  }, [user?.id]);

  const fetchTransactions = useCallback(async () => {
    setLoadingTransactions(true);
    try {
      const { data } = await api.get('/payments/bank-sampah/buy', {
        params: { limit: 10 },
      });
      const list = Array.isArray(data) ? data : data?.data || [];
      setTransactions(list);
    } catch {
      setTransactions([]);
    } finally {
      setLoadingTransactions(false);
    }
  }, []);

  useEffect(() => {
    fetchWallet();
    fetchTransactions();
  }, [fetchWallet, fetchTransactions]);

  const resetForm = () => {
    setSellerId('');
    setSelectedCategory(WasteCategory.RECYCLABLE);
    setVolume('');
    setPricePerKg('');
  };

  const handleSubmit = async () => {
    if (!sellerId.trim()) {
      Alert.alert('Peringatan', 'Masukkan ID Pemulung.');
      return;
    }
    if (!volume.trim() || isNaN(Number(volume)) || Number(volume) <= 0) {
      Alert.alert('Peringatan', 'Masukkan volume yang valid (dalam kg).');
      return;
    }
    if (!pricePerKg.trim() || isNaN(Number(pricePerKg)) || Number(pricePerKg) <= 0) {
      Alert.alert('Peringatan', 'Masukkan harga per kg yang valid.');
      return;
    }

    setSubmitting(true);
    try {
      await api.post('/payments/bank-sampah/buy', {
        seller_id: sellerId.trim(),
        category: selectedCategory,
        volume_kg: Number(volume),
        price_per_kg: Number(pricePerKg),
      });

      Alert.alert(
        'Berhasil',
        `Pembelian berhasil. Total: ${formatCurrency(calculatedTotal)}`,
        [{ text: 'OK', onPress: resetForm }],
      );
      fetchWallet();
      fetchTransactions();
    } catch {
      Alert.alert('Error', 'Gagal menyimpan transaksi. Silakan coba lagi.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Bank Sampah</Text>
          <Text style={styles.headerSub}>Beli sampah daur ulang dari pemulung</Text>
        </View>

        {/* Wallet Balance */}
        <View style={styles.walletCard}>
          <Text style={styles.walletLabel}>Saldo Wallet</Text>
          {loadingWallet ? (
            <ActivityIndicator size="small" color="#1890ff" />
          ) : (
            <Text style={styles.walletBalance}>
              {walletBalance !== null ? formatCurrency(walletBalance) : '-'}
            </Text>
          )}
        </View>

        {/* Seller ID */}
        <View style={styles.section}>
          <Text style={styles.label}>ID Pemulung</Text>
          <TextInput
            style={styles.input}
            placeholder="Masukkan ID atau nomor HP pemulung"
            value={sellerId}
            onChangeText={setSellerId}
            placeholderTextColor="#bbb"
            autoCapitalize="none"
          />
        </View>

        {/* Waste Category */}
        <View style={styles.section}>
          <Text style={styles.label}>Kategori Sampah</Text>
          <View style={styles.categoryContainer}>
            {CATEGORIES.map((cat) => (
              <TouchableOpacity
                key={cat}
                style={[
                  styles.categoryChip,
                  selectedCategory === cat && styles.categoryChipActive,
                ]}
                onPress={() => setSelectedCategory(cat)}
              >
                <Text
                  style={[
                    styles.categoryText,
                    selectedCategory === cat && styles.categoryTextActive,
                  ]}
                >
                  {WASTE_CATEGORY_LABELS[cat]}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Volume */}
        <View style={styles.section}>
          <Text style={styles.label}>Volume (kg)</Text>
          <TextInput
            style={styles.input}
            placeholder="Masukkan berat dalam kg"
            value={volume}
            onChangeText={setVolume}
            keyboardType="numeric"
            placeholderTextColor="#bbb"
          />
        </View>

        {/* Price per kg */}
        <View style={styles.section}>
          <Text style={styles.label}>Harga per kg (Rp)</Text>
          <TextInput
            style={styles.input}
            placeholder="Masukkan harga per kg"
            value={pricePerKg}
            onChangeText={setPricePerKg}
            keyboardType="numeric"
            placeholderTextColor="#bbb"
          />
        </View>

        {/* Calculated Total */}
        {calculatedTotal > 0 && (
          <View style={styles.totalCard}>
            <Text style={styles.totalLabel}>Total Pembayaran</Text>
            <Text style={styles.totalAmount}>{formatCurrency(calculatedTotal)}</Text>
            <Text style={styles.totalDetail}>
              {Number(volume).toLocaleString('id-ID')} kg x {formatCurrency(Number(pricePerKg))}
            </Text>
          </View>
        )}

        {/* Submit */}
        <View style={styles.section}>
          <TouchableOpacity
            style={[styles.submitButton, submitting && styles.submitDisabled]}
            onPress={handleSubmit}
            disabled={submitting}
            activeOpacity={0.8}
          >
            {submitting ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.submitText}>Beli Sampah</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Recent Transactions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Transaksi Terakhir</Text>
          {loadingTransactions ? (
            <ActivityIndicator size="small" color="#1890ff" style={{ paddingVertical: 12 }} />
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
                      {WASTE_CATEGORY_LABELS[tx.category as WasteCategory] || tx.category}
                    </Text>
                    <Text style={styles.txTotal}>{formatCurrency(txTotal)}</Text>
                  </View>
                  <Text style={styles.txDetail}>
                    {txVolume} kg x {formatCurrency(txPrice)}/kg
                  </Text>
                </View>
              );
            })
          )}
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
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
  walletCard: {
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
  walletLabel: {
    fontSize: 14,
    color: '#666',
  },
  walletBalance: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1890ff',
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
  categoryContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryChip: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#d9d9d9',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  categoryChipActive: {
    backgroundColor: '#1890ff',
    borderColor: '#1890ff',
  },
  categoryText: {
    fontSize: 13,
    color: '#666',
    fontWeight: '500',
  },
  categoryTextActive: {
    color: '#fff',
  },
  totalCard: {
    backgroundColor: '#e6f7ff',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#91d5ff',
  },
  totalLabel: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  totalAmount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1890ff',
    marginTop: 4,
  },
  totalDetail: {
    fontSize: 13,
    color: '#666',
    marginTop: 4,
  },
  submitButton: {
    backgroundColor: '#1890ff',
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  submitDisabled: {
    opacity: 0.6,
  },
  submitText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
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
  bottomSpacer: {
    height: 32,
  },
});
