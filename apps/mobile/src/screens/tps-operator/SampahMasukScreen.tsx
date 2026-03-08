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

const CATEGORIES = Object.values(WasteCategory);

interface DailySummary {
  total_kg: number;
  by_category: Record<string, number>;
}

export default function SampahMasukScreen() {
  const [tpsId, setTpsId] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<WasteCategory>(
    WasteCategory.ORGANIC,
  );
  const [volume, setVolume] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [summary, setSummary] = useState<DailySummary | null>(null);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [lastTpsId, setLastTpsId] = useState('');

  const fetchSummary = useCallback(async (id: string) => {
    if (!id.trim()) return;
    setLoadingSummary(true);
    try {
      const { data } = await api.get(`/tps/${id.trim()}`);
      const todayTotal = data.today_incoming_kg ?? data.todayIncomingKg ?? 0;
      const byCategory = data.today_incoming_by_category ?? data.todayIncomingByCategory ?? {};
      setSummary({ total_kg: todayTotal, by_category: byCategory });
    } catch {
      setSummary(null);
    } finally {
      setLoadingSummary(false);
    }
  }, []);

  useEffect(() => {
    if (tpsId.trim() && tpsId.trim() !== lastTpsId) {
      setLastTpsId(tpsId.trim());
      fetchSummary(tpsId.trim());
    }
  }, [tpsId, lastTpsId, fetchSummary]);

  const resetForm = () => {
    setSelectedCategory(WasteCategory.ORGANIC);
    setVolume('');
    setNotes('');
  };

  const handleSubmit = async () => {
    if (!tpsId.trim()) {
      Alert.alert('Peringatan', 'Masukkan ID TPS.');
      return;
    }
    if (!volume.trim() || isNaN(Number(volume)) || Number(volume) <= 0) {
      Alert.alert('Peringatan', 'Masukkan volume yang valid (dalam kg).');
      return;
    }

    setSubmitting(true);
    try {
      await api.post(`/tps/${tpsId.trim()}/record`, {
        direction: 'in',
        category: selectedCategory,
        volume_kg: Number(volume),
        notes: notes.trim() || undefined,
      });

      Alert.alert('Berhasil', 'Data sampah masuk berhasil dicatat.', [
        { text: 'OK', onPress: resetForm },
      ]);
      fetchSummary(tpsId.trim());
    } catch {
      Alert.alert('Error', 'Gagal menyimpan data. Silakan coba lagi.');
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
          <Text style={styles.headerTitle}>Sampah Masuk</Text>
          <Text style={styles.headerSub}>Catat sampah yang masuk ke TPS</Text>
        </View>

        {/* Today's Summary */}
        {summary && (
          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>Ringkasan Hari Ini</Text>
            <Text style={styles.summaryTotal}>
              Total Masuk: {summary.total_kg.toLocaleString('id-ID')} kg
            </Text>
            {Object.keys(summary.by_category).length > 0 && (
              <View style={styles.summaryBreakdown}>
                {Object.entries(summary.by_category).map(([cat, kg]) => (
                  <Text key={cat} style={styles.summaryItem}>
                    {WASTE_CATEGORY_LABELS[cat as WasteCategory] || cat}: {(kg as number).toLocaleString('id-ID')} kg
                  </Text>
                ))}
              </View>
            )}
          </View>
        )}
        {loadingSummary && (
          <View style={styles.summaryLoading}>
            <ActivityIndicator size="small" color="#1890ff" />
          </View>
        )}

        {/* TPS ID */}
        <View style={styles.section}>
          <Text style={styles.label}>ID TPS</Text>
          <TextInput
            style={styles.input}
            placeholder="Masukkan ID TPS Anda"
            value={tpsId}
            onChangeText={setTpsId}
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

        {/* Notes */}
        <View style={styles.section}>
          <Text style={styles.label}>Catatan</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Catatan tambahan (opsional)"
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
              <Text style={styles.submitText}>Catat Sampah Masuk</Text>
            )}
          </TouchableOpacity>
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
  summaryCard: {
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
  summaryTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  summaryTotal: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1890ff',
  },
  summaryBreakdown: {
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 8,
  },
  summaryItem: {
    fontSize: 13,
    color: '#666',
    marginBottom: 2,
  },
  summaryLoading: {
    paddingVertical: 12,
    alignItems: 'center',
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
  bottomSpacer: {
    height: 32,
  },
});
