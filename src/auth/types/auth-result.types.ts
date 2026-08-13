import type { AuthenticatedUser } from './jwt.types';

export interface AuthResult {
  accessToken: string;
  user: AuthenticatedUser;
}
