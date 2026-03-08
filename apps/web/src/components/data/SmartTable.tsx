import React, { useState } from 'react';
import {
  Table, Input, Button, Space, Tag, Dropdown, Typography,
} from 'antd';
import {
  SearchOutlined, FilterOutlined, DownloadOutlined,
  ReloadOutlined, ClearOutlined,
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
  searchPlaceholder?: string;
  filterDefs?: FilterDef[];
  bulkActions?: BulkAction[];
  exportFileName?: string;
  exportColumns?: ExportColumn[];
  expandable?: {
    expandedRowRender: (record: T) => React.ReactNode;
  };
  onRowClick?: (record: T) => void;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyActionLabel?: string;
  onEmptyAction?: () => void;
  onRefresh?: () => void;
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
