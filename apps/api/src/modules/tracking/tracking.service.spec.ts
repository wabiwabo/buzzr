import { Test, TestingModule } from '@nestjs/testing';
import { TrackingService } from './tracking.service';
import { DataSource } from 'typeorm';

describe('TrackingService', () => {
  let service: TrackingService;
  let dataSource: { query: jest.Mock };
  let redis: { publish: jest.Mock; get: jest.Mock; set: jest.Mock };

  beforeEach(async () => {
    dataSource = { query: jest.fn() };
    redis = {
      publish: jest.fn().mockResolvedValue(1),
      get: jest.fn(),
      set: jest.fn().mockResolvedValue('OK'),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TrackingService,
        { provide: DataSource, useValue: dataSource },
        { provide: 'REDIS_CLIENT', useValue: redis },
      ],
    }).compile();

    service = module.get<TrackingService>(TrackingService);
  });

  describe('saveGpsLog', () => {
    it('should save GPS log and publish to Redis', async () => {
      redis.get.mockResolvedValue(null); // No rate limit
      dataSource.query.mockResolvedValue([{ id: 'log-1' }]);

      await service.saveGpsLog('dlh_demo', {
        vehicleId: 'v-1',
        driverId: 'd-1',
        latitude: -6.1944,
        longitude: 106.8229,
        speed: 30.5,
      });

      expect(dataSource.query).toHaveBeenCalled();
      expect(redis.publish).toHaveBeenCalledWith(
        'gps:dlh_demo',
        expect.any(String),
      );
    });

    it('should skip if rate limited', async () => {
      redis.get.mockResolvedValue('1'); // Rate limited

      await service.saveGpsLog('dlh_demo', {
        vehicleId: 'v-1',
        driverId: 'd-1',
        latitude: -6.1944,
        longitude: 106.8229,
        speed: 30.5,
      });

      expect(dataSource.query).not.toHaveBeenCalled();
    });
  });

  describe('getHistory', () => {
    it('should return GPS history for a vehicle', async () => {
      dataSource.query.mockResolvedValue([
        { latitude: -6.19, longitude: 106.82, speed: 30, recorded_at: '2026-03-07T10:00:00Z' },
      ]);

      const result = await service.getHistory('dlh_demo', 'v-1', '2026-03-07', '2026-03-07');

      expect(result).toHaveLength(1);
    });
  });
});
