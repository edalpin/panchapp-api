import { IncomingMessage } from 'node:http';
import type { AuthenticatedUser } from './jwt.types';

export type AuthenticatedRequest = IncomingMessage & { user: AuthenticatedUser };

export type GraphqlContext = {
  req: IncomingMessage & { user?: AuthenticatedUser };
};
