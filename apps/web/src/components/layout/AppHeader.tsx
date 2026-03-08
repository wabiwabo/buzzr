import React from 'react';
import { PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { NotificationBell } from '../feedback/NotificationBell';

interface AppHeaderProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
  notificationBellRef?: React.RefObject<HTMLElement>;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  collapsed,
  onToggleCollapse,
  notificationBellRef,
}) => (
  <header className="sticky top-0 z-[99] flex items-center justify-between h-14 px-6 bg-background border-b">
    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onToggleCollapse}>
      {collapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
    </Button>

    <div className="flex items-center gap-3">
      <span ref={notificationBellRef as React.RefObject<HTMLSpanElement>}>
        <NotificationBell />
      </span>
    </div>
  </header>
);
