import { EnvConfig } from '@/core/config/env.schema';
import { ConfigService } from '@nestjs/config';
import { JwtModuleOptions } from '@nestjs/jwt';

export function getJwtConfig(configService: ConfigService<EnvConfig, true>): JwtModuleOptions {
  const accessExpiresMs = configService.get('JWT_ACCESS_EXPIRES_MS', { infer: true });

  return {
    secret: configService.get('JWT_ACCESS_SECRET', { infer: true }),
    signOptions: {
      expiresIn: Math.floor(accessExpiresMs / 1000),
    },
  };
}
