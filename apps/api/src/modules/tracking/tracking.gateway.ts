import { WebSocketGateway, WebSocketServer, SubscribeMessage, MessageBody, ConnectedSocket } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { TrackingService } from './tracking.service';

@WebSocketGateway({ namespace: '/tracking', cors: { origin: '*' } })
export class TrackingGateway {
  @WebSocketServer()
  server!: Server;

  constructor(private readonly trackingService: TrackingService) {}

  @SubscribeMessage('gps:update')
  async handleGpsUpdate(
    @MessageBody() data: { tenantSchema: string; vehicleId: string; driverId: string; latitude: number; longitude: number; speed: number },
    @ConnectedSocket() client: Socket,
  ) {
    await this.trackingService.saveGpsLog(data.tenantSchema, {
      vehicleId: data.vehicleId,
      driverId: data.driverId,
      latitude: data.latitude,
      longitude: data.longitude,
      speed: data.speed,
    });

    // Broadcast to all subscribers in this tenant's tracking room
    this.server.to(`tracking:${data.tenantSchema}`).emit('gps:position', {
      vehicleId: data.vehicleId,
      driverId: data.driverId,
      latitude: data.latitude,
      longitude: data.longitude,
      speed: data.speed,
      timestamp: new Date().toISOString(),
    });
  }

  @SubscribeMessage('tracking:subscribe')
  handleSubscribe(
    @MessageBody() data: { tenantSchema: string },
    @ConnectedSocket() client: Socket,
  ) {
    client.join(`tracking:${data.tenantSchema}`);
  }
}
