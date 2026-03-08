import React, { useEffect } from 'react';
import { Bell, CheckCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover, PopoverContent, PopoverTrigger,
} from '@/components/ui/popover';
import { useNotificationStore } from '../../stores/notification.store';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/id';

dayjs.extend(relativeTime);
dayjs.locale('id');

export const NotificationBell: React.FC = () => {
  const {
    notifications, unreadCount, fetchNotifications, fetchUnreadCount, markAsRead, markAllAsRead,
  } = useNotificationStore();

  useEffect(() => {
    fetchUnreadCount();
    fetchNotifications();
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, [fetchNotifications, fetchUnreadCount]);

  const unread = notifications.filter((n) => !n.read);
  const read = notifications.filter((n) => n.read);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative h-8 w-8">
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 h-4 min-w-4 px-1 rounded-full bg-destructive text-destructive-foreground text-[10px] font-medium flex items-center justify-center">
              {unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[360px] p-0">
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <span className="text-sm font-medium">Notifikasi</span>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" className="h-6 gap-1 text-xs" onClick={markAllAsRead}>
              <CheckCheck className="h-3 w-3" />
              Tandai semua dibaca
            </Button>
          )}
        </div>

        <div className="max-h-[400px] overflow-y-auto">
          {unread.length > 0 && (
            <>
              <div className="px-4 pt-2 pb-1">
                <span className="text-[11px] text-muted-foreground uppercase tracking-wider">Baru</span>
              </div>
              {unread.slice(0, 5).map((item) => (
                <div
                  key={item.id}
                  className="px-4 py-2 cursor-pointer bg-primary/5 hover:bg-primary/10 transition-colors"
                  onClick={() => markAsRead(item.id)}
                >
                  <p className="text-sm">{item.title}</p>
                  <p className="text-xs text-muted-foreground">{dayjs(item.created_at).fromNow()}</p>
                </div>
              ))}
            </>
          )}

          {read.length > 0 && (
            <>
              <div className="px-4 pt-2 pb-1">
                <span className="text-[11px] text-muted-foreground uppercase tracking-wider">Sebelumnya</span>
              </div>
              {read.slice(0, 5).map((item) => (
                <div key={item.id} className="px-4 py-2">
                  <p className="text-sm text-muted-foreground">{item.title}</p>
                  <p className="text-xs text-muted-foreground">{dayjs(item.created_at).fromNow()}</p>
                </div>
              ))}
            </>
          )}

          {notifications.length === 0 && (
            <div className="py-8 text-center">
              <p className="text-sm text-muted-foreground">Tidak ada notifikasi</p>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};
