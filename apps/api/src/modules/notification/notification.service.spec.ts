import { Test, TestingModule } from '@nestjs/testing';
import { NotificationService } from './notification.service';
import { NotificationGateway } from './notification.gateway';
import { ExpoPushService } from './expo-push.service';
import { UserService } from '../user/user.service';
import { DataSource } from 'typeorm';

describe('NotificationService', () => {
  let service: NotificationService;
  let dataSource: { query: jest.Mock };
  let gateway: { broadcastToUser: jest.Mock };
  let pushService: { sendToToken: jest.Mock };
  let userService: { getPushToken: jest.Mock };

  beforeEach(async () => {
    dataSource = { query: jest.fn() };
    gateway = { broadcastToUser: jest.fn() };
    pushService = { sendToToken: jest.fn().mockResolvedValue(undefined) };
    userService = { getPushToken: jest.fn().mockResolvedValue(null) };
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationService,
        { provide: DataSource, useValue: dataSource },
        { provide: NotificationGateway, useValue: gateway },
        { provide: ExpoPushService, useValue: pushService },
        { provide: UserService, useValue: userService },
      ],
    }).compile();
    service = module.get<NotificationService>(NotificationService);
  });

  describe('createNotification', () => {
    it('should create a notification', async () => {
      dataSource.query.mockResolvedValue([{ id: 'n-1', title: 'Laporan Anda diproses', is_read: false }]);
      const result = await service.createNotification('dlh_demo', {
        userId: 'u-1', title: 'Laporan Anda diproses', body: 'Petugas sedang menuju lokasi', type: 'complaint_update',
      });
      expect(result.is_read).toBe(false);
    });
  });

  describe('createNotification broadcasts to gateway', () => {
    it('should call gateway.broadcastToUser with the inserted row', async () => {
      const mockRow = { id: 'n-1', user_id: 'u-1', title: 'Test', body: null, type: null, data: null };
      (dataSource.query as jest.Mock).mockResolvedValue([mockRow]);

      const result = await service.createNotification('dlh_demo', {
        userId: 'u-1', title: 'Test',
      });

      expect(result).toEqual(mockRow);
      expect(gateway.broadcastToUser).toHaveBeenCalledWith('dlh_demo', 'u-1', mockRow);
    });
  });

  describe('getUnreadCount', () => {
    it('should return unread count', async () => {
      dataSource.query.mockResolvedValue([{ count: '5' }]);
      const result = await service.getUnreadCount('dlh_demo', 'u-1');
      expect(result).toBe(5);
    });
  });

  describe('markAsRead', () => {
    it('should mark notification as read', async () => {
      dataSource.query.mockResolvedValue([{ id: 'n-1', is_read: true }]);
      const result = await service.markAsRead('dlh_demo', 'n-1');
      expect(result.is_read).toBe(true);
    });
  });

  describe('sendPushToDriver', () => {
    it('should create a notification for the driver', async () => {
      dataSource.query.mockResolvedValue([{
        id: 'n-1',
        user_id: 'd-1',
        title: 'Rute baru ditugaskan',
        body: 'Anda ditugaskan ke Rute Selatan',
        type: 'dispatch',
      }]);

      const result = await service.sendPushToDriver('dlh_demo', {
        driverId: 'd-1',
        title: 'Rute baru ditugaskan',
        body: 'Anda ditugaskan ke Rute Selatan',
        type: 'dispatch',
      });

      expect(result.user_id).toBe('d-1');
      expect(result.title).toBe('Rute baru ditugaskan');
    });
  });

  describe('createNotification with push token', () => {
    it('should send a push notification when the user has a token', async () => {
      const mockRow = { id: 'n-1', user_id: 'u-1', title: 'Test', body: 'body', type: null, data: null };
      (dataSource.query as jest.Mock).mockResolvedValue([mockRow]);
      (userService.getPushToken as jest.Mock).mockResolvedValue('ExponentPushToken[abc]');

      await service.createNotification('dlh_demo', { userId: 'u-1', title: 'Test', body: 'body' });

      // Allow the fire-and-forget promise to resolve
      await new Promise((r) => setImmediate(r));

      expect(pushService.sendToToken).toHaveBeenCalledWith(expect.objectContaining({
        token: 'ExponentPushToken[abc]',
        title: 'Test',
        body: 'body',
      }));
    });
  });
});
