# Phase 4: Dashboard Redesign

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build role-aware dashboard with executive view (KPIs, trends, attention queue, leaderboard) and operational view (task-oriented, schedule timeline).

**Depends on:** Phases 1-3 (design system, core components, sidebar).

---

### Task 16: Create ExecutiveDashboard Component

**Files:**
- Create: `apps/web/src/components/dashboard/ExecutiveDashboard.tsx`

**Step 1: Build executive dashboard with KPI row**

```tsx
import React, { useEffect, useState } from 'react';
import { Row, Col, Card, Typography } from 'antd';
import { CarOutlined, EnvironmentOutlined, AlertOutlined, DollarOutlined, DeleteOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import api from '../../services/api';
import { StatCard, Sparkline, ProgressRing } from '../common';
import { AttentionQueue } from './AttentionQueue';
import { WasteTrendChart } from './WasteTrendChart';
import { DriverLeaderboard } from './DriverLeaderboard';
import { AreaCollectionChart } from './AreaCollectionChart';

const { Title, Text } = Typography;

interface DashboardData {
  current: {
    totalWasteTodayKg: number;
    activeDrivers: number;
    pendingComplaints: number;
    collectionRate: number;
  };
  trends: {
    wasteChange: number;
    driverChange: number;
    complaintChange: number;
  };
}

export const ExecutiveDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [data, setData] = useState<DashboardData | null>(null);
  const [wasteData, setWasteData] = useState<any[]>([]);
  const [overdueCount, setOverdueCount] = useState(0);
  const [attentionItems, setAttentionItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      const [dashRes, wasteRes, overdueRes, tpsRes, complaintRes] = await Promise.allSettled([
        api.get('/reports/dashboard', { params: { compare: 'prev_week' } }),
        api.get('/reports/waste-volume', {
          params: {
            from: dayjs().subtract(7, 'day').format('YYYY-MM-DD'),
            to: dayjs().format('YYYY-MM-DD'),
          },
        }),
        api.get('/payments/overdue'),
        api.get('/tps'),
        api.get('/complaints'),
      ]);

      if (dashRes.status === 'fulfilled') setData(dashRes.value.data);
      if (wasteRes.status === 'fulfilled') setWasteData(Array.isArray(wasteRes.value.data) ? wasteRes.value.data : []);

      // Build attention items
      const items: any[] = [];
      if (overdueRes.status === 'fulfilled') {
        const overdue = Array.isArray(overdueRes.value.data) ? overdueRes.value.data : [];
        setOverdueCount(overdue.length);
        if (overdue.length > 0) {
          items.push({ severity: 'warning', message: `${overdue.length} pembayaran jatuh tempo`, path: '/payments' });
        }
      }
      if (tpsRes.status === 'fulfilled') {
        const tps = Array.isArray(tpsRes.value.data) ? tpsRes.value.data : [];
        tps.filter((t: any) => t.status === 'full').forEach((t: any) => {
          items.push({ severity: 'critical', message: `TPS ${t.name} penuh`, path: '/tps' });
        });
      }
      if (complaintRes.status === 'fulfilled') {
        const complaints = Array.isArray(complaintRes.value.data) ? complaintRes.value.data : [];
        complaints
          .filter((c: any) => c.status === 'submitted')
          .slice(0, 5)
          .forEach((c: any) => {
            const hoursOld = dayjs().diff(dayjs(c.created_at), 'hour');
            items.push({
              severity: hoursOld > 48 ? 'critical' : hoursOld > 24 ? 'warning' : 'info',
              message: `Keluhan: ${c.category || 'Lainnya'}`,
              detail: `${hoursOld} jam lalu`,
              path: '/complaints',
            });
          });
      }
      setAttentionItems(items);
      setLoading(false);
    };
    fetchAll();
  }, []);

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return 'Selamat pagi';
    if (h < 15) return 'Selamat siang';
    if (h < 18) return 'Selamat sore';
    return 'Selamat malam';
  })();

  const current = data?.current;
  const trends = data?.trends;

  // Build sparkline data from waste trend (sum per day)
  const dailyTotals = wasteData.reduce((acc: Record<string, number>, r: any) => {
    const date = r.date?.slice(0, 10) || 'x';
    acc[date] = (acc[date] || 0) + Number(r.total_kg || 0);
    return acc;
  }, {});
  const sparklineData = Object.values(dailyTotals) as number[];

  return (
    <div>
      {/* Greeting */}
      <div style={{ marginBottom: 24 }}>
        <Title level={4} style={{ margin: 0 }}>{greeting}</Title>
        <Text type="secondary">{dayjs().format('dddd, D MMMM YYYY')}</Text>
      </div>

      {/* KPI Row */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            title="Volume Hari Ini"
            value={`${(current?.totalWasteTodayKg || 0).toLocaleString('id-ID')} kg`}
            prefix={<DeleteOutlined style={{ color: '#22C55E' }} />}
            trend={trends ? { value: trends.wasteChange, label: 'vs minggu lalu' } : undefined}
            loading={loading}
            navigateTo="/analytics"
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            title="Driver Aktif"
            value={current?.activeDrivers || 0}
            prefix={<CarOutlined style={{ color: '#3B82F6' }} />}
            trend={trends ? { value: trends.driverChange, label: 'vs minggu lalu' } : undefined}
            loading={loading}
            navigateTo="/fleet"
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            title="Collection Rate"
            value={`${current?.collectionRate || 0}%`}
            prefix={<EnvironmentOutlined style={{ color: '#22C55E' }} />}
            loading={loading}
            navigateTo="/analytics"
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            title="Keluhan Pending"
            value={current?.pendingComplaints || 0}
            prefix={<AlertOutlined style={{ color: '#EF4444' }} />}
            trend={trends ? { value: trends.complaintChange, label: 'vs minggu lalu' } : undefined}
            loading={loading}
            navigateTo="/complaints"
          />
        </Col>
      </Row>

      {/* Row 2: Trend + Attention */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} lg={14}>
          <WasteTrendChart data={wasteData} loading={loading} />
        </Col>
        <Col xs={24} lg={10}>
          <AttentionQueue items={attentionItems} loading={loading} />
        </Col>
      </Row>

      {/* Row 3: Area Performance + Driver Leaderboard */}
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={14}>
          <AreaCollectionChart loading={loading} />
        </Col>
        <Col xs={24} lg={10}>
          <DriverLeaderboard loading={loading} />
        </Col>
      </Row>
    </div>
  );
};
```

