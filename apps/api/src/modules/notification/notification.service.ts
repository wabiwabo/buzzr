import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

@Injectable()
export class NotificationService {
  constructor(private readonly dataSource: DataSource) {}

  async createNotification(tenantSchema: string, data: { userId: string; title: string; body?: string; type?: string; data?: any }) {
    const result = await this.dataSource.query(
      `INSERT INTO "${tenantSchema}".notifications (user_id, title, body, type, data)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [data.userId, data.title, data.body || null, data.type || null, data.data ? JSON.stringify(data.data) : null],
    );
    // TODO: Send FCM push notification
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

  async markAllAsRead(tenantSchema: string, userId: string) {
    await this.dataSource.query(
      `UPDATE "${tenantSchema}".notifications SET is_read = true WHERE user_id = $1 AND is_read = false`,
      [userId],
    );
    return { message: 'Semua notifikasi telah dibaca' };
  }
}
