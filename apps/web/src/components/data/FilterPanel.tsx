import React from 'react';
import { Card, Row, Col, Select, Button, DatePicker } from 'antd';
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
