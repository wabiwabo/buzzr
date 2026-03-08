import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useAuthStore } from '../../stores/auth.store';

export default function LoginScreen() {
  const [mode, setMode] = useState<'otp' | 'password'>('otp');
  const [phone, setPhone] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const { requestOtp, loginWithOtp, loginWithPassword } = useAuthStore();

  const handleRequestOtp = async () => {
    try { await requestOtp(phone); setOtpSent(true); }
    catch { Alert.alert('Error', 'Gagal mengirim OTP'); }
  };

  const handleLoginOtp = async () => {
    try { await loginWithOtp(phone, otpCode); }
    catch { Alert.alert('Error', 'OTP tidak valid'); }
  };

  const handleLoginPassword = async () => {
    try { await loginWithPassword(email, password); }
    catch { Alert.alert('Error', 'Email atau password salah'); }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Buzzr</Text>
      <Text style={styles.subtitle}>Pengelolaan Sampah Terpadu</Text>

      <View style={styles.toggleRow}>
        <TouchableOpacity style={[styles.toggleBtn, mode === 'otp' && styles.activeBtn]} onPress={() => setMode('otp')}>
          <Text style={[styles.toggleText, mode === 'otp' && styles.activeText]}>HP</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.toggleBtn, mode === 'password' && styles.activeBtn]} onPress={() => setMode('password')}>
          <Text style={[styles.toggleText, mode === 'password' && styles.activeText]}>Email</Text>
        </TouchableOpacity>
      </View>

      {mode === 'otp' ? (
        <>
          <TextInput style={styles.input} placeholder="Nomor HP (08...)" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
          {otpSent && <TextInput style={styles.input} placeholder="Kode OTP" value={otpCode} onChangeText={setOtpCode} keyboardType="number-pad" maxLength={6} />}
          <TouchableOpacity style={styles.button} onPress={otpSent ? handleLoginOtp : handleRequestOtp}>
            <Text style={styles.buttonText}>{otpSent ? 'Masuk' : 'Kirim OTP'}</Text>
          </TouchableOpacity>
        </>
      ) : (
        <>
          <TextInput style={styles.input} placeholder="Email" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
          <TextInput style={styles.input} placeholder="Password" value={password} onChangeText={setPassword} secureTextEntry />
          <TouchableOpacity style={styles.button} onPress={handleLoginPassword}>
            <Text style={styles.buttonText}>Masuk</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', paddingHorizontal: 32, backgroundColor: '#f5f5f5' },
  title: { fontSize: 36, fontWeight: 'bold', textAlign: 'center', color: '#1890ff', marginBottom: 8 },
  subtitle: { fontSize: 14, textAlign: 'center', color: '#666', marginBottom: 32 },
  toggleRow: { flexDirection: 'row', marginBottom: 16 },
  toggleBtn: { flex: 1, padding: 12, alignItems: 'center', borderWidth: 1, borderColor: '#ddd', backgroundColor: '#fff' },
  activeBtn: { backgroundColor: '#1890ff', borderColor: '#1890ff' },
  toggleText: { color: '#333' },
  activeText: { color: '#fff' },
  input: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 14, fontSize: 16, marginBottom: 12 },
  button: { backgroundColor: '#1890ff', padding: 16, borderRadius: 8, alignItems: 'center', marginTop: 8 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});
