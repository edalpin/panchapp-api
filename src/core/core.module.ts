import { validateEnv } from '@/core/config/env.schema';
import { getGraphqlConfig } from '@/core/config/graphql.config';
import { getPinoConfig } from '@/core/config/logger.config';
import { CORRELATION_ID_CLS_KEY } from '@/core/constants/cls.constants';
import { applyCorrelationId, resolveCorrelationId } from '@/core/correlation/correlation-id.util';
import { LoggingExceptionFilter } from '@/core/filters/logging-exception.filter';
import { PrismaService } from '@/core/prisma/prisma.service';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_FILTER } from '@nestjs/core';
import { GraphQLModule } from '@nestjs/graphql';
import { Request, Response } from 'express';
import { ClsModule, ClsService } from 'nestjs-cls';
import { LoggerModule } from 'nestjs-pino';

@Global()
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, validate: validateEnv }),
    ClsModule.forRoot({
      global: true,
      middleware: {
        mount: true,
        setup: (cls, req: Request, res: Response) => {
          const correlationId = resolveCorrelationId(req);
          cls.set(CORRELATION_ID_CLS_KEY, correlationId);
          applyCorrelationId(req, res, correlationId);
        },
      },
    }),
    LoggerModule.forRootAsync({
      imports: [ConfigModule, ClsModule],
      inject: [ConfigService, ClsService],
      useFactory: getPinoConfig,
    }),
    GraphQLModule.forRootAsync<ApolloDriverConfig>({
      driver: ApolloDriver,
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: getGraphqlConfig,
    }),
  ],
  providers: [
    PrismaService,
    {
      provide: APP_FILTER,
      useClass: LoggingExceptionFilter,
    },
  ],
  exports: [PrismaService],
})
export class CoreModule {}
