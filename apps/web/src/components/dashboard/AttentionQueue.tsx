import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface AttentionItem {
  severity: 'critical' | 'warning' | 'info';
  message: string;
  detail?: string;
  path: string;
}

interface AttentionQueueProps {
  items: AttentionItem[];
  loading?: boolean;
}

const severityDot: Record<string, string> = {
  critical: 'bg-[var(--color-severity-critical)]',
  warning: 'bg-[var(--color-severity-warning)]',
  info: 'bg-[var(--color-severity-info)]',
};

export const AttentionQueue: React.FC<AttentionQueueProps> = ({ items, loading }) => {
  const navigate = useNavigate();

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium">
          Perlu Perhatian <span className="text-muted-foreground font-normal">({items.length})</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0 p-0 max-h-[380px] overflow-y-auto">
        {loading ? (
          <div className="space-y-3 px-6 py-4">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-8 w-full" />)}
          </div>
        ) : items.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-12 px-6">
            Tidak ada masalah saat ini
          </p>
        ) : (
          items.map((item, i) => (
            <div
              key={i}
              onClick={() => navigate(item.path)}
              className="flex items-center gap-3 px-6 py-3 cursor-pointer border-b last:border-0 hover:bg-muted/50 transition-colors"
            >
              <span className={cn('w-2 h-2 rounded-full shrink-0', severityDot[item.severity])} />
              <div className="flex-1 min-w-0">
                <p className="text-sm truncate">{item.message}</p>
                {item.detail && (
                  <p className="text-xs text-muted-foreground">{item.detail}</p>
                )}
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
};
