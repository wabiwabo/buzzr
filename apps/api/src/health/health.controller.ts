import { Controller, Get, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DataSource } from 'typeorm';
import Redis from 'ioredis';
import { Client } from 'minio';

interface HealthCheckResult {
  status: 'ok' | 'error';
  checks: {
    database: { status: 'ok' | 'error'; message?: string };
    redis: { status: 'ok' | 'error'; message?: string };
    minio: { status: 'ok' | 'error'; message?: string };
  };
  timestamp: string;
  uptime: number;
}

@Controller('health')
export class HealthController {
  private readonly minioClient: Client;

  constructor(
    private readonly dataSource: DataSource,
    @Inject('REDIS_CLIENT') private readonly redisClient: Redis,
    private readonly configService: ConfigService,
  ) {
    this.minioClient = new Client({
      endPoint: this.configService.get<string>('MINIO_ENDPOINT', 'localhost'),
      port: parseInt(this.configService.get<string>('MINIO_PORT', '9000'), 10),
      useSSL:
        this.configService.get<string>('MINIO_USE_SSL', 'false') === 'true',
      accessKey: this.configService.get<string>(
        'MINIO_ACCESS_KEY',
        'minioadmin',
      ),
      secretKey: this.configService.get<string>(
        'MINIO_SECRET_KEY',
        'minioadmin',
      ),
    });
  }

  @Get()
  async check(): Promise<HealthCheckResult> {
    const [database, redis, minio] = await Promise.all([
      this.checkDatabase(),
      this.checkRedis(),
      this.checkMinio(),
    ]);

    const allOk =
      database.status === 'ok' &&
      redis.status === 'ok' &&
      minio.status === 'ok';

    return {
      status: allOk ? 'ok' : 'error',
      checks: { database, redis, minio },
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    };
  }

  private async checkDatabase(): Promise<{
    status: 'ok' | 'error';
    message?: string;
  }> {
    try {
      await this.dataSource.query('SELECT 1');
      return { status: 'ok' };
    } catch (error) {
      return {
        status: 'error',
        message: error instanceof Error ? error.message : 'Database check failed',
      };
    }
  }

  private async checkRedis(): Promise<{
    status: 'ok' | 'error';
    message?: string;
  }> {
    try {
      const result = await this.redisClient.ping();
      if (result === 'PONG') {
        return { status: 'ok' };
      }
      return { status: 'error', message: `Unexpected ping response: ${result}` };
    } catch (error) {
      return {
        status: 'error',
        message: error instanceof Error ? error.message : 'Redis check failed',
      };
    }
  }

  private async checkMinio(): Promise<{
    status: 'ok' | 'error';
    message?: string;
  }> {
    try {
      await this.minioClient.listBuckets();
      return { status: 'ok' };
    } catch (error) {
      return {
        status: 'error',
        message: error instanceof Error ? error.message : 'MinIO check failed',
      };
    }
  }
}
