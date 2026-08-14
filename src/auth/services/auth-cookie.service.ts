import {
  AUTH_ACCESS_COOKIE_NAME,
  AUTH_COOKIE_PATH,
  AUTH_REFRESH_COOKIE_NAME,
} from '@/auth/constants/auth-cookie.constants';
import { EnvConfig, resolveCookieSecure } from '@/core/config/env.schema';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { CookieOptions, Response } from 'express';

type AuthCookieOptions = Pick<CookieOptions, 'httpOnly' | 'secure' | 'sameSite' | 'path' | 'maxAge'>;

@Injectable()
export class AuthCookieService {
  constructor(private readonly configService: ConfigService<EnvConfig, true>) {}

  setAuthCookies(res: Response, accessToken: string, refreshToken: string): void {
    const baseOptions = this.getCookieOptions();

    res.cookie(AUTH_ACCESS_COOKIE_NAME, accessToken, {
      ...baseOptions,
      path: AUTH_COOKIE_PATH,
      maxAge: this.configService.get('JWT_ACCESS_EXPIRES_MS', { infer: true }),
    });

    res.cookie(AUTH_REFRESH_COOKIE_NAME, refreshToken, {
      ...baseOptions,
      path: AUTH_COOKIE_PATH,
      maxAge: this.configService.get('JWT_REFRESH_EXPIRES_MS', { infer: true }),
    });
  }

  clearAuthCookies(res: Response): void {
    const baseOptions = this.getCookieOptions();

    res.clearCookie(AUTH_ACCESS_COOKIE_NAME, {
      ...baseOptions,
      path: AUTH_COOKIE_PATH,
    });

    res.clearCookie(AUTH_REFRESH_COOKIE_NAME, {
      ...baseOptions,
      path: AUTH_COOKIE_PATH,
    });
  }

  private getCookieOptions(): AuthCookieOptions {
    return {
      httpOnly: true,
      secure: resolveCookieSecure(
        this.configService.get('NODE_ENV', { infer: true }),
        this.configService.get('COOKIE_SECURE', { infer: true }),
      ),
      sameSite: this.configService.get('COOKIE_SAME_SITE', { infer: true }),
      path: AUTH_COOKIE_PATH,
    };
  }
}
