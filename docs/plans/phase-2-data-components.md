# Phase 2: Data Components — SmartTable, FilterPanel, DetailDrawer

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build the reusable data display components that all pages will use.

**Depends on:** Phase 1 complete.

---

### Task 5: useTableState Hook & useExport Hook

**Files:**
- Create: `apps/web/src/hooks/useTableState.ts`
- Create: `apps/web/src/hooks/useExport.ts`

**Step 1: Create useTableState**

Create `apps/web/src/hooks/useTableState.ts`:

```ts
import { useState, useMemo, useCallback } from 'react';

export interface FilterDef {
  key: string;
  label: string;
  type: 'select' | 'date-range' | 'number-range';
  options?: { label: string; value: string }[];
}

export interface TableState<T> {
  // Data
  data: T[];
  filteredData: T[];
  loading: boolean;
  // Search
  searchText: string;
  setSearchText: (text: string) => void;
  // Filters
  filters: Record<string, any>;
  setFilter: (key: string, value: any) => void;
  resetFilters: () => void;
  activeFilterCount: number;
  // Sort
  sortField: string | null;
  sortOrder: 'ascend' | 'descend' | null;
  setSort: (field: string | null, order: 'ascend' | 'descend' | null) => void;
  // Pagination
  page: number;
  pageSize: number;
  setPage: (page: number) => void;
  setPageSize: (size: number) => void;
  total: number;
  // Bulk selection
  selectedRowKeys: React.Key[];
  setSelectedRowKeys: (keys: React.Key[]) => void;
  clearSelection: () => void;
  // Setters
  setData: (data: T[]) => void;
  setLoading: (loading: boolean) => void;
}

interface UseTableStateOptions<T> {
  searchFields?: (keyof T)[];
  defaultPageSize?: number;
  defaultSortField?: string;
  defaultSortOrder?: 'ascend' | 'descend';
}

export function useTableState<T extends Record<string, any>>(
  options: UseTableStateOptions<T> = {},
): TableState<T> {
  const {
    searchFields = [],
    defaultPageSize = 10,
    defaultSortField = null,
    defaultSortOrder = null,
  } = options;

  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [filters, setFilters] = useState<Record<string, any>>({});
  const [sortField, setSortField] = useState<string | null>(defaultSortField);
  const [sortOrder, setSortOrder] = useState<'ascend' | 'descend' | null>(defaultSortOrder);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(defaultPageSize);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);

  const setFilter = useCallback((key: string, value: any) => {
    setFilters((prev) => {
      if (value === undefined || value === null || value === '') {
        const next = { ...prev };
        delete next[key];
        return next;
      }
      return { ...prev, [key]: value };
    });
    setPage(1);
  }, []);

  const resetFilters = useCallback(() => {
    setFilters({});
    setSearchText('');
    setPage(1);
  }, []);

  const setSort = useCallback((field: string | null, order: 'ascend' | 'descend' | null) => {
    setSortField(field);
    setSortOrder(order);
  }, []);

  const clearSelection = useCallback(() => setSelectedRowKeys([]), []);

  const activeFilterCount = Object.keys(filters).length;

  const filteredData = useMemo(() => {
    let result = [...data];

    // Search
    if (searchText && searchFields.length > 0) {
      const lower = searchText.toLowerCase();
      result = result.filter((item) =>
        searchFields.some((field) => {
          const val = item[field];
          return val && String(val).toLowerCase().includes(lower);
        }),
      );
    }

    // Filters
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        result = result.filter((item) => {
          const itemVal = item[key];
          if (Array.isArray(value)) {
            return value.includes(itemVal);
          }
          return String(itemVal) === String(value);
        });
      }
    });

    // Sort
    if (sortField && sortOrder) {
      result.sort((a, b) => {
        const aVal = a[sortField];
        const bVal = b[sortField];
        if (aVal == null) return 1;
        if (bVal == null) return -1;
        const cmp = typeof aVal === 'number'
          ? aVal - (bVal as number)
          : String(aVal).localeCompare(String(bVal));
        return sortOrder === 'ascend' ? cmp : -cmp;
      });
    }

    return result;
  }, [data, searchText, searchFields, filters, sortField, sortOrder]);

  return {
    data,
    filteredData,
    loading,
    searchText,
    setSearchText,
    filters,
    setFilter,
    resetFilters,
    activeFilterCount,
    sortField,
    sortOrder,
    setSort,
    page,
    pageSize,
    setPage,
    setPageSize,
    total: filteredData.length,
    selectedRowKeys,
    setSelectedRowKeys,
    clearSelection,
    setData,
    setLoading,
  };
}
```

