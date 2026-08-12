import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma, PrismaClient } from '../generated/prisma/client.js';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { getPrismaConfig } from '../config/prisma.config';
import { EnvConfig } from '../config/env.schema';

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

    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
