import { ConfigService } from '@nestjs/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { Prisma } from '../generated/prisma/client.js';
import { EnvConfig } from './env.schema';

export function getPrismaConfig(configService: ConfigService<EnvConfig, true>): Prisma.PrismaClientOptions {
  const isDev = configService.get('NODE_ENV', { infer: true }) === 'development';
  const databaseUrl = configService.get('DATABASE_URL', { infer: true });

  return {
    adapter: new PrismaPg(databaseUrl),
    log: isDev
      ? ([
          { emit: 'event', level: 'query' },
          { emit: 'stdout', level: 'warn' },
          { emit: 'stdout', level: 'error' },
        ] as const)
      : ([{ emit: 'stdout', level: 'error' }] as const),
  };
}
