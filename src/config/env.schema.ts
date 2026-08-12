import { z } from 'zod';

export const envSchema = z.object({
  // General
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(3000),
  // Database
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
});

export type EnvConfig = z.infer<typeof envSchema>;

export function validateEnv(config: Record<string, unknown>): EnvConfig {
  const result = envSchema.safeParse(config);

  if (!result.success) {
    console.error('❌ Invalid environment variables:');
    console.error(JSON.stringify(result.error.format(), null, 2));
    throw new Error('Invalid environment configuration');
  }

  return result.data;
}
