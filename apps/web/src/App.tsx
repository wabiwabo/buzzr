import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import DashboardLayout from './layouts/DashboardLayout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import TpsPage from './pages/TpsPage';
import FleetPage from './pages/FleetPage';
import SchedulePage from './pages/SchedulePage';
import ComplaintPage from './pages/ComplaintPage';
import PaymentPage from './pages/PaymentPage';
import UserPage from './pages/UserPage';
import ReportPage from './pages/ReportPage';
import { useAuthStore } from './stores/auth.store';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore();
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/" element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
        <Route index element={<DashboardPage />} />
        <Route path="tps" element={<TpsPage />} />
        <Route path="fleet" element={<FleetPage />} />
        <Route path="schedules" element={<SchedulePage />} />
        <Route path="complaints" element={<ComplaintPage />} />
        <Route path="payments" element={<PaymentPage />} />
        <Route path="users" element={<UserPage />} />
        <Route path="reports" element={<ReportPage />} />
      </Route>
    </Routes>
  );
}
