import React, { Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Spin } from 'antd';
import DashboardLayout from './layouts/DashboardLayout';
import LoginPage from './pages/LoginPage';
import { useAuthStore } from './stores/auth.store';

const DashboardPage = React.lazy(() => import('./pages/DashboardPage'));
const TpsTriagePage = React.lazy(() => import('./pages/TpsTriagePage'));
const FleetTriagePage = React.lazy(() => import('./pages/FleetTriagePage'));
const ScheduleTriagePage = React.lazy(() => import('./pages/ScheduleTriagePage'));
const ComplaintTriagePage = React.lazy(() => import('./pages/ComplaintTriagePage'));
const PaymentTriagePage = React.lazy(() => import('./pages/PaymentTriagePage'));
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
          <Route path="tps" element={<TpsTriagePage />} />
          <Route path="fleet" element={<FleetTriagePage />} />
          <Route path="schedules" element={<ScheduleTriagePage />} />
          <Route path="complaints" element={<ComplaintTriagePage />} />
          <Route path="payments" element={<PaymentTriagePage />} />
          <Route path="users" element={<UserPage />} />
          <Route path="reports" element={<ReportPage />} />
        </Route>
      </Routes>
    </Suspense>
  );
}
