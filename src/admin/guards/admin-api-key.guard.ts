import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { createHash, timingSafeEqual } from 'node:crypto';
import { EnvConfig } from '../../config/env.schema';

const ADMIN_API_KEY_HEADER = 'x-admin-api-key';

@Injectable()
export class AdminApiKeyGuard implements CanActivate {
  private readonly expectedKeyHash: Buffer;

  constructor(
    configService: ConfigService<EnvConfig, true>,
    @InjectPinoLogger(AdminApiKeyGuard.name)
    private readonly logger: PinoLogger,
  ) {
    this.expectedKeyHash = this.hashApiKey(configService.get('ADMIN_API_KEY', { infer: true }));
  }

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const providedKey = request.header(ADMIN_API_KEY_HEADER);

    if (!providedKey) {
      this.logger.warn({ reason: 'missing_api_key' }, 'Admin API key rejected');
      throw new UnauthorizedException();
    }

    const providedKeyHash = this.hashApiKey(providedKey);
    if (!timingSafeEqual(providedKeyHash, this.expectedKeyHash)) {
      this.logger.warn({ reason: 'invalid_api_key' }, 'Admin API key rejected');
      throw new UnauthorizedException();
    }

    return true;
  }

  private hashApiKey(value: string): Buffer {
    return createHash('sha256').update(value).digest();
  }
}
