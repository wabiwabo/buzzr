import React, { useState } from 'react';
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

export default function SampahKeluarScreen() {
  const [tpsId, setTpsId] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<WasteCategory>(
    WasteCategory.ORGANIC,
  );
  const [volume, setVolume] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

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
        direction: 'out',
        category: selectedCategory,
        volume_kg: Number(volume),
        notes: notes.trim() || undefined,
      });

      Alert.alert('Berhasil', 'Data sampah keluar berhasil dicatat.', [
        { text: 'OK', onPress: resetForm },
      ]);
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
          <Text style={styles.headerTitle}>Sampah Keluar</Text>
          <Text style={styles.headerSub}>Catat sampah yang keluar dari TPS ke truk</Text>
        </View>

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
              <Text style={styles.submitText}>Catat Sampah Keluar</Text>
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
