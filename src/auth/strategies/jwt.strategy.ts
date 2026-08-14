import { AuthenticatedUser, JwtPayload, JwtTokenType } from '@/auth/types/jwt.types';
import { readAccessTokenFromCookie } from '@/auth/utils/auth-cookie.util';
import { toAuthenticatedUser } from '@/auth/utils/authenticated-user.mapper';
import { EnvConfig } from '@/core/config/env.schema';
import { UserStatus } from '@/generated/prisma/client.js';
import { UsersService } from '@/users/services/users.service';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Request } from 'express';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { ExtractJwt, Strategy } from 'passport-jwt';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    configService: ConfigService<EnvConfig, true>,
    private readonly usersService: UsersService,
    @InjectPinoLogger(JwtStrategy.name)
    private readonly logger: PinoLogger,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([(request) => readAccessTokenFromCookie(request as Request) ?? null]),
      ignoreExpiration: false,
      secretOrKey: configService.get('JWT_ACCESS_SECRET', { infer: true }),
    });
  }

  async validate(payload: JwtPayload): Promise<AuthenticatedUser> {
    if (payload.typ !== JwtTokenType.ACCESS) {
      this.logger.warn({ userId: payload.sub, reason: 'invalid_token_type' }, 'JWT validation rejected');
      throw new UnauthorizedException();
    }

    const user = await this.usersService.findById(payload.sub);

    if (!user) {
      this.logger.warn({ userId: payload.sub, reason: 'user_not_found' }, 'JWT validation rejected');
      throw new UnauthorizedException();
    }

    if (user.status !== UserStatus.ACTIVE) {
      this.logger.warn({ userId: payload.sub, reason: 'user_not_active' }, 'JWT validation rejected');
      throw new UnauthorizedException();
    }

    return toAuthenticatedUser(user);
  }
}
