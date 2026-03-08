import React from 'react';
import { Breadcrumb, Button, Space, Typography } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

const { Title, Text } = Typography;

interface BreadcrumbItem {
  label: string;
  path?: string;
}

interface PageHeaderProps {
  title: string;
  description?: string;
  breadcrumbs?: BreadcrumbItem[];
  primaryAction?: {
    label: string;
    onClick: () => void;
    icon?: React.ReactNode;
  };
  extra?: React.ReactNode;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  description,
  breadcrumbs,
  primaryAction,
  extra,
}) => {
  const navigate = useNavigate();

  const breadcrumbItems = breadcrumbs?.map((item) => ({
    title: item.path ? (
      <a onClick={() => navigate(item.path!)}>{item.label}</a>
    ) : (
      item.label
    ),
  }));

  return (
    <div className="page-header">
      {breadcrumbItems && breadcrumbItems.length > 0 && (
        <Breadcrumb items={breadcrumbItems} style={{ marginBottom: 8 }} />
      )}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <Title level={4} style={{ margin: 0 }}>{title}</Title>
          {description && (
            <Text className="page-header-description">{description}</Text>
          )}
        </div>
        <Space>
          {extra}
          {primaryAction && (
            <Button
              type="primary"
              icon={primaryAction.icon || <PlusOutlined />}
              onClick={primaryAction.onClick}
            >
              {primaryAction.label}
            </Button>
          )}
        </Space>
      </div>
    </div>
  );
};
