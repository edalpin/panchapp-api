import type { AuthenticatedUser } from '@/auth/types/jwt.types';

export interface AuthResult {
  accessToken: string;
  user: AuthenticatedUser;
}
