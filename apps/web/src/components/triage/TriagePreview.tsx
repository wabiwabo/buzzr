import { ExternalLink, MoreHorizontal, MapPin, Phone, Calendar, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { StatusStepper } from './StatusStepper';
import { SlaCountdown } from './SlaCountdown';
import { STATUS_LABELS, STATUS_TRANSITIONS } from '@/theme/tokens';

interface TimelineEntry {
  time: string;
  label: string;
  type: 'created' | 'assigned' | 'status_change' | 'note' | 'resolved' | 'rejected';
}

export interface TriagePreviewData {
  id: string;
  title: string;
  description: string;
  status: string;
  priority?: string;
  category?: string;
  area?: string;
  reporterName?: string;
  reporterPhone?: string;
  address?: string;
  coordinates?: { lat: number; lng: number };
  createdAt: string;
  slaHours?: number;
  photos?: string[];
  timeline?: TimelineEntry[];
  assigneeName?: string;
}

interface TriagePreviewProps {
  data: TriagePreviewData | null;
  onStatusTransition: (id: string, newStatus: string) => void;
  onAssign: (id: string) => void;
  className?: string;
}

const timelineTypeColor: Record<string, string> = {
  created: 'bg-info',
  assigned: 'bg-warning',
  status_change: 'bg-neutral',
  note: 'bg-neutral',
  resolved: 'bg-positive',
  rejected: 'bg-negative',
};

const actionLabels: Record<string, string> = {
  verified: 'Verifikasi',
  assigned: 'Tugaskan',
  in_progress: 'Mulai',
  resolved: 'Selesaikan',
  rejected: 'Tolak',
  submitted: 'Buka Kembali',
};

export function TriagePreview({ data, onStatusTransition, onAssign, className }: TriagePreviewProps) {
  if (!data) {
    return (
      <div className={cn('flex items-center justify-center h-full text-muted-foreground', className)}>
        <div className="text-center">
          <p className="text-sm">Pilih item dari daftar</p>
          <p className="text-xs mt-1">Tekan J/K untuk navigasi</p>
        </div>
      </div>
    );
  }

  const validTransitions = STATUS_TRANSITIONS[data.status] || [];
  const primaryAction = validTransitions[0];
  const secondaryActions = validTransitions.slice(1);

  return (
    <div className={cn('flex flex-col h-full border-l border-border', className)}>
      {/* Sticky header */}
      <div className="shrink-0 px-4 py-3 border-b border-border space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              {STATUS_LABELS[data.status] || data.status}
            </Badge>
            {data.priority && (
              <Badge
                variant={data.priority === 'p1' ? 'destructive' : 'secondary'}
                className="text-xs"
              >
                {data.priority.toUpperCase()}
              </Badge>
            )}
          </div>
          <Button variant="ghost" size="sm" className="h-7" onClick={() => onAssign(data.id)}>
            {data.assigneeName || 'Tugaskan'}
          </Button>
        </div>

        <StatusStepper currentStatus={data.status} onTransition={(s) => onStatusTransition(data.id, s)} />

        <div className="flex items-center gap-1.5 flex-wrap">
          {data.category && <Badge variant="secondary" className="text-xs">{data.category}</Badge>}
          {data.area && <Badge variant="secondary" className="text-xs">{data.area}</Badge>}
          <SlaCountdown createdAt={data.createdAt} slaHours={data.slaHours} />
        </div>
      </div>

      {/* Scrollable body */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          {/* Title & description */}
          <div>
            <h3 className="text-lg font-semibold leading-tight">{data.title}</h3>
            <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">{data.description}</p>
          </div>

          {/* Photos */}
          {data.photos && data.photos.length > 0 && (
            <div className="flex gap-2 flex-wrap">
              {data.photos.slice(0, 4).map((url, i) => (
                <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="block w-20 h-20 rounded-md overflow-hidden bg-muted">
                  <img src={url} alt={`Foto ${i + 1}`} className="w-full h-full object-cover" />
                </a>
              ))}
              {data.photos.length > 4 && (
                <div className="w-20 h-20 rounded-md bg-muted flex items-center justify-center text-xs text-muted-foreground">
                  +{data.photos.length - 4}
                </div>
              )}
            </div>
          )}

          <Separator />

          {/* Detail fields */}
          <div className="space-y-2">
            <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Detail</h4>
            <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1.5 text-sm">
              {data.reporterName && (
                <>
                  <dt className="text-muted-foreground flex items-center gap-1"><User className="h-3 w-3" />Pelapor</dt>
                  <dd>{data.reporterName}</dd>
                </>
              )}
              {data.reporterPhone && (
                <>
                  <dt className="text-muted-foreground flex items-center gap-1"><Phone className="h-3 w-3" />Telepon</dt>
                  <dd><a href={`tel:${data.reporterPhone}`} className="text-primary hover:underline">{data.reporterPhone}</a></dd>
                </>
              )}
              {data.address && (
                <>
                  <dt className="text-muted-foreground flex items-center gap-1"><MapPin className="h-3 w-3" />Alamat</dt>
                  <dd>{data.address}</dd>
                </>
              )}
              {data.coordinates && (
                <>
                  <dt className="text-muted-foreground flex items-center gap-1"><ExternalLink className="h-3 w-3" />Koordinat</dt>
                  <dd>
                    <a
                      href={`https://maps.google.com/?q=${data.coordinates.lat},${data.coordinates.lng}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      {data.coordinates.lat.toFixed(4)}, {data.coordinates.lng.toFixed(4)}
                    </a>
                  </dd>
                </>
              )}
              <dt className="text-muted-foreground flex items-center gap-1"><Calendar className="h-3 w-3" />Dibuat</dt>
              <dd>{new Date(data.createdAt).toLocaleString('id-ID')}</dd>
            </dl>
          </div>

          <Separator />

          {/* Timeline */}
          {data.timeline && data.timeline.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Aktivitas</h4>
              <div className="space-y-3 pl-3 border-l-2 border-border">
                {data.timeline.map((entry, i) => (
                  <div key={i} className="relative">
                    <div className={cn(
                      'absolute -left-[17px] top-0.5 w-2.5 h-2.5 rounded-full',
                      timelineTypeColor[entry.type] || 'bg-neutral',
                    )} />
                    <p className="text-xs text-muted-foreground">{new Date(entry.time).toLocaleString('id-ID')}</p>
                    <p className="text-sm">{entry.label}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Sticky footer */}
      <div className="shrink-0 flex items-center justify-end gap-2 px-4 py-3 border-t border-border">
        {secondaryActions.map((status) => (
          <Button
            key={status}
            variant={status === 'rejected' ? 'destructive' : 'outline'}
            size="sm"
            onClick={() => onStatusTransition(data.id, status)}
          >
            {actionLabels[status] || status}
          </Button>
        ))}
        {primaryAction && (
          <Button size="sm" onClick={() => onStatusTransition(data.id, primaryAction)}>
            {actionLabels[primaryAction] || primaryAction}
          </Button>
        )}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>Cetak</DropdownMenuItem>
            <DropdownMenuItem>Ekspor</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
