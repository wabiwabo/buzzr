import React, { useEffect, useState } from 'react';
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
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { ComplaintCategory } from '@buzzr/shared-types';
import { COMPLAINT_CATEGORY_LABELS } from '@buzzr/constants';
import api from '../../services/api';

const CATEGORIES = Object.values(ComplaintCategory);

export default function LaporScreen() {
  const [category, setCategory] = useState<ComplaintCategory | null>(null);
  const [description, setDescription] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [address, setAddress] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [locationLoading, setLocationLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Izin Lokasi', 'Izin akses lokasi diperlukan untuk melaporkan masalah.');
          setLocationLoading(false);
          return;
        }
        const loc = await Location.getCurrentPositionAsync({});
        setLatitude(loc.coords.latitude);
        setLongitude(loc.coords.longitude);

        const reverseGeocode = await Location.reverseGeocodeAsync({
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
        });
        if (reverseGeocode.length > 0) {
          const addr = reverseGeocode[0];
          const parts = [addr.street, addr.subregion, addr.city, addr.region].filter(Boolean);
          setAddress(parts.join(', '));
        }
      } catch {
        Alert.alert('Error', 'Gagal mendapatkan lokasi.');
      } finally {
        setLocationLoading(false);
      }
    })();
  }, []);

  const pickImage = () => {
    Alert.alert('Pilih Sumber', 'Ambil foto dari:', [
      {
        text: 'Kamera',
        onPress: async () => {
          try {
            const perm = await ImagePicker.requestCameraPermissionsAsync();
            if (!perm.granted) {
              Alert.alert('Izin Kamera', 'Izin akses kamera diperlukan.');
              return;
            }
            const result = await ImagePicker.launchCameraAsync({
              allowsEditing: true,
              quality: 0.7,
            });
            if (!result.canceled && result.assets.length > 0) {
              setImageUri(result.assets[0].uri);
            }
          } catch {
            Alert.alert('Error', 'Gagal mengambil foto.');
          }
        },
      },
      {
        text: 'Galeri',
        onPress: async () => {
          try {
            const result = await ImagePicker.launchImageLibraryAsync({
              mediaTypes: ImagePicker.MediaTypeOptions.Images,
              allowsEditing: true,
              quality: 0.7,
            });
            if (!result.canceled && result.assets.length > 0) {
              setImageUri(result.assets[0].uri);
            }
          } catch {
            Alert.alert('Error', 'Gagal memilih gambar.');
          }
        },
      },
      { text: 'Batal', style: 'cancel' },
    ]);
  };

  const resetForm = () => {
    setCategory(null);
    setDescription('');
    setImageUri(null);
  };

  const handleSubmit = async () => {
    if (!category) {
      Alert.alert('Peringatan', 'Pilih kategori laporan.');
      return;
    }
    if (!description.trim()) {
      Alert.alert('Peringatan', 'Masukkan deskripsi laporan.');
      return;
    }
    if (latitude === null || longitude === null) {
      Alert.alert('Peringatan', 'Lokasi belum tersedia. Pastikan GPS aktif.');
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('category', category);
      formData.append('description', description.trim());
      formData.append('latitude', String(latitude));
      formData.append('longitude', String(longitude));
      if (address) formData.append('address', address);
      if (imageUri) {
        const filename = imageUri.split('/').pop() || 'photo.jpg';
        const ext = filename.split('.').pop()?.toLowerCase() || 'jpg';
        formData.append('photo', {
          uri: imageUri,
          name: filename,
          type: `image/${ext === 'jpg' ? 'jpeg' : ext}`,
        } as any);
      }
      await api.post('/complaints', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      Alert.alert('Berhasil', 'Laporan Anda telah terkirim. Terima kasih!', [
        { text: 'OK', onPress: resetForm },
      ]);
    } catch {
      Alert.alert('Error', 'Gagal mengirim laporan. Silakan coba lagi.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Buat Laporan</Text>
        <Text style={styles.headerSub}>Laporkan masalah persampahan di sekitar Anda</Text>
      </View>

      {/* Category Picker */}
      <View style={styles.section}>
        <Text style={styles.label}>Kategori</Text>
        <View style={styles.categoryGrid}>
          {CATEGORIES.map((cat) => (
            <TouchableOpacity
              key={cat}
              style={[styles.categoryBtn, category === cat && styles.categoryBtnActive]}
              onPress={() => setCategory(cat)}
            >
              <Text style={[styles.categoryText, category === cat && styles.categoryTextActive]}>
                {COMPLAINT_CATEGORY_LABELS[cat]}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Description */}
      <View style={styles.section}>
        <Text style={styles.label}>Deskripsi</Text>
        <TextInput
          style={styles.textArea}
          placeholder="Jelaskan masalah yang Anda temukan..."
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
        />
      </View>

      {/* Image Picker */}
      <View style={styles.section}>
        <Text style={styles.label}>Foto (Opsional)</Text>
        <TouchableOpacity style={styles.imagePickerBtn} onPress={pickImage}>
          <Text style={styles.imagePickerText}>
            {imageUri ? 'Ganti Foto' : 'Pilih Foto'}
          </Text>
        </TouchableOpacity>
        {imageUri && (
          <Image source={{ uri: imageUri }} style={styles.previewImage} resizeMode="cover" />
        )}
      </View>

      {/* Location */}
      <View style={styles.section}>
        <Text style={styles.label}>Lokasi</Text>
        {locationLoading ? (
          <View style={styles.locationLoading}>
            <ActivityIndicator size="small" color="#1890ff" />
            <Text style={styles.locationLoadingText}>Mendeteksi lokasi...</Text>
          </View>
        ) : latitude !== null && longitude !== null ? (
          <View style={styles.locationCard}>
            <Text style={styles.locationCoords}>
              {latitude.toFixed(6)}, {longitude.toFixed(6)}
            </Text>
            {address ? <Text style={styles.locationAddress}>{address}</Text> : null}
          </View>
        ) : (
          <Text style={styles.locationError}>Lokasi tidak tersedia</Text>
        )}
      </View>

      {/* Submit */}
      <View style={styles.section}>
        <TouchableOpacity
          style={[styles.submitBtn, submitting && styles.submitBtnDisabled]}
          onPress={handleSubmit}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitBtnText}>Kirim Laporan</Text>
          )}
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
    marginTop: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#fff',
  },
  categoryBtnActive: {
    backgroundColor: '#1890ff',
    borderColor: '#1890ff',
  },
  categoryText: {
    fontSize: 13,
    color: '#333',
  },
  categoryTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  textArea: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    minHeight: 100,
  },
  imagePickerBtn: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#1890ff',
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
    borderStyle: 'dashed',
  },
  imagePickerText: {
    color: '#1890ff',
    fontSize: 14,
    fontWeight: '600',
  },
  previewImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginTop: 8,
  },
  locationLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 14,
  },
  locationLoadingText: {
    marginLeft: 8,
    color: '#666',
    fontSize: 14,
  },
  locationCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 14,
  },
  locationCoords: {
    fontSize: 13,
    color: '#333',
    fontFamily: 'monospace',
  },
  locationAddress: {
    fontSize: 13,
    color: '#666',
    marginTop: 4,
  },
  locationError: {
    fontSize: 14,
    color: '#e74c3c',
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 14,
  },
  submitBtn: {
    backgroundColor: '#1890ff',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  submitBtnDisabled: {
    opacity: 0.6,
  },
  submitBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  bottomSpacer: {
    height: 32,
  },
});
