import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { DataSource } from 'typeorm';
import { HealthController } from './health.controller';

// Mock the minio module
const mockListBuckets = jest.fn();

jest.mock('minio', () => ({
  Client: jest.fn().mockImplementation(() => ({
    listBuckets: mockListBuckets,
  })),
}));

describe('HealthController', () => {
  let controller: HealthController;

  const mockDataSource = {
    query: jest.fn(),
  };

  const mockRedisClient = {
    ping: jest.fn(),
  };

  const mockConfigValues: Record<string, string> = {
    MINIO_ENDPOINT: 'localhost',
    MINIO_PORT: '9000',
    MINIO_ACCESS_KEY: 'minioadmin',
    MINIO_SECRET_KEY: 'minioadmin',
    MINIO_USE_SSL: 'false',
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        {
          provide: DataSource,
          useValue: mockDataSource,
        },
        {
          provide: 'REDIS_CLIENT',
          useValue: mockRedisClient,
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn(
              (key: string, defaultValue?: string) =>
                mockConfigValues[key] ?? defaultValue,
            ),
          },
        },
      ],
    }).compile();

    controller = module.get<HealthController>(HealthController);
  });

  describe('check', () => {
    it('should return all OK when all services are healthy', async () => {
      mockDataSource.query.mockResolvedValue([{ '?column?': 1 }]);
      mockRedisClient.ping.mockResolvedValue('PONG');
      mockListBuckets.mockResolvedValue([]);

      const result = await controller.check();

      expect(result.status).toBe('ok');
      expect(result.checks.database.status).toBe('ok');
      expect(result.checks.redis.status).toBe('ok');
      expect(result.checks.minio.status).toBe('ok');
      expect(result.timestamp).toBeDefined();
      expect(result.uptime).toBeGreaterThanOrEqual(0);
    });

    it('should return error when database is down', async () => {
      mockDataSource.query.mockRejectedValue(
        new Error('Connection refused'),
      );
      mockRedisClient.ping.mockResolvedValue('PONG');
      mockListBuckets.mockResolvedValue([]);

      const result = await controller.check();

      expect(result.status).toBe('error');
      expect(result.checks.database.status).toBe('error');
      expect(result.checks.database.message).toBe('Connection refused');
      expect(result.checks.redis.status).toBe('ok');
      expect(result.checks.minio.status).toBe('ok');
    });

    it('should return error when Redis is down', async () => {
      mockDataSource.query.mockResolvedValue([{ '?column?': 1 }]);
      mockRedisClient.ping.mockRejectedValue(
        new Error('ECONNREFUSED'),
      );
      mockListBuckets.mockResolvedValue([]);

      const result = await controller.check();

      expect(result.status).toBe('error');
      expect(result.checks.database.status).toBe('ok');
      expect(result.checks.redis.status).toBe('error');
      expect(result.checks.redis.message).toBe('ECONNREFUSED');
      expect(result.checks.minio.status).toBe('ok');
    });

    it('should return error when MinIO is down', async () => {
      mockDataSource.query.mockResolvedValue([{ '?column?': 1 }]);
      mockRedisClient.ping.mockResolvedValue('PONG');
      mockListBuckets.mockRejectedValue(
        new Error('MinIO connection failed'),
      );

      const result = await controller.check();

      expect(result.status).toBe('error');
      expect(result.checks.database.status).toBe('ok');
      expect(result.checks.redis.status).toBe('ok');
      expect(result.checks.minio.status).toBe('error');
      expect(result.checks.minio.message).toBe('MinIO connection failed');
    });

    it('should return error when multiple services are down', async () => {
      mockDataSource.query.mockRejectedValue(
        new Error('DB connection lost'),
      );
      mockRedisClient.ping.mockRejectedValue(
        new Error('Redis timeout'),
      );
      mockListBuckets.mockResolvedValue([]);

      const result = await controller.check();

      expect(result.status).toBe('error');
      expect(result.checks.database.status).toBe('error');
      expect(result.checks.database.message).toBe('DB connection lost');
      expect(result.checks.redis.status).toBe('error');
      expect(result.checks.redis.message).toBe('Redis timeout');
      expect(result.checks.minio.status).toBe('ok');
    });

    it('should handle unexpected Redis ping response', async () => {
      mockDataSource.query.mockResolvedValue([{ '?column?': 1 }]);
      mockRedisClient.ping.mockResolvedValue('UNEXPECTED');
      mockListBuckets.mockResolvedValue([]);

      const result = await controller.check();

      expect(result.status).toBe('error');
      expect(result.checks.redis.status).toBe('error');
      expect(result.checks.redis.message).toContain('Unexpected ping response');
    });
  });
});
