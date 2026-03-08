# Phase 6: Data Visualization & Analytics

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build the Analytics Hub page with interactive charts, date range filtering, and period comparison. Enhance existing Recharts usage with semantic colors and interaction handlers.

**Depends on:** Phase 1 (color constants, design tokens), Phase 2 (ProgressRing, Sparkline).

---

### Task 27: Create WasteTrendChart Component

**Files:**
- Create: `apps/web/src/components/charts/WasteTrendChart.tsx`

**Step 1: Create interactive stacked area chart with period selector**

```tsx
import React, { useState } from 'react';
import { Card, Segmented, Typography } from 'antd';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, Brush,
} from 'recharts';
import { WASTE_COLORS } from '../../theme/colors';

const { Text } = Typography;

type Period = 'daily' | 'weekly' | 'monthly';

interface WasteTrendChartProps {
  data: Array<{
    date: string;
    organic: number;
    inorganic: number;
    b3: number;
    recyclable: number;
  }>;
  loading?: boolean;
  onBarClick?: (date: string) => void;
}

const periodLabels: Record<Period, string> = {
  daily: 'Harian',
  weekly: 'Mingguan',
  monthly: 'Bulanan',
};

export const WasteTrendChart: React.FC<WasteTrendChartProps> = ({
  data,
  loading = false,
  onBarClick,
}) => {
  const [period, setPeriod] = useState<Period>('daily');

  const formatDate = (value: string) => {
    if (!value) return '';
    const d = new Date(value);
    return `${d.getDate()}/${d.getMonth() + 1}`;
  };

  const formatTooltip = (value: number) => [`${value.toLocaleString('id-ID')} kg`, ''];

  return (
    <Card
      title="Trend Volume Sampah"
      size="small"
      extra={
        <Segmented
          size="small"
          options={Object.entries(periodLabels).map(([value, label]) => ({ value, label }))}
          value={period}
          onChange={(v) => setPeriod(v as Period)}
        />
      }
    >
      {data.length > 0 ? (
        <ResponsiveContainer width="100%" height={320}>
          <AreaChart data={data} onClick={(e) => e?.activeLabel && onBarClick?.(e.activeLabel)}>
            <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
            <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={formatDate} />
            <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${v} kg`} />
            <Tooltip
              contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #E5E7EB' }}
              formatter={formatTooltip}
              labelFormatter={(l) => `Tanggal: ${l}`}
            />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Area type="monotone" dataKey="organic" name="Organik" stackId="1" fill={WASTE_COLORS.organic} stroke={WASTE_COLORS.organic} fillOpacity={0.6} animationDuration={600} />
            <Area type="monotone" dataKey="inorganic" name="Anorganik" stackId="1" fill={WASTE_COLORS.inorganic} stroke={WASTE_COLORS.inorganic} fillOpacity={0.6} animationDuration={600} />
            <Area type="monotone" dataKey="b3" name="B3" stackId="1" fill={WASTE_COLORS.b3} stroke={WASTE_COLORS.b3} fillOpacity={0.6} animationDuration={600} />
            <Area type="monotone" dataKey="recyclable" name="Daur Ulang" stackId="1" fill={WASTE_COLORS.recyclable} stroke={WASTE_COLORS.recyclable} fillOpacity={0.6} animationDuration={600} />
            <Brush dataKey="date" height={20} stroke="#2563EB" tickFormatter={formatDate} />
          </AreaChart>
        </ResponsiveContainer>
      ) : (
        <div style={{ textAlign: 'center', padding: 48 }}>
          <Text type="secondary">Tidak ada data volume sampah</Text>
        </div>
      )}
    </Card>
  );
};
```

**Step 2: Commit**

```bash
git add apps/web/src/components/charts/WasteTrendChart.tsx
git commit -m "feat(web): add WasteTrendChart with period selector and brush zoom"
```

---

### Task 28: Create CollectionRateChart Component

**Files:**
- Create: `apps/web/src/components/charts/CollectionRateChart.tsx`

**Step 1: Create horizontal bar chart with target line**

```tsx
import React from 'react';
import { Card, Typography } from 'antd';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, Cell,
} from 'recharts';

const { Text } = Typography;

interface AreaRate {
  area: string;
  rate: number;
}

interface CollectionRateChartProps {
  data: AreaRate[];
  target?: number;
  loading?: boolean;
  onBarClick?: (area: string) => void;
}

const getBarColor = (rate: number, target: number): string => {
  if (rate >= target) return '#22C55E';
  if (rate >= target * 0.8) return '#F59E0B';
  return '#EF4444';
};

