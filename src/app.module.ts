import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { GraphQLModule } from '@nestjs/graphql';
import { LoggerModule } from 'nestjs-pino';
import { AppController } from './app.controller';
import { AppResolver } from './app.resolver';
import { validateEnv } from './config/env.schema';
import { getGraphqlConfig } from './config/graphql.config';
import { getPinoConfig } from './config/logger.config';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, validate: validateEnv }),
    LoggerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: getPinoConfig,
    }),
    GraphQLModule.forRootAsync<ApolloDriverConfig>({
      driver: ApolloDriver,
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: getGraphqlConfig,
    }),
    PrismaModule,
  ],
  controllers: [AppController],
  providers: [AppResolver],
})
export class AppModule {}
