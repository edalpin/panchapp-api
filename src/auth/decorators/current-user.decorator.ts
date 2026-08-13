import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import type { AuthenticatedRequest } from '../types/graphql-context.types';
import type { AuthenticatedUser } from '../types/jwt.types';

export const CurrentUser = createParamDecorator((_data: unknown, context: ExecutionContext): AuthenticatedUser => {
  const ctx = GqlExecutionContext.create(context);
  const req = ctx.getContext<{ req: AuthenticatedRequest }>().req;
  return req.user;
});
