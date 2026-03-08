import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  ActivityIndicator,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import * as Location from 'expo-location';
import api from '../../services/api';
import { useAuthStore } from '../../stores/auth.store';

interface LocationData {
  latitude: number;
  longitude: number;
  speed: number | null;
}

export default function TrackingScreen() {
  const user = useAuthStore((s) => s.user);
  const [vehicleId, setVehicleId] = useState('');
  const [isTracking, setIsTracking] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<LocationData | null>(null);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [elapsed, setElapsed] = useState('00:00:00');
  const [sending, setSending] = useState(false);

  const watchRef = useRef<Location.LocationSubscription | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastSendRef = useRef<number>(0);

  // Update elapsed timer
  useEffect(() => {
    if (isTracking && startTime) {
      intervalRef.current = setInterval(() => {
        const diff = Math.floor((Date.now() - startTime) / 1000);
        const hrs = String(Math.floor(diff / 3600)).padStart(2, '0');
        const mins = String(Math.floor((diff % 3600) / 60)).padStart(2, '0');
        const secs = String(diff % 60).padStart(2, '0');
        setElapsed(`${hrs}:${mins}:${secs}`);
      }, 1000);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isTracking, startTime]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (watchRef.current) {
        watchRef.current.remove();
        watchRef.current = null;
      }
    };
  }, []);

  const sendLocation = useCallback(
    async (location: LocationData) => {
      const now = Date.now();
      // Throttle: send at most every 5 seconds
      if (now - lastSendRef.current < 5000) return;
      lastSendRef.current = now;

      try {
        setSending(true);
        await api.post('/tracking/location', {
          vehicleId,
          latitude: location.latitude,
          longitude: location.longitude,
          speed: location.speed ?? 0,
        });
      } catch {
        // Silent fail for location sends to avoid spamming alerts
      } finally {
        setSending(false);
      }
    },
    [vehicleId],
  );

  const startTracking = async () => {
    if (!vehicleId.trim()) {
      Alert.alert('Peringatan', 'Masukkan ID Kendaraan terlebih dahulu.');
      return;
    }

    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Izin Ditolak',
          'Izin lokasi diperlukan untuk tracking. Aktifkan izin lokasi di pengaturan perangkat.',
        );
        return;
      }

      const subscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 3000,
          distanceInterval: 5,
        },
        (loc) => {
          const locationData: LocationData = {
            latitude: loc.coords.latitude,
            longitude: loc.coords.longitude,
            speed: loc.coords.speed,
          };
          setCurrentLocation(locationData);
          sendLocation(locationData);
        },
      );

      watchRef.current = subscription;
      setIsTracking(true);
      setStartTime(Date.now());
      setElapsed('00:00:00');
    } catch {
      Alert.alert('Error', 'Gagal memulai tracking. Silakan coba lagi.');
    }
  };

  const stopTracking = () => {
    if (watchRef.current) {
      watchRef.current.remove();
      watchRef.current = null;
    }
    setIsTracking(false);
    setStartTime(null);
    lastSendRef.current = 0;
  };

  const handleToggle = () => {
    if (isTracking) {
      Alert.alert(
        'Hentikan Tracking',
        'Apakah Anda yakin ingin menghentikan tracking?',
        [
          { text: 'Batal', style: 'cancel' },
          { text: 'Hentikan', style: 'destructive', onPress: stopTracking },
        ],
      );
    } else {
      startTracking();
    }
  };

  const formatCoord = (val: number | undefined | null): string => {
    if (val == null) return '-';
    return val.toFixed(6);
  };

  const formatSpeed = (speed: number | null): string => {
    if (speed == null || speed < 0) return '0 km/j';
    // speed from expo-location is in m/s, convert to km/h
    return `${(speed * 3.6).toFixed(1)} km/j`;
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>GPS Tracking</Text>
        <Text style={styles.headerSub}>
          {user?.name || 'Driver'}
        </Text>
      </View>

      {/* Vehicle ID input */}
      <View style={styles.section}>
        <Text style={styles.label}>ID Kendaraan</Text>
        <TextInput
          style={[styles.input, isTracking && styles.inputDisabled]}
          placeholder="Masukkan ID kendaraan"
          value={vehicleId}
          onChangeText={setVehicleId}
          editable={!isTracking}
          placeholderTextColor="#bbb"
        />
      </View>

      {/* Status */}
      <View style={styles.statusCard}>
        <View style={styles.statusRow}>
          <View
            style={[
              styles.statusDot,
              { backgroundColor: isTracking ? '#52c41a' : '#d9d9d9' },
            ]}
          />
          <Text style={styles.statusLabel}>
            {isTracking ? 'Tracking Aktif' : 'Tracking Tidak Aktif'}
          </Text>
          {sending && (
            <ActivityIndicator
              size="small"
              color="#1890ff"
              style={{ marginLeft: 8 }}
            />
          )}
        </View>

        <Text style={styles.timerText}>{elapsed}</Text>
      </View>

      {/* Location info */}
      <View style={styles.locationCard}>
        <View style={styles.coordRow}>
          <Text style={styles.coordLabel}>Latitude</Text>
          <Text style={styles.coordValue}>
            {formatCoord(currentLocation?.latitude)}
          </Text>
        </View>
        <View style={styles.coordRow}>
          <Text style={styles.coordLabel}>Longitude</Text>
          <Text style={styles.coordValue}>
            {formatCoord(currentLocation?.longitude)}
          </Text>
        </View>
        <View style={styles.coordRow}>
          <Text style={styles.coordLabel}>Kecepatan</Text>
          <Text style={styles.coordValue}>
            {formatSpeed(currentLocation?.speed ?? null)}
          </Text>
        </View>
      </View>

      {/* Toggle button */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[
            styles.toggleButton,
            isTracking ? styles.stopButton : styles.startButton,
          ]}
          onPress={handleToggle}
          activeOpacity={0.8}
        >
          <Text style={styles.toggleButtonText}>
            {isTracking ? 'Hentikan Tracking' : 'Mulai Tracking'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
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
  inputDisabled: {
    backgroundColor: '#f0f0f0',
    color: '#999',
  },
  statusCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  statusLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
  },
  timerText: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#1890ff',
    marginTop: 12,
    fontVariant: ['tabular-nums'],
  },
  locationCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 12,
    padding: 16,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  coordRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  coordLabel: {
    fontSize: 14,
    color: '#888',
  },
  coordValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
    fontVariant: ['tabular-nums'],
  },
  buttonContainer: {
    paddingHorizontal: 16,
    marginTop: 24,
  },
  toggleButton: {
    borderRadius: 12,
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  startButton: {
    backgroundColor: '#52c41a',
  },
  stopButton: {
    backgroundColor: '#f5222d',
  },
  toggleButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
