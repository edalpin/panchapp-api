import { AUTH_ACCESS_COOKIE_NAME, AUTH_REFRESH_COOKIE_NAME } from '@/auth/constants/auth-cookie.constants';
import type { Request } from 'express';

export function readRequestCookie(req: Request, name: string): string | undefined {
  const rawCookies: unknown = req.cookies;
  if (typeof rawCookies !== 'object' || rawCookies === null) {
    return undefined;
  }

  const value: unknown = (rawCookies as Record<string, unknown>)[name];
  return typeof value === 'string' ? value : undefined;
}

export function readAccessTokenFromCookie(req: Request): string | undefined {
  return readRequestCookie(req, AUTH_ACCESS_COOKIE_NAME);
}

export function readRefreshTokenFromCookie(req: Request): string | undefined {
  return readRequestCookie(req, AUTH_REFRESH_COOKIE_NAME);
}
