import type { AuthenticatedUser } from '@/auth/types/jwt.types';

export interface AuthSessionResult {
  accessToken: string;
  refreshToken: string;
  user: AuthenticatedUser;
}
