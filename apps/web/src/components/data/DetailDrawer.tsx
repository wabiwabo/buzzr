import React from 'react';
import { Drawer, Descriptions, Timeline, Typography } from 'antd';

const { Text } = Typography;

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
