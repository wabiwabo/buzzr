import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { appConfig } from './config/app.config';
import { databaseConfig } from './config/database.config';
import { DatabaseModule } from './database/database.module';
import { RedisModule } from './common/redis.module';
import { TenantMiddleware } from './database/tenant.middleware';
import { AuthModule } from './modules/auth/auth.module';
import { TenantModule } from './modules/tenant/tenant.module';
import { UserModule } from './modules/user/user.module';
import { AreaModule } from './modules/area/area.module';
import { TpsModule } from './modules/tps/tps.module';
import { FleetModule } from './modules/fleet/fleet.module';
import { ScheduleModule } from './modules/schedule/schedule.module';
import { TrackingModule } from './modules/tracking/tracking.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, databaseConfig],
      envFilePath: '../../.env',
    }),
    DatabaseModule,
    RedisModule,
    AuthModule,
    TenantModule,
    UserModule,
    AreaModule,
    TpsModule,
    FleetModule,
    ScheduleModule,
    TrackingModule,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(TenantMiddleware)
      .exclude('health', 'api/v1/auth/super-admin/(.*)', 'api/v1/tenants', 'api/v1/tenants/(.*)')
      .forRoutes('*');
  }
}
