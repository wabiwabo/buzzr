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
  Image,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { WasteCategory } from '@buzzr/shared-types';
import { WASTE_CATEGORY_LABELS } from '@buzzr/constants';
import api from '../../services/api';

const CATEGORIES = Object.values(WasteCategory);

export default function CheckpointScreen() {
  const [tpsId, setTpsId] = useState('');
  const [vehicleId, setVehicleId] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<WasteCategory>(
    WasteCategory.ORGANIC,
  );
  const [volume, setVolume] = useState('');
  const [notes, setNotes] = useState('');
  const [photo, setPhoto] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const takePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Izin Ditolak',
          'Izin kamera diperlukan untuk mengambil foto.',
        );
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: 'images',
        quality: 0.7,
        allowsEditing: false,
      });

      if (!result.canceled && result.assets.length > 0) {
        setPhoto(result.assets[0].uri);
      }
    } catch {
      Alert.alert('Error', 'Gagal mengambil foto.');
    }
  };

  const resetForm = () => {
    setTpsId('');
    setVehicleId('');
    setSelectedCategory(WasteCategory.ORGANIC);
    setVolume('');
    setNotes('');
    setPhoto(null);
  };

  const handleSubmit = async () => {
    if (!tpsId.trim()) {
      Alert.alert('Peringatan', 'Masukkan ID TPS.');
      return;
    }
    if (!vehicleId.trim()) {
      Alert.alert('Peringatan', 'Masukkan ID Kendaraan.');
      return;
    }
    if (!volume.trim() || isNaN(Number(volume)) || Number(volume) <= 0) {
      Alert.alert('Peringatan', 'Masukkan volume yang valid (dalam kg).');
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('source_tps_id', tpsId.trim());
      formData.append('vehicle_id', vehicleId.trim());
      formData.append('category', selectedCategory);
      formData.append('volume_kg', String(Number(volume)));
      if (notes.trim()) formData.append('notes', notes.trim());
      if (photo) {
        const filename = photo.split('/').pop() || 'checkpoint.jpg';
        const ext = filename.split('.').pop()?.toLowerCase() || 'jpg';
        formData.append('photo', {
          uri: photo,
          name: filename,
          type: `image/${ext === 'jpg' ? 'jpeg' : ext}`,
        } as any);
      }
      await api.post('/transfer', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      Alert.alert('Berhasil', 'Data checkpoint berhasil disimpan.', [
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
          <Text style={styles.headerTitle}>Checkpoint</Text>
          <Text style={styles.headerSub}>Catat pengambilan sampah di TPS</Text>
        </View>

        {/* TPS ID */}
        <View style={styles.section}>
          <Text style={styles.label}>ID TPS</Text>
          <TextInput
            style={styles.input}
            placeholder="Masukkan atau scan ID TPS"
            value={tpsId}
            onChangeText={setTpsId}
            placeholderTextColor="#bbb"
            autoCapitalize="none"
          />
        </View>

        {/* Vehicle ID */}
        <View style={styles.section}>
          <Text style={styles.label}>ID Kendaraan</Text>
          <TextInput
            style={styles.input}
            placeholder="Masukkan ID kendaraan"
            value={vehicleId}
            onChangeText={setVehicleId}
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

        {/* Photo */}
        <View style={styles.section}>
          <Text style={styles.label}>Foto</Text>
          {photo ? (
            <View style={styles.photoPreviewContainer}>
              <Image source={{ uri: photo }} style={styles.photoPreview} />
              <TouchableOpacity
                style={styles.retakeButton}
                onPress={takePhoto}
              >
                <Text style={styles.retakeText}>Ambil Ulang</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity style={styles.photoButton} onPress={takePhoto}>
              <Text style={styles.photoButtonText}>Ambil Foto</Text>
            </TouchableOpacity>
          )}
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
              <Text style={styles.submitText}>Simpan Checkpoint</Text>
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
  photoButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#1890ff',
    borderRadius: 8,
    borderStyle: 'dashed',
    paddingVertical: 24,
    alignItems: 'center',
  },
  photoButtonText: {
    color: '#1890ff',
    fontSize: 15,
    fontWeight: '600',
  },
  photoPreviewContainer: {
    alignItems: 'center',
  },
  photoPreview: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    backgroundColor: '#e8e8e8',
  },
  retakeButton: {
    marginTop: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  retakeText: {
    color: '#1890ff',
    fontSize: 14,
    fontWeight: '500',
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
