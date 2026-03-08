import React from 'react';
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter,
} from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';

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

const dotColor: Record<string, string> = {
  blue: 'bg-info',
  green: 'bg-positive',
  red: 'bg-negative',
  orange: 'bg-warning',
};

export const DetailDrawer: React.FC<DetailDrawerProps> = ({
  open,
  onClose,
  title,
  fields,
  timeline,
  actions,
  extra,
}) => (
  <Sheet open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
    <SheetContent side="right" className="sm:max-w-md flex flex-col">
      <SheetHeader>
        <SheetTitle>{title}</SheetTitle>
      </SheetHeader>
      <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-4">
        <div className="space-y-3">
          {fields.map((field, i) => (
            <div key={i} className="flex justify-between items-start gap-4">
              <span className="text-sm text-muted-foreground shrink-0">{field.label}</span>
              <span className="text-sm text-right">{field.value}</span>
            </div>
          ))}
        </div>

        {extra && (
          <>
            <Separator />
            {extra}
          </>
        )}

        {timeline && timeline.length > 0 && (
          <>
            <Separator />
            <div>
              <p className="text-sm font-medium mb-3">Riwayat</p>
              <div className="space-y-3">
                {timeline.map((item, i) => (
                  <div key={i} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <span className={`w-2 h-2 rounded-full shrink-0 mt-1.5 ${dotColor[item.color || 'blue'] || 'bg-info'}`} />
                      {i < timeline.length - 1 && <div className="w-px flex-1 bg-border mt-1" />}
                    </div>
                    <div className="pb-3">
                      <p className="text-sm">{item.label}</p>
                      <p className="text-xs text-muted-foreground">{item.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
      {actions && (
        <SheetFooter className="flex-row justify-end gap-2">
          {actions}
        </SheetFooter>
      )}
    </SheetContent>
  </Sheet>
);