**Step 2: Commit**

```bash
git add apps/web/src/components/dashboard/ExecutiveDashboard.tsx
git commit -m "feat(web): add ExecutiveDashboard component with KPIs and trends"
```

---

### Task 17: Create Dashboard Sub-Components

**Files:**
- Create: `apps/web/src/components/dashboard/AttentionQueue.tsx`
- Create: `apps/web/src/components/dashboard/WasteTrendChart.tsx`
- Create: `apps/web/src/components/dashboard/DriverLeaderboard.tsx`
- Create: `apps/web/src/components/dashboard/AreaCollectionChart.tsx`

**Step 1: Create AttentionQueue**

```tsx
import React from 'react';
import { Card, Typography } from 'antd';
import { useNavigate } from 'react-router-dom';
import { SEVERITY_COLORS } from '../../theme/colors';

const { Text } = Typography;

interface AttentionItem {
  severity: 'critical' | 'warning' | 'info';
  message: string;
  detail?: string;
  path: string;
}

interface AttentionQueueProps {
  items: AttentionItem[];
  loading?: boolean;
}

export const AttentionQueue: React.FC<AttentionQueueProps> = ({ items, loading }) => {
  const navigate = useNavigate();

  return (
    <Card
      title={<span>Perlu Perhatian <Text type="secondary" style={{ fontWeight: 400 }}>({items.length})</Text></span>}
      size="small"
      loading={loading}
      styles={{ body: { padding: 0, maxHeight: 380, overflowY: 'auto' } }}
    >
      {items.length === 0 ? (
        <div style={{ padding: 48, textAlign: 'center' }}>
          <Text type="secondary">Tidak ada masalah saat ini</Text>
        </div>
      ) : (
        items.map((item, i) => (
          <div
            key={i}
            onClick={() => navigate(item.path)}
            style={{
              padding: '12px 16px',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              cursor: 'pointer',
              borderBottom: '1px solid #F3F4F6',
              transition: 'background var(--duration-instant) ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = '#F9FAFB')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
          >
            <div style={{
              width: 8, height: 8, borderRadius: '50%',
              background: SEVERITY_COLORS[item.severity],
              flexShrink: 0,
            }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <Text style={{ fontSize: 13, display: 'block' }} ellipsis>{item.message}</Text>
              {item.detail && (
                <Text type="secondary" style={{ fontSize: 11 }}>{item.detail}</Text>
              )}
            </div>
          </div>
        ))
      )}
    </Card>
  );
};
```

