import React from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert,
} from 'react-native';
import { useAuthStore } from '../../stores/auth.store';

export default function AdminProfilScreen() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  const handleLogout = () => {
    Alert.alert('Keluar', 'Apakah Anda yakin ingin keluar?', [
      { text: 'Batal', style: 'cancel' },
      { text: 'Keluar', style: 'destructive', onPress: () => logout() },
    ]);
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{(user?.name || '?').charAt(0).toUpperCase()}</Text>
        </View>
        <Text style={styles.name}>{user?.name || 'Admin'}</Text>
        <Text style={styles.role}>{user?.role === 'super_admin' ? 'Super Admin' : 'Admin DLH'}</Text>
      </View>

      <View style={styles.section}>
        <View style={styles.row}>
          <Text style={styles.label}>Email</Text>
          <Text style={styles.value}>{user?.email || '-'}</Text>
        </View>
        {user?.phone && (
          <View style={styles.row}>
            <Text style={styles.label}>Nomor HP</Text>
            <Text style={styles.value}>{user.phone}</Text>
          </View>
        )}
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutText}>Keluar</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: { backgroundColor: '#1890ff', paddingHorizontal: 20, paddingTop: 24, paddingBottom: 28, alignItems: 'center' },
  avatar: {
    width: 72, height: 72, borderRadius: 36, backgroundColor: '#fff',
    justifyContent: 'center', alignItems: 'center', marginBottom: 12,
  },
  avatarText: { fontSize: 32, fontWeight: 'bold', color: '#1890ff' },
  name: { fontSize: 20, fontWeight: 'bold', color: '#fff' },
  role: { fontSize: 13, color: 'rgba(255,255,255,0.85)', marginTop: 4 },
  section: { backgroundColor: '#fff', marginTop: 16, paddingHorizontal: 16 },
  row: {
    paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#f0f0f0',
    flexDirection: 'row', justifyContent: 'space-between',
  },
  label: { fontSize: 13, color: '#888' },
  value: { fontSize: 13, color: '#333', fontWeight: '500' },
  logoutButton: {
    backgroundColor: '#fff', marginTop: 24, marginHorizontal: 16, padding: 16,
    borderRadius: 8, alignItems: 'center', borderWidth: 1, borderColor: '#EF4444',
  },
  logoutText: { color: '#EF4444', fontSize: 15, fontWeight: '600' },
});
