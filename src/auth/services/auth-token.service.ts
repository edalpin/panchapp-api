import { JwtPayload, JwtTokenType } from '@/auth/types/jwt.types';
import { EnvConfig } from '@/core/config/env.schema';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthTokenService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService<EnvConfig, true>,
  ) {}

  signAccessToken(userId: string): Promise<string> {
    return this.jwtService.signAsync({
      sub: userId,
      typ: JwtTokenType.ACCESS,
    });
  }

  signRefreshToken(userId: string): Promise<string> {
    const secret = this.configService.get('JWT_REFRESH_SECRET', { infer: true });
    const expiresIn = this.configService.get('JWT_REFRESH_EXPIRES_MS', { infer: true });

    return this.jwtService.signAsync(
      { sub: userId, typ: JwtTokenType.REFRESH },
      { secret, expiresIn: Math.floor(expiresIn / 1000) },
    );
  }

  async verifyRefreshToken(token: string): Promise<JwtPayload> {
    try {
      const secret = this.configService.get('JWT_REFRESH_SECRET', { infer: true });
      const payload = await this.jwtService.verifyAsync<JwtPayload>(token, { secret });

      if (payload.typ !== JwtTokenType.REFRESH) {
        throw new UnauthorizedException();
      }

      return payload;
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }

      throw new UnauthorizedException();
    }
  }
}
