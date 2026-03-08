import React, { Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Spin } from 'antd';
import DashboardLayout from './layouts/DashboardLayout';
import LoginPage from './pages/LoginPage';
import { useAuthStore } from './stores/auth.store';

const DashboardPage = React.lazy(() => import('./pages/DashboardPage'));
const TpsPage = React.lazy(() => import('./pages/TpsPage'));
const FleetPage = React.lazy(() => import('./pages/FleetPage'));
const SchedulePage = React.lazy(() => import('./pages/SchedulePage'));
const ComplaintPage = React.lazy(() => import('./pages/ComplaintPage'));
const PaymentPage = React.lazy(() => import('./pages/PaymentPage'));
const UserPage = React.lazy(() => import('./pages/UserPage'));
const ReportPage = React.lazy(() => import('./pages/ReportPage'));
const LiveOperationsPage = React.lazy(() => import('./pages/LiveOperationsPage'));
const AnalyticsPage = React.lazy(() => import('./pages/AnalyticsPage'));

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore();
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" />;
}

const PageFallback = () => (
  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 200 }}>
    <Spin />
  </div>
);

export default function App() {
  return (
    <Suspense fallback={<PageFallback />}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
          <Route index element={<DashboardPage />} />
          <Route path="live" element={<LiveOperationsPage />} />
          <Route path="analytics" element={<AnalyticsPage />} />
          <Route path="tps" element={<TpsPage />} />
          <Route path="fleet" element={<FleetPage />} />
          <Route path="schedules" element={<SchedulePage />} />
          <Route path="complaints" element={<ComplaintPage />} />
          <Route path="payments" element={<PaymentPage />} />
          <Route path="users" element={<UserPage />} />
          <Route path="reports" element={<ReportPage />} />
        </Route>
      </Routes>
    </Suspense>
  );
}
