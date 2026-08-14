import type { AuthenticatedUser } from '@/auth/types/jwt.types';
import type { Request, Response } from 'express';

export type AuthenticatedRequest = Request & { user: AuthenticatedUser };

export type GraphqlContext = {
  req: Request;
  res: Response;
  correlationId?: string | string[];
};
