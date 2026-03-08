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
import { formatCurrency, formatDate } from '../../utils/format';

const CATEGORIES = Object.values(WasteCategory);

interface DepositRecord {
  id: string;
  category: string;
  volume_kg?: number;
  volumeKg?: number;
  price_per_kg?: number;
  pricePerKg?: number;
  total?: number;
  notes?: string;
  created_at?: string;
  createdAt?: string;
}

export default function SetorScreen() {
  const [selectedCategory, setSelectedCategory] = useState<WasteCategory>(
    WasteCategory.RECYCLABLE,
  );
  const [volume, setVolume] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [deposits, setDeposits] = useState<DepositRecord[]>([]);
  const [loadingDeposits, setLoadingDeposits] = useState(false);

  const fetchDeposits = useCallback(async () => {
    setLoadingDeposits(true);
    try {
      const { data } = await api.get('/payments/bank-sampah/buy', {
        params: { limit: 10 },
      });
      const list = Array.isArray(data) ? data : data?.data || [];
      setDeposits(list);
    } catch {
      setDeposits([]);
    } finally {
      setLoadingDeposits(false);
    }
  }, []);

  useEffect(() => {
    fetchDeposits();
  }, [fetchDeposits]);

  const resetForm = () => {
    setSelectedCategory(WasteCategory.RECYCLABLE);
    setVolume('');
    setNotes('');
  };

  const handleSubmit = async () => {
    if (!volume.trim() || isNaN(Number(volume)) || Number(volume) <= 0) {
      Alert.alert('Peringatan', 'Masukkan volume yang valid (dalam kg).');
      return;
    }

    setSubmitting(true);
    try {
      await api.post('/payments/bank-sampah/buy', {
        category: selectedCategory,
        volume_kg: Number(volume),
        notes: notes.trim() || undefined,
      });

      Alert.alert('Berhasil', 'Setoran sampah berhasil dicatat.', [
        { text: 'OK', onPress: resetForm },
      ]);
      fetchDeposits();
    } catch {
      Alert.alert('Error', 'Gagal menyimpan setoran. Silakan coba lagi.');
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
          <Text style={styles.headerTitle}>Setor Sampah</Text>
          <Text style={styles.headerSub}>
            Setor sampah daur ulang ke bank sampah
          </Text>
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

        {/* Notes */}
        <View style={styles.section}>
          <Text style={styles.label}>Catatan (opsional)</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Catatan tambahan"
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
            placeholderTextColor="#bbb"
          />
        </View>

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
              <Text style={styles.submitText}>Setor Sampah</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Deposit History */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Riwayat Setoran</Text>
          {loadingDeposits ? (
            <ActivityIndicator
              size="small"
              color="#1890ff"
              style={{ paddingVertical: 12 }}
            />
          ) : deposits.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyText}>Belum ada setoran</Text>
            </View>
          ) : (
            deposits.map((dep) => {
              const depVolume = dep.volume_kg ?? dep.volumeKg ?? 0;
              const depPrice = dep.price_per_kg ?? dep.pricePerKg ?? 0;
              const depTotal = dep.total ?? depVolume * depPrice;
              return (
                <View key={dep.id} style={styles.txCard}>
                  <View style={styles.txRow}>
                    <Text style={styles.txCategory}>
                      {WASTE_CATEGORY_LABELS[
                        dep.category as WasteCategory
                      ] || dep.category}
                    </Text>
                    {depTotal > 0 && (
                      <Text style={styles.txTotal}>
                        {formatCurrency(depTotal)}
                      </Text>
                    )}
                  </View>
                  <Text style={styles.txDetail}>{depVolume} kg</Text>
                  {(dep.created_at || dep.createdAt) && (
                    <Text style={styles.txDate}>
                      {formatDate(dep.created_at || dep.createdAt)}
                    </Text>
                  )}
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
  textArea: {
    minHeight: 80,
    paddingTop: 12,
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
  txDate: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  bottomSpacer: {
    height: 32,
  },
});
