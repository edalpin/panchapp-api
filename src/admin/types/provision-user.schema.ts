import { z } from 'zod';

export const provisionUserSchema = z.object({
  email: z.string().trim().email('email must be a valid email address'),
  name: z.string().trim().min(1).optional(),
});

export type ProvisionUserDto = z.infer<typeof provisionUserSchema>;
