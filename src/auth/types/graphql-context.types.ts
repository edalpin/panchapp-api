import type { AuthenticatedUser } from '@/auth/types/jwt.types';
import { IncomingMessage } from 'node:http';

export type AuthenticatedRequest = IncomingMessage & { user: AuthenticatedUser };

export type GraphqlContext = {
  req: IncomingMessage & { user?: AuthenticatedUser };
};
