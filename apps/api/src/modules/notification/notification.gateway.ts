import { WebSocketGateway, WebSocketServer, SubscribeMessage, MessageBody, ConnectedSocket } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({ namespace: '/notifications', cors: { origin: '*' } })
export class NotificationGateway {
  @WebSocketServer()
  server!: Server;

  @SubscribeMessage('notifications:subscribe')
  handleSubscribe(
    @MessageBody() data: { tenantSchema: string; userId: string },
    @ConnectedSocket() client: Socket,
  ) {
    if (!data?.tenantSchema || !data?.userId) return;
    const sanitized = data.tenantSchema.replace(/[^a-z0-9_]/gi, '');
    if (!sanitized) return;
    client.join(`notifications:${sanitized}:${data.userId}`);
  }

  /**
   * Broadcast a freshly created notification to the recipient.
   * Called from NotificationService after the DB insert.
   */
  broadcastToUser(tenantSchema: string, userId: string, notification: any) {
    const sanitized = tenantSchema.replace(/[^a-z0-9_]/gi, '');
    if (!sanitized) return;
    this.server
      .to(`notifications:${sanitized}:${userId}`)
      .emit('notification:new', notification);
  }
}
