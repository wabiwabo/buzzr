import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

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
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        {trigger}
      </PopoverTrigger>
      <PopoverContent className="min-w-[240px]">
        <p className="text-sm font-medium mb-3">{title}</p>
        {children}
        <div className="flex justify-end gap-2 mt-3">
          <Button variant="outline" size="sm" onClick={() => setOpen(false)}>Batal</Button>
          <Button size="sm" onClick={handleConfirm} disabled={loading}>
            {loading ? 'Memproses...' : confirmLabel}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
};
