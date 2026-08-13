import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_FILTER } from '@nestjs/core';
import { GraphQLModule } from '@nestjs/graphql';
import { Request, Response } from 'express';
import { ClsModule, ClsService } from 'nestjs-cls';
import { LoggerModule } from 'nestjs-pino';
import { AdminModule } from './admin/admin.module';
import { AppController } from './app.controller';
import { AuthModule } from './auth/auth.module';
import { applyCorrelationId, resolveCorrelationId } from './common/correlation/correlation-id.util';
import { LoggingExceptionFilter } from './common/filters/logging-exception.filter';
import { validateEnv } from './config/env.schema';
import { getGraphqlConfig } from './config/graphql.config';
import { getPinoConfig } from './config/logger.config';
import { GroupsModule } from './groups/groups.module';
import { PrismaModule } from './prisma/prisma.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, validate: validateEnv }),
    ClsModule.forRoot({
      global: true,
      middleware: {
        mount: true,
        setup: (cls, req: Request, res: Response) => {
          const correlationId = resolveCorrelationId(req);
          cls.set('correlationId', correlationId);
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
    PrismaModule,
    UsersModule,
    AuthModule,
    GroupsModule,
    AdminModule,
  ],
  controllers: [AppController],
  providers: [
    {
      provide: APP_FILTER,
      useClass: LoggingExceptionFilter,
    },
  ],
})
export class AppModule {}
