import { z } from 'zod';

export const envSchema = z.object({
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
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
  JWT_EXPIRES_IN: z.string().default('7d'),
  GOOGLE_CLIENT_ID: z.string().min(1, 'GOOGLE_CLIENT_ID is required'),
  // Admin
  ADMIN_API_KEY: z.string().min(32, 'ADMIN_API_KEY must be at least 32 characters'),
});

export type EnvConfig = z.infer<typeof envSchema>;

export function validateEnv(config: Record<string, unknown>): EnvConfig {
  const result = envSchema.safeParse(config);

  if (!result.success) {
    console.error('Invalid environment variables:');
    console.error(JSON.stringify(result.error.format(), null, 2));
    throw new Error('Invalid environment configuration');
  }

  return result.data;
}
