import type { AuthenticatedRequest } from '@/auth/types/graphql-context.types';
import type { AuthenticatedUser } from '@/auth/types/jwt.types';
import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';

export const CurrentUser = createParamDecorator((_data: unknown, context: ExecutionContext): AuthenticatedUser => {
  const ctx = GqlExecutionContext.create(context);
  const req = ctx.getContext<{ req: AuthenticatedRequest }>().req;
  return req.user;
});
