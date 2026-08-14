import { z } from 'zod';

const cookieSameSiteSchema = z.enum(['lax', 'strict', 'none']);

const baseEnvSchema = z.object({
  // General
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(3000),
  // Database
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  // Logging
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']).default('info'),
  // GraphQL
  GRAPHQL_GRAPHIQL: z
    .enum(['true', 'false'])
    .default('true')
    .transform((value) => value === 'true'),
  // CORS
  CORS_ORIGIN: z.string().optional(),
  // Auth
  JWT_ACCESS_SECRET: z.string().min(32, 'JWT_ACCESS_SECRET must be at least 32 characters'),
  JWT_REFRESH_SECRET: z.string().min(32, 'JWT_REFRESH_SECRET must be at least 32 characters'),
  JWT_ACCESS_EXPIRES_MS: z.coerce.number().int().positive().default(900_000),
  JWT_REFRESH_EXPIRES_MS: z.coerce.number().int().positive().default(604_800_000),
  GOOGLE_CLIENT_ID: z.string().min(1, 'GOOGLE_CLIENT_ID is required'),
  // Cookies
  COOKIE_SECURE: z
    .enum(['true', 'false'])
    .optional()
    .transform((value) => value === 'true'),
  COOKIE_SAME_SITE: cookieSameSiteSchema.default('lax'),
  // Proxy
  TRUST_PROXY: z
    .enum(['true', 'false'])
    .default('false')
    .transform((value) => value === 'true'),
  // Admin
  ADMIN_API_KEY: z.string().min(32, 'ADMIN_API_KEY must be at least 32 characters'),
});

export const envSchema = baseEnvSchema.superRefine((config, ctx) => {
  if (config.NODE_ENV === 'production' && !config.CORS_ORIGIN) {
    ctx.addIssue({
      code: 'custom',
      message: 'CORS_ORIGIN is required in production',
      path: ['CORS_ORIGIN'],
    });
  }

  if (config.COOKIE_SAME_SITE === 'none' && !resolveCookieSecure(config.NODE_ENV, config.COOKIE_SECURE)) {
    ctx.addIssue({
      code: 'custom',
      message: 'COOKIE_SECURE must be true when COOKIE_SAME_SITE is none',
      path: ['COOKIE_SECURE'],
    });
  }
});

export type EnvConfig = z.infer<typeof baseEnvSchema>;

export function validateEnv(config: Record<string, unknown>): EnvConfig {
  const result = envSchema.safeParse(config);

  if (!result.success) {
    console.error('Invalid environment variables:');
    console.error(JSON.stringify(result.error.format(), null, 2));
    throw new Error('Invalid environment configuration');
  }

  return result.data;
}

export function resolveCookieSecure(nodeEnv: EnvConfig['NODE_ENV'], configured?: boolean): boolean {
  if (configured !== undefined) {
    return configured;
  }

  return nodeEnv === 'production';
}
