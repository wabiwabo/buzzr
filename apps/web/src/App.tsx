import React, { Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import DashboardLayout from './layouts/DashboardLayout';
import LoginPage from './pages/LoginPage';
import { useAuthStore } from './stores/auth.store';

const DashboardPage = React.lazy(() => import('./pages/DashboardPage'));
const TpsPage = React.lazy(() => import('./pages/TpsPage'));
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
  <div className="flex justify-center items-center min-h-[200px]">
    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
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