**Step 2: Create useExport**

Create `apps/web/src/hooks/useExport.ts`:

```ts
import { useCallback } from 'react';
import { saveAs } from 'file-saver';
import * as XLSX from 'xlsx';

interface ExportColumn {
  title: string;
  dataIndex: string;
  render?: (value: any, record: any) => string;
}

export function useExport() {
  const exportCSV = useCallback(
    (data: Record<string, any>[], columns: ExportColumn[], fileName: string) => {
      const header = columns.map((c) => c.title).join(',');
      const rows = data.map((row) =>
        columns
          .map((col) => {
            const val = col.render
              ? col.render(row[col.dataIndex], row)
              : row[col.dataIndex];
            const str = String(val ?? '');
            return str.includes(',') ? `"${str}"` : str;
          })
          .join(','),
      );
      const csv = [header, ...rows].join('\n');
      const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' });
      saveAs(blob, `${fileName}.csv`);
    },
    [],
  );

  const exportExcel = useCallback(
    (data: Record<string, any>[], columns: ExportColumn[], fileName: string) => {
      const sheetData = data.map((row) => {
        const obj: Record<string, any> = {};
        columns.forEach((col) => {
          obj[col.title] = col.render
            ? col.render(row[col.dataIndex], row)
            : row[col.dataIndex] ?? '';
        });
        return obj;
      });
      const ws = XLSX.utils.json_to_sheet(sheetData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Data');
      XLSX.writeFile(wb, `${fileName}.xlsx`);
    },
    [],
  );

  return { exportCSV, exportExcel };
}
```

**Step 3: Commit**

```bash
git add apps/web/src/hooks/useTableState.ts apps/web/src/hooks/useExport.ts
git commit -m "feat(web): add useTableState and useExport hooks"
```

---

### Task 6: SmartTable Component

**Files:**
- Create: `apps/web/src/components/data/SmartTable.tsx`

**Step 1: Create SmartTable**

Create `apps/web/src/components/data/SmartTable.tsx`:

