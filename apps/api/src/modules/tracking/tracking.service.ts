import { Injectable, Inject } from '@nestjs/common';
import { DataSource } from 'typeorm';
import Redis from 'ioredis';

interface GpsUpdate {
  vehicleId: string;
  driverId: string;
  latitude: number;
  longitude: number;
  speed: number;
}

@Injectable()
export class TrackingService {
  private readonly RATE_LIMIT_SECONDS = 5;

  constructor(
    private readonly dataSource: DataSource,
    @Inject('REDIS_CLIENT') private readonly redis: Redis,
  ) {}

  async saveGpsLog(tenantSchema: string, data: GpsUpdate): Promise<void> {
    // Rate limit check
    const rateLimitKey = `gps_rate:${data.vehicleId}`;
    const isLimited = await this.redis.get(rateLimitKey);
    if (isLimited) return;

    // Set rate limit
    await this.redis.set(rateLimitKey, '1', 'EX', this.RATE_LIMIT_SECONDS);

    // Store in DB
    await this.dataSource.query(
      `INSERT INTO "${tenantSchema}".gps_logs (vehicle_id, driver_id, coordinates, speed)
       VALUES ($1, $2, ST_SetSRID(ST_MakePoint($3, $4), 4326), $5)`,
      [data.vehicleId, data.driverId, data.longitude, data.latitude, data.speed],
    );

    // Publish to Redis for live dashboard
    await this.redis.publish(`gps:${tenantSchema}`, JSON.stringify({
      vehicleId: data.vehicleId,
      driverId: data.driverId,
      latitude: data.latitude,
      longitude: data.longitude,
      speed: data.speed,
      timestamp: new Date().toISOString(),
    }));
  }

  async getHistory(tenantSchema: string, vehicleId: string, from: string, to: string) {
    return this.dataSource.query(
      `SELECT ST_Y(coordinates::geometry) as latitude, ST_X(coordinates::geometry) as longitude,
       speed, recorded_at
       FROM "${tenantSchema}".gps_logs
       WHERE vehicle_id = $1 AND recorded_at BETWEEN $2 AND ($3::date + interval '1 day')
       ORDER BY recorded_at`,
      [vehicleId, from, to],
    );
  }

  async getLatestPosition(tenantSchema: string, vehicleId: string) {
    const result = await this.dataSource.query(
      `SELECT ST_Y(coordinates::geometry) as latitude, ST_X(coordinates::geometry) as longitude,
       speed, recorded_at
       FROM "${tenantSchema}".gps_logs
       WHERE vehicle_id = $1
       ORDER BY recorded_at DESC LIMIT 1`,
      [vehicleId],
    );
    return result[0] || null;
  }
}
