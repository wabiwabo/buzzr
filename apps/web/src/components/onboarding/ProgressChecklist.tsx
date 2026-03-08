import React, { useState } from 'react';
import { CheckCircle, ChevronRight, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

export interface ChecklistItem {
  key: string;
  label: string;
  description: string;
  path: string;
  completed: boolean;
}

interface ProgressChecklistProps {
  items: ChecklistItem[];
  onDismiss: () => void;
  onItemClick?: (key: string) => void;
}

export const ProgressChecklist: React.FC<ProgressChecklistProps> = ({
  items,
  onDismiss,
  onItemClick,
}) => {
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState(true);
  const completedCount = items.filter((i) => i.completed).length;
  const pct = items.length > 0 ? Math.round((completedCount / items.length) * 100) : 0;

  if (!expanded) {
    return (
      <div
        onClick={() => setExpanded(true)}
        className="flex items-center gap-2 px-4 py-2 border-t cursor-pointer hover:bg-muted/50 transition-colors"
      >
        <Progress value={pct} className="h-1.5 w-6" />
        <span className="text-xs">Setup {completedCount}/{items.length}</span>
      </div>
    );
  }

  return (
    <div className="border-t px-4 py-3">
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm font-medium">Setup Awal</span>
        <Button variant="ghost" size="icon" className="h-5 w-5" onClick={onDismiss}>
          <X className="h-3 w-3" />
        </Button>
      </div>
      <Progress value={pct} className="h-1.5 mb-2" />
      <span className="text-xs text-muted-foreground block mb-2">
        {completedCount} dari {items.length} selesai
      </span>
      <div className="flex flex-col gap-1">
        {items.map((item) => (
          <div
            key={item.key}
            onClick={() => {
              onItemClick?.(item.key);
              navigate(item.path);
            }}
            className={cn(
              'flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer transition-colors',
              item.completed ? 'bg-positive/5' : 'hover:bg-muted/50',
            )}
          >
            <CheckCircle className={cn('h-3.5 w-3.5 shrink-0', item.completed ? 'text-positive' : 'text-muted-foreground/30')} />
            <span className={cn('text-xs flex-1', item.completed && 'line-through text-muted-foreground')}>
              {item.label}
            </span>
            {!item.completed && <ChevronRight className="h-3 w-3 text-muted-foreground" />}
          </div>
        ))}
      </div>
    </div>
  );
};
