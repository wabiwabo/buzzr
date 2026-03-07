import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { appConfig } from './config/app.config';
import { databaseConfig } from './config/database.config';
import { DatabaseModule } from './database/database.module';
import { TenantMiddleware } from './database/tenant.middleware';
import { AuthModule } from './modules/auth/auth.module';
import { TenantModule } from './modules/tenant/tenant.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, databaseConfig],
      envFilePath: '../../.env',
    }),
    DatabaseModule,
    AuthModule,
    TenantModule,
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