```tsx
import React, { useState } from 'react';
import {
  Table, Input, Button, Space, Tag, Dropdown, Typography, Checkbox,
} from 'antd';
import {
  SearchOutlined, FilterOutlined, DownloadOutlined,
  ReloadOutlined, MoreOutlined, ClearOutlined,
} from '@ant-design/icons';
import type { ColumnsType, TablePaginationConfig } from 'antd/es/table';
import type { TableState, FilterDef } from '../../hooks/useTableState';
import { useExport } from '../../hooks/useExport';
import { EmptyState } from '../common/EmptyState';
import { FilterPanel } from './FilterPanel';

const { Text } = Typography;

interface BulkAction {
  key: string;
  label: string;
  danger?: boolean;
  onClick: (selectedKeys: React.Key[]) => void;
}

interface ExportColumn {
  title: string;
  dataIndex: string;
  render?: (value: any, record: any) => string;
}

interface SmartTableProps<T> {
  tableState: TableState<T>;
  columns: ColumnsType<T>;
  rowKey?: string;
  // Search
  searchPlaceholder?: string;
  // Filters
  filterDefs?: FilterDef[];
  // Bulk actions
  bulkActions?: BulkAction[];
  // Export
  exportFileName?: string;
  exportColumns?: ExportColumn[];
  // Expandable
  expandable?: {
    expandedRowRender: (record: T) => React.ReactNode;
  };
  // Row actions
  onRowClick?: (record: T) => void;
  // Empty
  emptyTitle?: string;
  emptyDescription?: string;
  emptyActionLabel?: string;
  onEmptyAction?: () => void;
  // Refresh
  onRefresh?: () => void;
  // Extra toolbar
  toolbarExtra?: React.ReactNode;
}

export function SmartTable<T extends Record<string, any>>({
  tableState,
  columns,
  rowKey = 'id',
  searchPlaceholder = 'Cari...',
  filterDefs,
  bulkActions,
  exportFileName,
  exportColumns,
  expandable,
  onRowClick,
  emptyTitle = 'Tidak ada data',
  emptyDescription,
  emptyActionLabel,
  onEmptyAction,
  onRefresh,
  toolbarExtra,
}: SmartTableProps<T>) {
  const [filterOpen, setFilterOpen] = useState(false);
  const { exportCSV, exportExcel } = useExport();

  const {
    filteredData, loading, searchText, setSearchText,
    filters, setFilter, resetFilters, activeFilterCount,
    page, pageSize, setPage, setPageSize, total,
    selectedRowKeys, setSelectedRowKeys, clearSelection,
  } = tableState;

  const paginatedData = filteredData.slice((page - 1) * pageSize, page * pageSize);

  const pagination: TablePaginationConfig = {
    current: page,
    pageSize,
    total,
    onChange: (p, ps) => { setPage(p); setPageSize(ps); },
    showSizeChanger: true,
    pageSizeOptions: ['10', '25', '50'],
    showTotal: (t, range) => `${range[0]}-${range[1]} dari ${t}`,
    size: 'default',
  };

  const rowSelection = bulkActions
    ? {
        selectedRowKeys,
        onChange: (keys: React.Key[]) => setSelectedRowKeys(keys),
      }
    : undefined;

  const handleExport = (format: 'csv' | 'excel') => {
    if (!exportFileName || !exportColumns) return;
    const dataToExport = filteredData;
    if (format === 'csv') {
      exportCSV(dataToExport, exportColumns, exportFileName);
    } else {
      exportExcel(dataToExport, exportColumns, exportFileName);
    }
  };

  // Build skeleton loading rows
  const skeletonColumns = columns.map((col) => ({
    ...col,
    render: () => <div className="skeleton-row" style={{ width: '80%' }} />,
  }));

  return (
    <div>
      {/* Toolbar */}
      <div className="smart-table-toolbar">
        <Input
          placeholder={searchPlaceholder}
          prefix={<SearchOutlined style={{ color: 'rgba(0,0,0,0.3)' }} />}
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          allowClear
          style={{ maxWidth: 320 }}
        />

        {filterDefs && filterDefs.length > 0 && (
          <Button
            icon={<FilterOutlined />}
            onClick={() => setFilterOpen(!filterOpen)}
            type={activeFilterCount > 0 ? 'primary' : 'default'}
            ghost={activeFilterCount > 0}
          >
            Filter {activeFilterCount > 0 && `(${activeFilterCount})`}
          </Button>
        )}

        {exportFileName && exportColumns && (
          <Dropdown
            menu={{
              items: [
                { key: 'csv', label: 'Export CSV', onClick: () => handleExport('csv') },
                { key: 'excel', label: 'Export Excel', onClick: () => handleExport('excel') },
              ],
            }}
          >
            <Button icon={<DownloadOutlined />}>Export</Button>
          </Dropdown>
        )}

        {onRefresh && (
          <Button icon={<ReloadOutlined />} onClick={onRefresh} title="Refresh" />
        )}

        {toolbarExtra}

        {/* Bulk action bar */}
        {bulkActions && selectedRowKeys.length > 0 && (
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Text type="secondary">{selectedRowKeys.length} dipilih</Text>
            {bulkActions.map((action) => (
              <Button
                key={action.key}
                size="small"
                danger={action.danger}
                onClick={() => action.onClick(selectedRowKeys)}
              >
                {action.label}
              </Button>
            ))}
            <Button size="small" type="link" onClick={clearSelection}>
              Batal
            </Button>
          </div>
        )}
      </div>

      {/* Active filter chips */}
      {activeFilterCount > 0 && (
        <div style={{ marginBottom: 12, display: 'flex', gap: 4, flexWrap: 'wrap', alignItems: 'center' }}>
          <Text type="secondary" style={{ fontSize: 12, marginRight: 4 }}>Filter aktif:</Text>
          {Object.entries(filters).map(([key, value]) => (
            <Tag
              key={key}
              closable
              onClose={() => setFilter(key, undefined)}
              className="filter-chip"
            >
              {key}: {String(value)}
            </Tag>
          ))}
          <Button type="link" size="small" icon={<ClearOutlined />} onClick={resetFilters}>
            Reset semua
          </Button>
        </div>
      )}

      {/* Filter panel */}
      {filterOpen && filterDefs && (
        <FilterPanel
          filters={filterDefs}
          values={filters}
          onChange={setFilter}
          onReset={resetFilters}
          onClose={() => setFilterOpen(false)}
        />
      )}

      {/* Table */}
      <Table
        columns={loading ? skeletonColumns as ColumnsType<T> : columns}
        dataSource={loading ? Array.from({ length: 5 }, (_, i) => ({ [rowKey]: `skeleton-${i}` } as any)) : paginatedData}
        rowKey={rowKey}
        pagination={pagination}
        rowSelection={rowSelection}
        expandable={expandable}
        onRow={onRowClick ? (record) => ({ onClick: () => onRowClick(record), style: { cursor: 'pointer' } }) : undefined}
        locale={{
          emptyText: (
            <EmptyState
              type={searchText || activeFilterCount > 0 ? 'no-results' : 'no-data'}
              title={searchText || activeFilterCount > 0 ? 'Tidak ada data yang cocok' : emptyTitle}
              description={searchText || activeFilterCount > 0 ? 'Coba ubah kata kunci atau filter' : emptyDescription}
              actionLabel={searchText || activeFilterCount > 0 ? 'Reset Filter' : emptyActionLabel}
              onAction={searchText || activeFilterCount > 0 ? resetFilters : onEmptyAction}
            />
          ),
        }}
        size="middle"
        scroll={{ x: 'max-content' }}
      />
    </div>
  );
}
```

