import { Test, TestingModule } from '@nestjs/testing';
import { NotificationService } from './notification.service';
import { DataSource } from 'typeorm';

describe('NotificationService', () => {
  let service: NotificationService;
  let dataSource: { query: jest.Mock };

  beforeEach(async () => {
    dataSource = { query: jest.fn() };
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationService,
        { provide: DataSource, useValue: dataSource },
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
});
