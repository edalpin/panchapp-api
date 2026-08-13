import { EnvConfig } from '@/core/config/env.schema';
import { ConfigService } from '@nestjs/config';
import { JwtModuleOptions } from '@nestjs/jwt';

export function getJwtConfig(configService: ConfigService<EnvConfig, true>): JwtModuleOptions {
  return {
    secret: configService.get('JWT_SECRET', { infer: true }),
    signOptions: {
      expiresIn: configService.get('JWT_EXPIRES_IN', { infer: true }),
    },
  };
}
