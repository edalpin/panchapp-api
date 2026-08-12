import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { EnvConfig } from '../config/env.schema';
import { getPrismaConfig } from '../config/prisma.config';
import { Prisma, PrismaClient } from '../generated/prisma/client.js';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor(
    configService: ConfigService<EnvConfig, true>,
    @InjectPinoLogger(PrismaService.name)
    private readonly logger: PinoLogger,
  ) {
    super(getPrismaConfig(configService));
  }

  async onModuleInit() {
    (this as PrismaClient<'query'>).$on('query', (e: Prisma.QueryEvent) => {
      this.logger.debug(
        {
          query: e.query,
          params: e.params,
          duration: `${e.duration}ms`,
        },
        'Prisma Query',
      );
    });

    try {
      await this.$connect();
      await this.$queryRaw`SELECT 1`;
      this.logger.info('Database connection established');
    } catch (error) {
      this.logger.error({ error: error as Error }, 'Failed to connect to database');
      throw error;
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
