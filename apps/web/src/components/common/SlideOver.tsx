import React from 'react';
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter,
} from '@/components/ui/sheet';

interface SlideOverProps {
  open: boolean;
  onClose: () => void;
  title: string;
  width?: number;
  footer?: React.ReactNode;
  children: React.ReactNode;
}

export const SlideOver: React.FC<SlideOverProps> = ({
  open,
  onClose,
  title,
  footer,
  children,
}) => (
  <Sheet open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
    <SheetContent side="right" className="sm:max-w-md flex flex-col">
      <SheetHeader>
        <SheetTitle>{title}</SheetTitle>
      </SheetHeader>
      <div className="flex-1 overflow-y-auto px-4 pb-4">
        {children}
      </div>
      {footer && (
        <SheetFooter className="flex-row justify-end gap-2">
          {footer}
        </SheetFooter>
      )}
    </SheetContent>
  </Sheet>
);