**Step 2: Create WasteTrendChart**

```tsx
import React, { useMemo } from 'react';
import { Card, Segmented } from 'antd';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { WASTE_COLORS } from '../../theme/colors';

interface WasteTrendChartProps {
  data: any[];
  loading?: boolean;
}

export const WasteTrendChart: React.FC<WasteTrendChartProps> = ({ data, loading }) => {
  const chartData = useMemo(() => {
    const byDate: Record<string, any> = {};
    data.forEach((r: any) => {
      const date = r.date?.slice(0, 10) || 'unknown';
      if (!byDate[date]) byDate[date] = { date, organic: 0, inorganic: 0, b3: 0, recyclable: 0 };
      const key = ['organic', 'inorganic', 'b3', 'recyclable'].includes(r.category) ? r.category : 'recyclable';
      byDate[date][key] += Number(r.total_kg || 0);
    });
    return Object.values(byDate).sort((a: any, b: any) => a.date.localeCompare(b.date));
  }, [data]);

  return (
    <Card title="Tren Volume Sampah" size="small" loading={loading}>
      {chartData.length > 0 ? (
        <ResponsiveContainer width="100%" height={340}>
          <AreaChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
            <XAxis dataKey="date" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip />
            <Legend />
            <Area type="monotone" dataKey="organic" name="Organik" stackId="1" fill={WASTE_COLORS.organic} stroke={WASTE_COLORS.organic} fillOpacity={0.6} />
            <Area type="monotone" dataKey="inorganic" name="Anorganik" stackId="1" fill={WASTE_COLORS.inorganic} stroke={WASTE_COLORS.inorganic} fillOpacity={0.6} />
            <Area type="monotone" dataKey="b3" name="B3" stackId="1" fill={WASTE_COLORS.b3} stroke={WASTE_COLORS.b3} fillOpacity={0.6} />
            <Area type="monotone" dataKey="recyclable" name="Daur Ulang" stackId="1" fill={WASTE_COLORS.recyclable} stroke={WASTE_COLORS.recyclable} fillOpacity={0.6} />
          </AreaChart>
        </ResponsiveContainer>
      ) : (
        <div style={{ textAlign: 'center', padding: 48, color: 'rgba(0,0,0,0.45)' }}>
          Memuat data...
        </div>
      )}
    </Card>
  );
};
```

**Step 3: Create DriverLeaderboard**

```tsx
import React, { useEffect, useState } from 'react';
import { Card, Typography, Progress } from 'antd';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import api from '../../services/api';

const { Text } = Typography;

interface DriverLeaderboardProps {
  loading?: boolean;
}

export const DriverLeaderboard: React.FC<DriverLeaderboardProps> = ({ loading: parentLoading }) => {
  const navigate = useNavigate();
  const [drivers, setDrivers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await api.get('/reports/driver-performance', {
          params: {
            from: dayjs().subtract(7, 'day').format('YYYY-MM-DD'),
            to: dayjs().format('YYYY-MM-DD'),
          },
        });
        setDrivers(Array.isArray(res.data) ? res.data.slice(0, 5) : []);
      } catch { /* empty */ }
      setLoading(false);
    };
    fetch();
  }, []);

  const maxVolume = Math.max(...drivers.map((d) => Number(d.total_volume_kg || 0)), 1);

  return (
    <Card title="Top Driver" size="small" loading={parentLoading || loading}>
      {drivers.map((d, i) => (
        <div
          key={d.id}
          style={{
            display: 'flex', alignItems: 'center', gap: 12,
            padding: '8px 0',
            borderBottom: i < drivers.length - 1 ? '1px solid #F3F4F6' : 'none',
            cursor: 'pointer',
          }}
          onClick={() => navigate('/fleet')}
        >
          <Text style={{ width: 20, fontSize: 13, color: '#9CA3AF', textAlign: 'center' }}>
            {i + 1}
          </Text>
          <div style={{ flex: 1, minWidth: 0 }}>
            <Text style={{ fontSize: 13, display: 'block' }} ellipsis>{d.name}</Text>
            <Progress
              percent={Math.round((Number(d.total_volume_kg || 0) / maxVolume) * 100)}
              size="small"
              showInfo={false}
              strokeColor="#2563EB"
              style={{ margin: 0 }}
            />
          </div>
          <Text style={{ fontSize: 12, color: '#6B7280', flexShrink: 0 }}>
            {Number(d.total_volume_kg || 0).toLocaleString('id-ID')} kg
          </Text>
        </div>
      ))}
      {drivers.length === 0 && (
        <div style={{ padding: 24, textAlign: 'center' }}>
          <Text type="secondary">Belum ada data</Text>
        </div>
      )}
    </Card>
  );
};
```