**Step 2: Commit**

```bash
mkdir -p apps/web/src/components/data
git add apps/web/src/components/data/SmartTable.tsx
git commit -m "feat(web): add SmartTable component with search, filter, export, bulk actions"
```

---

### Task 7: FilterPanel & DetailDrawer Components

**Files:**
- Create: `apps/web/src/components/data/FilterPanel.tsx`
- Create: `apps/web/src/components/data/DetailDrawer.tsx`
- Create: `apps/web/src/components/data/index.ts`

**Step 1: Create FilterPanel**

Create `apps/web/src/components/data/FilterPanel.tsx`:

```tsx
import React from 'react';
import { Card, Row, Col, Select, Button, Space, DatePicker } from 'antd';
import { CloseOutlined } from '@ant-design/icons';
import type { FilterDef } from '../../hooks/useTableState';

const { RangePicker } = DatePicker;

interface FilterPanelProps {
  filters: FilterDef[];
  values: Record<string, any>;
  onChange: (key: string, value: any) => void;
  onReset: () => void;
  onClose: () => void;
}

export const FilterPanel: React.FC<FilterPanelProps> = ({
  filters,
  values,
  onChange,
  onReset,
  onClose,
}) => (
  <Card
    size="small"
    style={{ marginBottom: 16 }}
    title="Filter Lanjutan"
    extra={
      <Button type="text" icon={<CloseOutlined />} size="small" onClick={onClose} />
    }
  >
    <Row gutter={[16, 12]}>
      {filters.map((filter) => (
        <Col key={filter.key} xs={24} sm={12} md={8} lg={6}>
          <div style={{ marginBottom: 4, fontSize: 12, color: 'rgba(0,0,0,0.55)' }}>
            {filter.label}
          </div>
          {filter.type === 'select' && (
            <Select
              style={{ width: '100%' }}
              placeholder={`Pilih ${filter.label}`}
              value={values[filter.key]}
              onChange={(val) => onChange(filter.key, val)}
              allowClear
              options={filter.options}
              size="small"
            />
          )}
          {filter.type === 'date-range' && (
            <RangePicker
              style={{ width: '100%' }}
              value={values[filter.key]}
              onChange={(val) => onChange(filter.key, val)}
              size="small"
            />
          )}
        </Col>
      ))}
      <Col xs={24} style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
        <Button size="small" onClick={onReset}>Reset</Button>
        <Button size="small" type="primary" onClick={onClose}>Terapkan</Button>
      </Col>
    </Row>
  </Card>
);
```

**Step 2: Create DetailDrawer**

Create `apps/web/src/components/data/DetailDrawer.tsx`:

