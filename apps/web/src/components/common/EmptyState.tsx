import React from 'react';
import { Inbox, SearchX, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface EmptyStateProps {
  type?: 'no-data' | 'no-results' | 'success';
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: React.ReactNode;
}

const defaultIcons = {
  'no-data': <Inbox className="h-12 w-12 text-muted-foreground/40" />,
  'no-results': <SearchX className="h-12 w-12 text-muted-foreground/40" />,
  'success': null,
};

export const EmptyState: React.FC<EmptyStateProps> = ({
  type = 'no-data',
  title,
  description,
  actionLabel,
  onAction,
  icon,
}) => (
  <div className="flex flex-col items-center justify-center py-12">
    {(icon || defaultIcons[type]) && (
      <div className="mb-3">{icon || defaultIcons[type]}</div>
    )}
    <p className="text-sm font-medium">{title}</p>
    {description && <p className="text-xs text-muted-foreground mt-1">{description}</p>}
    {actionLabel && onAction && (
      <Button size="sm" className="mt-4 gap-1.5" onClick={onAction}>
        <Plus className="h-3.5 w-3.5" />
        {actionLabel}
      </Button>
    )}
  </div>
);
