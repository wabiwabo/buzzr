import React from 'react';
import { Popconfirm, Button } from 'antd';
import type { ButtonType } from 'antd/es/button';

interface ConfirmActionProps {
  title: string;
  description?: string;
  onConfirm: () => void;
  children?: React.ReactNode;
  buttonLabel?: string;
  buttonType?: ButtonType;
  danger?: boolean;
  loading?: boolean;
}

export const ConfirmAction: React.FC<ConfirmActionProps> = ({
  title,
  description,
  onConfirm,
  children,
  buttonLabel,
  buttonType = 'default',
  danger = false,
  loading = false,
}) => (
  <Popconfirm
    title={title}
    description={description}
    onConfirm={onConfirm}
    okText="Ya"
    cancelText="Batal"
    okButtonProps={{ danger }}
  >
    {children || (
      <Button type={buttonType} danger={danger} loading={loading} size="small">
        {buttonLabel}
      </Button>
    )}
  </Popconfirm>
);
