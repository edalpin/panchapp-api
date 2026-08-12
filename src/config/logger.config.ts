import { ConfigService } from '@nestjs/config';
import { Params } from 'nestjs-pino';
import { EnvConfig } from './env.schema';

export function getPinoConfig(configService: ConfigService<EnvConfig, true>): Params {
  const isDev = configService.get('NODE_ENV', { infer: true }) === 'development';
  const logLevel = configService.get('LOG_LEVEL', { infer: true });

  return {
    pinoHttp: {
      level: logLevel,
      transport: isDev
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
}
