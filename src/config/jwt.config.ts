import { ConfigService } from '@nestjs/config';
import { JwtModuleOptions } from '@nestjs/jwt';
import { EnvConfig } from './env.schema';

export function getJwtConfig(configService: ConfigService<EnvConfig, true>): JwtModuleOptions {
  return {
    secret: configService.get('JWT_SECRET', { infer: true }),
    signOptions: {
      expiresIn: configService.get('JWT_EXPIRES_IN', { infer: true }),
    },
  };
}