**Step 4: Create AreaCollectionChart (placeholder with data from collection rate)**

```tsx
import React from 'react';
import { Card, Typography } from 'antd';
import { ProgressRing } from '../common';

const { Text } = Typography;

interface AreaCollectionChartProps {
  loading?: boolean;
}

export const AreaCollectionChart: React.FC<AreaCollectionChartProps> = ({ loading }) => {
  // Placeholder — this will be connected to an area-level report when available
  return (
    <Card title="Ringkasan Performa" size="small" loading={loading}>
      <div style={{ display: 'flex', justifyContent: 'space-around', padding: '24px 0' }}>
        <ProgressRing value={87} label="Collection Rate" />
        <ProgressRing value={92} label="SLA Compliance" />
        <ProgressRing value={65} label="Kapasitas TPS" />
      </div>
    </Card>
  );
};
```

**Step 5: Commit**

```bash
git add apps/web/src/components/dashboard/
git commit -m "feat(web): add dashboard sub-components (attention queue, charts, leaderboard)"
```

---

### Task 18: Create OperationalDashboard Component

**Files:**
- Create: `apps/web/src/components/dashboard/OperationalDashboard.tsx`

**Step 1: Build task-oriented dashboard for operational roles**

```tsx
import React, { useEffect, useState } from 'react';
import { Row, Col, Card, Typography, Tag, Button, Space } from 'antd';
import { CheckCircleOutlined, ClockCircleOutlined, EnvironmentOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import api from '../../services/api';
import { StatCard } from '../common';

const { Title, Text } = Typography;

interface OperationalDashboardProps {
  role: string;
}

export const OperationalDashboard: React.FC<OperationalDashboardProps> = ({ role }) => {
  const [schedules, setSchedules] = useState<any[]>([]);
  const [complaints, setComplaints] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      const results = await Promise.allSettled([
        api.get('/schedules', { params: {} }),
        api.get('/complaints'),
      ]);
      if (results[0].status === 'fulfilled') {
        setSchedules(Array.isArray(results[0].value.data) ? results[0].value.data : []);
      }
      if (results[1].status === 'fulfilled') {
        setComplaints(
          (Array.isArray(results[1].value.data) ? results[1].value.data : [])
            .filter((c: any) => ['submitted', 'assigned', 'in_progress'].includes(c.status))
            .slice(0, 5)
        );
      }
      setLoading(false);
    };
    fetch();
  }, []);

  const todaySchedules = schedules.filter((s) =>
    s.schedule_type === 'recurring' || s.scheduled_date === dayjs().format('YYYY-MM-DD')
  );

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Title level={4} style={{ margin: 0 }}>Tugas Hari Ini</Title>
        <Text type="secondary">{dayjs().format('dddd, D MMMM YYYY')}</Text>
      </div>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={8}>
          <StatCard title="Rute Hari Ini" value={todaySchedules.length} prefix={<EnvironmentOutlined style={{ color: '#3B82F6' }} />} loading={loading} />
        </Col>
        <Col xs={24} sm={8}>
          <StatCard title="TPS Dikunjungi" value={todaySchedules.reduce((sum, s) => sum + (s.stop_count || 0), 0)} prefix={<CheckCircleOutlined style={{ color: '#22C55E' }} />} loading={loading} />
        </Col>
        <Col xs={24} sm={8}>
          <StatCard title="Keluhan Ditugaskan" value={complaints.length} prefix={<ClockCircleOutlined style={{ color: '#F59E0B' }} />} loading={loading} />
        </Col>
      </Row>

      <Card title="Jadwal Hari Ini" size="small" loading={loading} style={{ marginBottom: 24 }}>
        {todaySchedules.length === 0 ? (
          <div style={{ padding: 24, textAlign: 'center' }}>
            <Text type="secondary">Tidak ada jadwal hari ini</Text>
          </div>
        ) : (
          todaySchedules.map((s) => (
            <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '12px 0', borderBottom: '1px solid #F3F4F6' }}>
              <Text strong style={{ width: 50, fontSize: 13, color: '#6B7280' }}>{s.start_time}</Text>
              <div style={{ flex: 1 }}>
                <Text style={{ fontSize: 13 }}>{s.route_name}</Text>
              </div>
              <Tag color={s.status === 'in_progress' ? 'blue' : s.status === 'completed' ? 'green' : 'default'}>
                {s.status === 'in_progress' ? 'Dalam Proses' : s.status === 'completed' ? 'Selesai' : 'Menunggu'}
              </Tag>
            </div>
          ))
        )}
      </Card>

      {complaints.length > 0 && (
        <Card title="Keluhan Ditugaskan" size="small" loading={loading}>
          {complaints.map((c) => (
            <div key={c.id} style={{ padding: '12px 0', borderBottom: '1px solid #F3F4F6' }}>
              <Text style={{ fontSize: 13 }}>{c.description?.slice(0, 80) || c.category}</Text>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                <Text type="secondary" style={{ fontSize: 11 }}>
                  SLA: {Math.max(0, 72 - dayjs().diff(dayjs(c.created_at), 'hour'))} jam tersisa
                </Text>
              </div>
            </div>
          ))}
        </Card>
      )}
    </div>
  );
};
```

