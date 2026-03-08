import React, { useState } from 'react';
import { Popover, Button } from 'antd';

interface QuickActionProps {
  title: string;
  trigger: React.ReactNode;
  onConfirm: () => void | Promise<void>;
  confirmLabel?: string;
  loading?: boolean;
  children: React.ReactNode;
}

export const QuickAction: React.FC<QuickActionProps> = ({
  title,
  trigger,
  onConfirm,
  confirmLabel = 'Konfirmasi',
  loading = false,
  children,
}) => {
  const [open, setOpen] = useState(false);

  const handleConfirm = async () => {
    await onConfirm();
    setOpen(false);
  };

  return (
    <Popover
      title={title}
      open={open}
      onOpenChange={setOpen}
      trigger="click"
      content={
        <div style={{ minWidth: 240 }}>
          {children}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 12 }}>
            <Button size="small" onClick={() => setOpen(false)}>Batal</Button>
            <Button size="small" type="primary" onClick={handleConfirm} loading={loading}>
              {confirmLabel}
            </Button>
          </div>
        </div>
      }
    >
      {trigger}
    </Popover>
  );
};
