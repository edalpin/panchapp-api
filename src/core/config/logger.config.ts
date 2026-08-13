import { EnvConfig } from '@/core/config/env.schema';
import { CORRELATION_ID_CLS_KEY } from '@/core/constants/cls.constants';
import { ConfigService } from '@nestjs/config';
import { ClsService } from 'nestjs-cls';
import { Params } from 'nestjs-pino';
import { randomUUID } from 'node:crypto';

export function getPinoConfig(configService: ConfigService<EnvConfig, true>, cls: ClsService): Params {
  const isDev = configService.get('NODE_ENV', { infer: true }) === 'development';
  const logLevel = configService.get('LOG_LEVEL', { infer: true });

  return {
    pinoHttp: {
      level: logLevel,
      genReqId: () => cls.get(CORRELATION_ID_CLS_KEY) ?? randomUUID(),
      mixin: () => {
        const correlationId = cls.get<string>(CORRELATION_ID_CLS_KEY);
        return correlationId ? { correlationId } : {};
      },
      customProps: (req) => ({ correlationId: req.id }),
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