export const CollectionRateChart: React.FC<CollectionRateChartProps> = ({
  data,
  target = 85,
  loading = false,
  onBarClick,
}) => {
  const sorted = [...data].sort((a, b) => b.rate - a.rate);

  return (
    <Card title="Tingkat Pengumpulan per Area" size="small">
      {sorted.length > 0 ? (
        <ResponsiveContainer width="100%" height={Math.max(200, sorted.length * 40)}>
          <BarChart data={sorted} layout="vertical" onClick={(e) => e?.activeLabel && onBarClick?.(e.activeLabel)}>
            <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" horizontal={false} />
            <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11 }} tickFormatter={(v) => `${v}%`} />
            <YAxis type="category" dataKey="area" width={120} tick={{ fontSize: 11 }} />
            <Tooltip
              contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #E5E7EB' }}
              formatter={(value: number) => [`${value}%`, 'Tingkat Pengumpulan']}
            />
            <ReferenceLine x={target} stroke="#6B7280" strokeDasharray="4 4" label={{ value: `Target ${target}%`, fontSize: 10, fill: '#6B7280' }} />
            <Bar dataKey="rate" radius={[0, 4, 4, 0]} animationDuration={600}>
              {sorted.map((entry, index) => (
                <Cell key={index} fill={getBarColor(entry.rate, target)} cursor="pointer" />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      ) : (
        <div style={{ textAlign: 'center', padding: 48 }}>
          <Text type="secondary">Tidak ada data area</Text>
        </div>
      )}
    </Card>
  );
};
```

**Step 2: Commit**

```bash
git add apps/web/src/components/charts/CollectionRateChart.tsx
git commit -m "feat(web): add CollectionRateChart horizontal bar with target line"
```

---

### Task 29: Create StatusDonutChart Component

**Files:**
- Create: `apps/web/src/components/charts/StatusDonutChart.tsx`

**Step 1: Create donut chart with center label**

```tsx
import React from 'react';
import { Card, Typography } from 'antd';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { CHART_COLORS } from '../../theme/colors';

const { Text } = Typography;

interface StatusSegment {
  name: string;
  value: number;
  color?: string;
}

interface StatusDonutChartProps {
  title: string;
  data: StatusSegment[];
  centerLabel?: string;
  centerValue?: number | string;
  loading?: boolean;
  onSegmentClick?: (name: string) => void;
}

export const StatusDonutChart: React.FC<StatusDonutChartProps> = ({
  title,
  data,
  centerLabel,
  centerValue,
  loading = false,
  onSegmentClick,
}) => {
  const total = data.reduce((sum, d) => sum + d.value, 0);

  return (
    <Card title={title} size="small">
      <div style={{ position: 'relative' }}>
        <ResponsiveContainer width="100%" height={220}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={80}
              dataKey="value"
              animationDuration={600}
              onClick={(entry) => onSegmentClick?.(entry.name)}
              cursor="pointer"
            >
              {data.map((entry, index) => (
                <Cell key={index} fill={entry.color || CHART_COLORS[index % CHART_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #E5E7EB' }}
              formatter={(value: number, name: string) => [`${value} (${total > 0 ? Math.round((value / total) * 100) : 0}%)`, name]}
            />
          </PieChart>
        </ResponsiveContainer>
        {(centerLabel || centerValue !== undefined) && (
          <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center' }}>
            <div style={{ fontSize: 22, fontWeight: 600, color: '#1F2937' }}>{centerValue ?? total}</div>
            {centerLabel && <Text type="secondary" style={{ fontSize: 11 }}>{centerLabel}</Text>}
          </div>
        )}
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 16px', justifyContent: 'center', marginTop: 8 }}>
        {data.map((entry, index) => (
          <div key={index} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: entry.color || CHART_COLORS[index % CHART_COLORS.length] }} />
            <Text type="secondary">{entry.name}: {entry.value}</Text>
          </div>
        ))}
      </div>
    </Card>
  );
};
```

**Step 2: Commit**

```bash
git add apps/web/src/components/charts/StatusDonutChart.tsx
git commit -m "feat(web): add StatusDonutChart with center label and click handler"
```

---

### Task 30: Create Charts Barrel Export

**Files:**
- Create: `apps/web/src/components/charts/index.ts`

**Step 1: Create barrel export**

```ts
export { WasteTrendChart } from './WasteTrendChart';
export { CollectionRateChart } from './CollectionRateChart';
export { StatusDonutChart } from './StatusDonutChart';
```

**Step 2: Commit**

```bash
git add apps/web/src/components/charts/index.ts
git commit -m "feat(web): add charts barrel export"
```

---

### Task 31: Create Analytics Hub Page

**Files:**
- Create: `apps/web/src/pages/AnalyticsPage.tsx`
- Modify: `apps/web/src/App.tsx` (add route — already referenced from Phase 3)

**Step 1: Create scrollable analytics page with global filters**

```tsx
import React, { useEffect, useState } from 'react';
import { Row, Col, DatePicker, Select, Space, Typography, message } from 'antd';
import dayjs, { Dayjs } from 'dayjs';
import api from '../services/api';
import { PageHeader } from '../components/common';
import { WasteTrendChart, CollectionRateChart, StatusDonutChart } from '../components/charts';

const { RangePicker } = DatePicker;
const { Text } = Typography;

const AnalyticsPage: React.FC = () => {
  const [dateRange, setDateRange] = useState<[Dayjs, Dayjs]>([
    dayjs().subtract(30, 'day'),
    dayjs(),
  ]);
  const [wasteData, setWasteData] = useState<any[]>([]);
  const [areaRates, setAreaRates] = useState<any[]>([]);
  const [complaintStats, setComplaintStats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [wasteRes, complaintRes] = await Promise.allSettled([
        api.get('/reports/waste-volume'),
        api.get('/complaints'),
      ]);

      if (wasteRes.status === 'fulfilled') {
        const raw = Array.isArray(wasteRes.value.data) ? wasteRes.value.data : [];
        const byDate: Record<string, any> = {};
        raw.forEach((r: any) => {
          const date = r.date?.slice(0, 10) || 'unknown';
          if (!byDate[date]) byDate[date] = { date, organic: 0, inorganic: 0, b3: 0, recyclable: 0 };
          const key = r.category === 'organic' ? 'organic'
            : r.category === 'inorganic' ? 'inorganic'
            : r.category === 'b3' ? 'b3' : 'recyclable';
          byDate[date][key] += Number(r.total_kg || 0);
        });
        setWasteData(Object.values(byDate).sort((a: any, b: any) => a.date.localeCompare(b.date)));
      }

      if (complaintRes.status === 'fulfilled') {
        const complaints = Array.isArray(complaintRes.value.data) ? complaintRes.value.data : [];
        const statusCounts: Record<string, number> = {};
        complaints.forEach((c: any) => {
          statusCounts[c.status] = (statusCounts[c.status] || 0) + 1;
        });
        const statusLabels: Record<string, string> = {
          submitted: 'Baru', verified: 'Terverifikasi', assigned: 'Ditugaskan',
          in_progress: 'Dalam Proses', resolved: 'Selesai', rejected: 'Ditolak',
        };
        const statusColors: Record<string, string> = {
          submitted: '#3B82F6', verified: '#06B6D4', assigned: '#F59E0B',
          in_progress: '#EAB308', resolved: '#22C55E', rejected: '#EF4444',
        };
        setComplaintStats(
          Object.entries(statusCounts).map(([status, value]) => ({
            name: statusLabels[status] || status,
            value,
            color: statusColors[status],
          }))
        );
      }
    } catch {
      message.error('Gagal memuat data analytics');
    }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  return (
    <div>
      <PageHeader
        title="Analytics Hub"
        description="Analisis data operasional persampahan"
        breadcrumbs={[{ label: 'Dashboard', path: '/' }, { label: 'Analytics' }]}
      />

      <Space style={{ marginBottom: 24 }}>
        <RangePicker
          value={dateRange}
          onChange={(dates) => {
            if (dates && dates[0] && dates[1]) {
              setDateRange([dates[0], dates[1]]);
            }
          }}
          format="DD MMM YYYY"
        />
      </Space>

      {/* Section 1: Volume & Collection */}
      <Text strong style={{ fontSize: 16, display: 'block', marginBottom: 16 }}>Volume & Koleksi</Text>
      <Row gutter={[16, 16]} style={{ marginBottom: 32 }}>
        <Col xs={24} lg={16}>
          <WasteTrendChart data={wasteData} loading={loading} />
        </Col>
        <Col xs={24} lg={8}>
          <CollectionRateChart data={areaRates} loading={loading} />
        </Col>
      </Row>

      {/* Section 2: Complaints & SLA */}
      <Text strong style={{ fontSize: 16, display: 'block', marginBottom: 16 }}>Keluhan & SLA</Text>
      <Row gutter={[16, 16]} style={{ marginBottom: 32 }}>
        <Col xs={24} lg={8}>
          <StatusDonutChart
            title="Distribusi Status Keluhan"
            data={complaintStats}
            centerLabel="Total"
            loading={loading}
          />
        </Col>
      </Row>
    </div>
  );
};

export default AnalyticsPage;
```

**Step 2: Add route in App.tsx**

In the authenticated routes section, add:

```tsx
import AnalyticsPage from './pages/AnalyticsPage';
// Add alongside other routes:
<Route path="/analytics" element={<AnalyticsPage />} />
```

**Step 3: Verify build**

```bash
cd /opt/buzzr && pnpm run build --filter=@buzzr/web
```

**Step 4: Commit**

```bash
git add apps/web/src/pages/AnalyticsPage.tsx apps/web/src/App.tsx
git commit -m "feat(web): add Analytics Hub page with interactive charts and global filters"
```
