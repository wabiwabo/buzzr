import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { NotificationGateway } from './notification.gateway';

@Injectable()
export class NotificationService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly gateway: NotificationGateway,
  ) {}

  async createNotification(tenantSchema: string, data: { userId: string; title: string; body?: string; type?: string; data?: any }) {
    const result = await this.dataSource.query(
      `INSERT INTO "${tenantSchema}".notifications (user_id, title, body, type, data)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [data.userId, data.title, data.body || null, data.type || null, data.data ? JSON.stringify(data.data) : null],
    );

    // Real-time fan-out to any connected clients for this user.
    // (FCM push for closed-app delivery is still pending — see backlog.)
    this.gateway.broadcastToUser(tenantSchema, data.userId, result[0]);

    return result[0];
  }

  async listNotifications(tenantSchema: string, userId: string) {
    return this.dataSource.query(
      `SELECT * FROM "${tenantSchema}".notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50`,
      [userId],
    );
  }

  async getUnreadCount(tenantSchema: string, userId: string): Promise<number> {
    const result = await this.dataSource.query(
      `SELECT COUNT(*)::int as count FROM "${tenantSchema}".notifications WHERE user_id = $1 AND is_read = false`,
      [userId],
    );
    return parseInt(result[0].count, 10);
  }

  async markAsRead(tenantSchema: string, notificationId: string) {
    const result = await this.dataSource.query(
      `UPDATE "${tenantSchema}".notifications SET is_read = true WHERE id = $1 RETURNING *`,
      [notificationId],
    );
    return result[0];
  }

  async sendPushToDriver(tenantSchema: string, data: { driverId: string; title: string; body: string; type?: string }) {
    return this.createNotification(tenantSchema, {
      userId: data.driverId,
      title: data.title,
      body: data.body,
      type: data.type || 'dispatch',
    });
  }

  async markAllAsRead(tenantSchema: string, userId: string) {
    await this.dataSource.query(
      `UPDATE "${tenantSchema}".notifications SET is_read = true WHERE user_id = $1 AND is_read = false`,
      [userId],
    );
    return { message: 'Semua notifikasi telah dibaca' };
  }
}
