import { z } from 'zod';

export const loginWithGoogleSchema = z.object({
  idToken: z.string().trim().min(1, 'idToken is required'),
});

export type LoginWithGoogleDto = z.infer<typeof loginWithGoogleSchema>;
