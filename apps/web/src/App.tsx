import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import DashboardLayout from './layouts/DashboardLayout';
import LoginPage from './pages/LoginPage';
import { useAuthStore } from './stores/auth.store';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore();
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" />;
}

const PlaceholderPage = ({ title }: { title: string }) => <h2>{title}</h2>;

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/" element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
        <Route index element={<PlaceholderPage title="Dashboard" />} />
        <Route path="tps" element={<PlaceholderPage title="Manajemen TPS" />} />
        <Route path="fleet" element={<PlaceholderPage title="Manajemen Armada" />} />
        <Route path="schedules" element={<PlaceholderPage title="Jadwal" />} />
        <Route path="complaints" element={<PlaceholderPage title="Laporan Masyarakat" />} />
        <Route path="payments" element={<PlaceholderPage title="Pembayaran" />} />
        <Route path="users" element={<PlaceholderPage title="Pengguna" />} />
        <Route path="reports" element={<PlaceholderPage title="Laporan Analitik" />} />
      </Route>
    </Routes>
  );
}
