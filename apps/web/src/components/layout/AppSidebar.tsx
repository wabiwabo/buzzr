import React, { useState } from 'react';
import { Search, LogOut, ChevronDown } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { getMenuSections } from '../../config/menu';
import { usePermission } from '../../hooks/usePermission';
import { ProgressChecklist } from '../onboarding/ProgressChecklist';
import type { ChecklistItem } from '../onboarding/ProgressChecklist';
import type { MenuSection, MenuItem } from '../../config/menu';

interface AppSidebarProps {
  collapsed: boolean;
  onCollapse: (collapsed: boolean) => void;
  onRestartTour?: () => void;
  userName?: string;
  userRole?: string;
  tenantName?: string;
  onLogout?: () => void;
  badgeCounts?: Record<string, number>;
  checklistItems?: ChecklistItem[];
  checklistDismissed?: boolean;
  onChecklistDismiss?: () => void;
  onChecklistItemClick?: (key: string) => void;
}

export const AppSidebar: React.FC<AppSidebarProps> = ({
  collapsed,
  userName = 'Admin',
  userRole = '',
  tenantName = 'Buzzr',
  onLogout,
  badgeCounts = {},
  checklistItems,
  checklistDismissed = false,
  onChecklistDismiss,
  onChecklistItemClick,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { can, isSuperAdmin } = usePermission();

  const sections = getMenuSections(isSuperAdmin);
  const [expandedKeys, setExpandedKeys] = useState<Set<string>>(new Set());

  const filterByPermission = (item: MenuItem): boolean => {
    if (!item.permission) return true;
    return can(item.permission);
  };

  const toggleExpand = (key: string) => {
    setExpandedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const renderItem = (item: MenuItem) => {
    const isActive = location.pathname === item.key;
    const badge = item.badge ? badgeCounts[item.badge] : 0;

    if (item.children) {
      const visibleChildren = item.children.filter(filterByPermission);
      if (visibleChildren.length === 0) return null;
      const isExpanded = expandedKeys.has(item.key);
      const hasActiveChild = visibleChildren.some((c) => location.pathname === c.key);

      return (
        <div key={item.key}>
          <button
            onClick={() => toggleExpand(item.key)}
            className={cn(
              'flex items-center gap-3 w-full px-3 py-2 rounded-md text-sm transition-colors',
              hasActiveChild ? 'text-foreground bg-muted/50' : 'text-muted-foreground hover:text-foreground hover:bg-muted/50',
            )}
          >
            {item.icon}
            {!collapsed && (
              <>
                <span className="flex-1 text-left">{item.label}</span>
                <ChevronDown className={cn('h-3.5 w-3.5 transition-transform', isExpanded && 'rotate-180')} />
              </>
            )}
          </button>
          {!collapsed && isExpanded && (
            <div className="ml-4 pl-3 border-l space-y-0.5 mt-0.5">
              {visibleChildren.map((child) => renderItem(child))}
            </div>
          )}
        </div>
      );
    }

    return (
      <button
        key={item.key}
        onClick={() => navigate(item.key)}
        className={cn(
          'flex items-center gap-3 w-full px-3 py-2 rounded-md text-sm transition-colors',
          isActive
            ? 'text-primary bg-primary/5 font-medium'
            : 'text-muted-foreground hover:text-foreground hover:bg-muted/50',
        )}
      >
        {item.icon}
        {!collapsed && (
          <>
            <span className="flex-1 text-left">{item.label}</span>
            {badge && badge > 0 ? (
              <span className="h-5 min-w-5 px-1.5 rounded-full bg-destructive text-destructive-foreground text-[10px] font-medium flex items-center justify-center">
                {badge}
              </span>
            ) : null}
          </>
        )}
      </button>
    );
  };

  const renderSection = (section: MenuSection) => {
    const visibleItems = section.items.filter(filterByPermission);
    if (visibleItems.length === 0) return null;

    return (
      <div key={section.key} className="mb-2">
        {section.label && !collapsed && (
          <div className="px-3 py-2">
            <span className="text-[11px] font-medium text-muted-foreground tracking-wider">
              {section.label}
            </span>
          </div>
        )}
        <div className="space-y-0.5 px-2">
          {visibleItems.map((item) => renderItem(item))}
        </div>
      </div>
    );
  };

  return (
    <aside
      className={cn(
        'fixed inset-y-0 left-0 z-[100] flex flex-col border-r bg-background transition-[width] duration-200',
        collapsed ? 'w-16' : 'w-60',
      )}
    >
      {/* Logo */}
      <div className={cn('border-b', collapsed ? 'px-2 py-4' : 'px-5 py-4')}>
        <span className="text-lg font-bold tracking-wide">
          {collapsed ? 'B' : 'Buzzr'}
        </span>
        {!collapsed && (
          <span className="block text-xs text-muted-foreground mt-0.5">{tenantName}</span>
        )}
      </div>

      {/* Search */}
      {!collapsed && (
        <div className="px-4 pt-3 pb-1">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Cari..."
              id="global-search-input"
              className="pl-8 h-8 text-sm bg-muted/30"
            />
            <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">/</span>
          </div>
        </div>
      )}

      {/* Menu */}
      <ScrollArea className="flex-1 pt-2">
        {sections.map((section) => renderSection(section))}
      </ScrollArea>

      {/* Onboarding Checklist */}
      {checklistItems && !checklistDismissed && !collapsed && (
        <ProgressChecklist
          items={checklistItems}
          onDismiss={onChecklistDismiss || (() => {})}
          onItemClick={onChecklistItemClick}
        />
      )}

      {/* User Card */}
      <div className={cn('border-t', collapsed ? 'px-2 py-3' : 'px-4 py-3')}>
        {collapsed ? (
          <div className="flex justify-center">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                {userName.charAt(0)}
              </AvatarFallback>
            </Avatar>
          </div>
        ) : (
          <div className="flex items-center gap-2.5">
            <Avatar className="h-8 w-8 shrink-0">
              <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                {userName.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{userName}</p>
              <p className="text-xs text-muted-foreground">{userRole}</p>
            </div>
            <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={onLogout}>
              <LogOut className="h-3.5 w-3.5" />
            </Button>
          </div>
        )}
      </div>
    </aside>
  );
};