**Step 2: Commit**

```bash
git add apps/web/src/components/dashboard/OperationalDashboard.tsx
git commit -m "feat(web): add OperationalDashboard for task-oriented roles"
```

---

### Task 19: Create Dashboard Barrel Export

**Files:**
- Create: `apps/web/src/components/dashboard/index.ts`

**Step 1: Create barrel export**

```ts
export { ExecutiveDashboard } from './ExecutiveDashboard';
export { OperationalDashboard } from './OperationalDashboard';
export { AttentionQueue } from './AttentionQueue';
export { WasteTrendChart } from './WasteTrendChart';
export { DriverLeaderboard } from './DriverLeaderboard';
export { AreaCollectionChart } from './AreaCollectionChart';
```

**Step 2: Commit**

```bash
git add apps/web/src/components/dashboard/index.ts
git commit -m "feat(web): add dashboard components barrel export"
```

---

### Task 20: Rewrite DashboardPage with Role Switching

**Files:**
- Modify: `apps/web/src/pages/DashboardPage.tsx`

**Step 1: Replace DashboardPage with role-aware version**

```tsx
import React from 'react';
import { usePermission } from '../hooks/usePermission';
import { ExecutiveDashboard } from '../components/dashboard';
import { OperationalDashboard } from '../components/dashboard';

const DashboardPage: React.FC = () => {
  const { isExecutive, role } = usePermission();

  return isExecutive
    ? <ExecutiveDashboard />
    : <OperationalDashboard role={role} />;
};

export default DashboardPage;
```

**Step 2: Verify build**

```bash
cd /opt/buzzr && pnpm run build --filter=@buzzr/web
```

**Step 3: Commit**

```bash
git add apps/web/src/pages/DashboardPage.tsx
git commit -m "feat(web): rewrite DashboardPage with role-aware executive/operational views"
```

---

### Task 21: Build Verification

**Step 1: Full build verification**

```bash
cd /opt/buzzr && pnpm run build --filter=@buzzr/web
```

**Step 2: Commit any fixes if needed**
