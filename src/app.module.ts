import { Module, ValidationPipe } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_FILTER, APP_PIPE } from '@nestjs/core';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LoggerModule } from 'nestjs-pino';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';
import { buildLoggerConfig } from './common/logging/logger.config';
import { Env, validateEnv } from './config/env';
import { buildTypeOrmOptions } from './database/typeorm.options';
import { DocumentosModule } from './modules/documentos/documentos.module';
import { ExamesModule } from './modules/exames/exames.module';
import { HealthController } from './modules/health/health.controller';
import { PedidosModule } from './modules/pedidos/pedidos.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, validate: validateEnv }),
    LoggerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService<Env, true>) =>
        buildLoggerConfig({
          level: config.get('LOG_LEVEL', { infer: true }),
          pretty: config.get('LOG_PRETTY', { infer: true }),
        }),
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService<Env, true>) =>
        buildTypeOrmOptions(config.get('DATABASE_URL', { infer: true })),
    }),
    PedidosModule,
    DocumentosModule,
    ExamesModule,
  ],
  controllers: [HealthController],
  providers: [
    { provide: APP_FILTER, useClass: AllExceptionsFilter },
    {
      provide: APP_PIPE,
      // whitelist sem forbidNonWhitelisted: campos extras enviados pelo
      // sistema de origem são descartados em vez de quebrar a integração.
      useValue: new ValidationPipe({ whitelist: true, transform: true }),
    },
  ],
})
export class AppModule {}
