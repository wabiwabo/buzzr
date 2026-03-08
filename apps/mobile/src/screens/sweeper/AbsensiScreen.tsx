import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import * as Location from 'expo-location';
import api from '../../services/api';
import { useAuthStore } from '../../stores/auth.store';

interface AttendanceRecord {
  type: 'check_in' | 'check_out';
  time: string;
  latitude: number;
  longitude: number;
}

export default function AbsensiScreen() {
  const user = useAuthStore((s) => s.user);
  const [checkedIn, setCheckedIn] = useState(false);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const formatTime = (iso: string): string => {
    try {
      const d = new Date(iso);
      return d.toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
    } catch {
      return iso;
    }
  };

  const formatCoord = (val: number): string => val.toFixed(6);

  const handleAttendance = useCallback(
    async (type: 'check_in' | 'check_out') => {
      setSubmitting(true);
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert(
            'Izin Ditolak',
            'Izin lokasi diperlukan untuk absensi. Aktifkan izin lokasi di pengaturan perangkat.',
          );
          return;
        }

        const loc = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });

        await api.post('/tracking/location', {
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
          speed: loc.coords.speed ?? 0,
          type,
        });

        const record: AttendanceRecord = {
          type,
          time: new Date().toISOString(),
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
        };

        setRecords((prev) => [...prev, record]);

        if (type === 'check_in') {
          setCheckedIn(true);
          Alert.alert('Berhasil', 'Check-in berhasil dicatat.');
        } else {
          setCheckedIn(false);
          Alert.alert('Berhasil', 'Check-out berhasil dicatat.');
        }
      } catch {
        Alert.alert('Error', 'Gagal mencatat absensi. Silakan coba lagi.');
      } finally {
        setSubmitting(false);
      }
    },
    [],
  );

  const handleCheckIn = () => {
    Alert.alert('Check-in', 'Apakah Anda yakin ingin check-in?', [
      { text: 'Batal', style: 'cancel' },
      { text: 'Ya, Check-in', onPress: () => handleAttendance('check_in') },
    ]);
  };

  const handleCheckOut = () => {
    Alert.alert('Check-out', 'Apakah Anda yakin ingin check-out?', [
      { text: 'Batal', style: 'cancel' },
      {
        text: 'Ya, Check-out',
        style: 'destructive',
        onPress: () => handleAttendance('check_out'),
      },
    ]);
  };

  const lastCheckIn = [...records]
    .reverse()
    .find((r) => r.type === 'check_in');
  const lastCheckOut = [...records]
    .reverse()
    .find((r) => r.type === 'check_out');

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Absensi</Text>
        <Text style={styles.headerSub}>{user?.name || 'Petugas Kebersihan'}</Text>
      </View>

      {/* Status Card */}
      <View style={styles.statusCard}>
        <View style={styles.statusRow}>
          <View
            style={[
              styles.statusDot,
              { backgroundColor: checkedIn ? '#52c41a' : '#d9d9d9' },
            ]}
          />
          <Text style={styles.statusLabel}>
            {checkedIn ? 'Sedang Bertugas' : 'Belum Check-in'}
          </Text>
        </View>
      </View>

      {/* Check-in / Check-out Button */}
      <View style={styles.buttonContainer}>
        {!checkedIn ? (
          <TouchableOpacity
            style={[styles.attendanceBtn, styles.checkInBtn, submitting && styles.btnDisabled]}
            onPress={handleCheckIn}
            disabled={submitting}
            activeOpacity={0.8}
          >
            {submitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Text style={styles.btnText}>Check-in</Text>
                <Text style={styles.btnSubText}>Tekan untuk mulai bertugas</Text>
              </>
            )}
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.attendanceBtn, styles.checkOutBtn, submitting && styles.btnDisabled]}
            onPress={handleCheckOut}
            disabled={submitting}
            activeOpacity={0.8}
          >
            {submitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Text style={styles.btnText}>Check-out</Text>
                <Text style={styles.btnSubText}>Tekan untuk selesai bertugas</Text>
              </>
            )}
          </TouchableOpacity>
        )}
      </View>

      {/* Today's Records */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Riwayat Hari Ini</Text>

        {lastCheckIn && (
          <View style={styles.recordCard}>
            <View style={styles.recordHeader}>
              <View style={[styles.recordBadge, { backgroundColor: '#52c41a18' }]}>
                <Text style={[styles.recordBadgeText, { color: '#52c41a' }]}>
                  Check-in
                </Text>
              </View>
              <Text style={styles.recordTime}>{formatTime(lastCheckIn.time)}</Text>
            </View>
            <Text style={styles.recordCoord}>
              Lat: {formatCoord(lastCheckIn.latitude)}, Lng:{' '}
              {formatCoord(lastCheckIn.longitude)}
            </Text>
          </View>
        )}

        {lastCheckOut && (
          <View style={styles.recordCard}>
            <View style={styles.recordHeader}>
              <View style={[styles.recordBadge, { backgroundColor: '#f5222d18' }]}>
                <Text style={[styles.recordBadgeText, { color: '#f5222d' }]}>
                  Check-out
                </Text>
              </View>
              <Text style={styles.recordTime}>{formatTime(lastCheckOut.time)}</Text>
            </View>
            <Text style={styles.recordCoord}>
              Lat: {formatCoord(lastCheckOut.latitude)}, Lng:{' '}
              {formatCoord(lastCheckOut.longitude)}
            </Text>
          </View>
        )}

        {records.length === 0 && (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>Belum ada absensi hari ini</Text>
          </View>
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
  statusCard: {
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
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  statusLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  buttonContainer: {
    paddingHorizontal: 16,
    marginTop: 20,
  },
  attendanceBtn: {
    borderRadius: 16,
    paddingVertical: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkInBtn: {
    backgroundColor: '#52c41a',
  },
  checkOutBtn: {
    backgroundColor: '#f5222d',
  },
  btnDisabled: {
    opacity: 0.6,
  },
  btnText: {
    color: '#fff',
    fontSize: 22,
    fontWeight: 'bold',
  },
  btnSubText: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 14,
    marginTop: 4,
  },
  section: {
    paddingHorizontal: 16,
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  recordCard: {
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
  recordHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  recordBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  recordBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  recordTime: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  recordCoord: {
    fontSize: 12,
    color: '#888',
    marginTop: 6,
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
    height: 32,
  },
});
