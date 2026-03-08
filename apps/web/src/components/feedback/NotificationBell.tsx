import React, { useEffect } from 'react';
import { Badge, Button, Dropdown, Typography, List } from 'antd';
import { BellOutlined, CheckOutlined } from '@ant-design/icons';
import { useNotificationStore } from '../../stores/notification.store';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/id';

dayjs.extend(relativeTime);
dayjs.locale('id');

const { Text } = Typography;

export const NotificationBell: React.FC = () => {
  const {
    notifications, unreadCount, loading,
    fetchNotifications, fetchUnreadCount, markAsRead, markAllAsRead,
  } = useNotificationStore();

  useEffect(() => {
    fetchUnreadCount();
    fetchNotifications();
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, [fetchNotifications, fetchUnreadCount]);

  const unread = notifications.filter((n) => !n.read);
  const read = notifications.filter((n) => n.read);

  const content = (
    <div style={{ width: 360, maxHeight: 480, overflow: 'auto' }}>
      <div style={{ padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f0f0f0' }}>
        <Text strong>Notifikasi</Text>
        {unreadCount > 0 && (
          <Button type="link" size="small" icon={<CheckOutlined />} onClick={markAllAsRead}>
            Tandai semua dibaca
          </Button>
        )}
      </div>

      {unread.length > 0 && (
        <>
          <div style={{ padding: '8px 16px 4px' }}>
            <Text type="secondary" style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: 1 }}>
              Baru
            </Text>
          </div>
          <List
            size="small"
            dataSource={unread.slice(0, 5)}
            renderItem={(item) => (
              <List.Item
                style={{ padding: '8px 16px', cursor: 'pointer', background: '#f5f8ff' }}
                onClick={() => markAsRead(item.id)}
              >
                <div>
                  <Text style={{ fontSize: 13 }}>{item.title}</Text>
                  <br />
                  <Text type="secondary" style={{ fontSize: 11 }}>
                    {dayjs(item.created_at).fromNow()}
                  </Text>
                </div>
              </List.Item>
            )}
          />
        </>
      )}

      {read.length > 0 && (
        <>
          <div style={{ padding: '8px 16px 4px' }}>
            <Text type="secondary" style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: 1 }}>
              Sebelumnya
            </Text>
          </div>
          <List
            size="small"
            dataSource={read.slice(0, 5)}
            renderItem={(item) => (
              <List.Item style={{ padding: '8px 16px' }}>
                <div>
                  <Text type="secondary" style={{ fontSize: 13 }}>{item.title}</Text>
                  <br />
                  <Text type="secondary" style={{ fontSize: 11 }}>
                    {dayjs(item.created_at).fromNow()}
                  </Text>
                </div>
              </List.Item>
            )}
          />
        </>
      )}

      {notifications.length === 0 && (
        <div style={{ padding: 24, textAlign: 'center' }}>
          <Text type="secondary">Tidak ada notifikasi</Text>
        </div>
      )}
    </div>
  );

  return (
    <Dropdown
      dropdownRender={() => content}
      trigger={['click']}
      placement="bottomRight"
    >
      <Badge count={unreadCount} size="small" offset={[-2, 2]}>
        <Button type="text" icon={<BellOutlined style={{ fontSize: 18 }} />} />
      </Badge>
    </Dropdown>
  );
};