```tsx
import React from 'react';
import { Drawer, Descriptions, Space, Button, Divider, Timeline, Typography } from 'antd';

const { Text, Title } = Typography;

interface DetailField {
  label: string;
  value: React.ReactNode;
  span?: number;
}

interface TimelineItem {
  label: string;
  time: string;
  color?: string;
}

interface DetailDrawerProps {
  open: boolean;
  onClose: () => void;
  title: string;
  fields: DetailField[];
  timeline?: TimelineItem[];
  actions?: React.ReactNode;
  extra?: React.ReactNode;
  width?: number;
}

export const DetailDrawer: React.FC<DetailDrawerProps> = ({
  open,
  onClose,
  title,
  fields,
  timeline,
  actions,
  extra,
  width = 480,
}) => (
  <Drawer
    title={title}
    open={open}
    onClose={onClose}
    width={width}
    className="detail-drawer"
    footer={actions && (
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
        {actions}
      </div>
    )}
  >
    <div className="detail-drawer-section">
      <Descriptions column={1} size="small" colon={false}>
        {fields.map((field, i) => (
          <Descriptions.Item key={i} label={
            <Text type="secondary" style={{ fontSize: 13 }}>{field.label}</Text>
          }>
            {field.value}
          </Descriptions.Item>
        ))}
      </Descriptions>
    </div>

    {extra && (
      <div className="detail-drawer-section">
        {extra}
      </div>
    )}

    {timeline && timeline.length > 0 && (
      <div className="detail-drawer-section">
        <Text strong style={{ display: 'block', marginBottom: 12 }}>Riwayat</Text>
        <Timeline
          items={timeline.map((item) => ({
            color: item.color || 'blue',
            children: (
              <div>
                <Text style={{ fontSize: 13 }}>{item.label}</Text>
                <br />
                <Text type="secondary" style={{ fontSize: 11 }}>{item.time}</Text>
              </div>
            ),
          }))}
        />
      </div>
    )}
  </Drawer>
);
```

**Step 3: Create barrel export**

Create `apps/web/src/components/data/index.ts`:

```ts
export { SmartTable } from './SmartTable';
export { FilterPanel } from './FilterPanel';
export { DetailDrawer } from './DetailDrawer';
```

**Step 4: Commit**

```bash
git add apps/web/src/components/data/
git commit -m "feat(web): add FilterPanel and DetailDrawer components"
```

---

### Task 8: ActivityFeed Component

**Files:**
- Create: `apps/web/src/components/feedback/ActivityFeed.tsx`
- Create: `apps/web/src/components/feedback/index.ts`

**Step 1: Create ActivityFeed**

Create `apps/web/src/components/feedback/ActivityFeed.tsx`:

```tsx
import React from 'react';
import { Timeline, Typography, Card, Button } from 'antd';
import {
  UserOutlined, CarOutlined, AlertOutlined,
  DollarOutlined, CheckCircleOutlined, ClockCircleOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/id';

dayjs.extend(relativeTime);
dayjs.locale('id');

export interface ActivityItem {
  id: string;
  type: 'complaint' | 'driver' | 'payment' | 'tps' | 'user' | 'schedule';
  message: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

const typeIcons: Record<string, React.ReactNode> = {
  complaint: <AlertOutlined style={{ color: '#1677ff' }} />,
  driver: <CarOutlined style={{ color: '#722ed1' }} />,
  payment: <DollarOutlined style={{ color: '#52c41a' }} />,
  tps: <CheckCircleOutlined style={{ color: '#faad14' }} />,
  user: <UserOutlined style={{ color: '#13c2c2' }} />,
  schedule: <ClockCircleOutlined style={{ color: '#eb2f96' }} />,
};

interface ActivityFeedProps {
  items: ActivityItem[];
  loading?: boolean;
  onViewAll?: () => void;
  maxItems?: number;
}

export const ActivityFeed: React.FC<ActivityFeedProps> = ({
  items,
  loading = false,
  onViewAll,
  maxItems = 8,
}) => {
  const displayed = items.slice(0, maxItems);

  return (
    <Card
      title="Aktivitas Terbaru"
      loading={loading}
      size="small"
      className="glass-card"
      extra={onViewAll && <Button type="link" size="small" onClick={onViewAll}>Lihat semua</Button>}
      style={{ height: '100%' }}
      bodyStyle={{ maxHeight: 400, overflowY: 'auto' }}
    >
      <Timeline
        items={displayed.map((item) => ({
          dot: typeIcons[item.type] || <ClockCircleOutlined />,
          children: (
            <div>
              <Typography.Text style={{ fontSize: 13 }}>{item.message}</Typography.Text>
              <br />
              <Typography.Text type="secondary" style={{ fontSize: 11 }}>
                {dayjs(item.timestamp).fromNow()}
              </Typography.Text>
            </div>
          ),
        }))}
      />
    </Card>
  );
};
```

**Step 2: Create barrel**

Create `apps/web/src/components/feedback/index.ts`:

```ts
export { ActivityFeed } from './ActivityFeed';
```

**Step 3: Commit**

```bash
mkdir -p apps/web/src/components/feedback
git add apps/web/src/components/feedback/
git commit -m "feat(web): add ActivityFeed component"
```
