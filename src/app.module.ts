import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { LoggerModule } from 'nestjs-pino';
import { EnvConfig, validateEnv } from './config/env.schema';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, validate: validateEnv }),
    LoggerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService<EnvConfig, true>) => {
        const isDevelopment = configService.get('NODE_ENV', { infer: true }) === 'development';
        const logLevel = configService.get('LOG_LEVEL', { infer: true });

        return {
          pinoHttp: {
            level: logLevel,
            transport: isDevelopment
              ? {
                  target: 'pino-pretty',
                  options: {
                    singleLine: true,
                    colorize: true,
                    translateTime: 'SYS:yyyy-mm-dd HH:MM:ss.l',
                  },
                }
              : undefined,
          },
        };
      },
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
