import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { AuthenticatedUser } from '../types/auth.types';

export const CurrentUser = createParamDecorator((_data: unknown, context: ExecutionContext): AuthenticatedUser => {
  const ctx = GqlExecutionContext.create(context);
  const req = ctx.getContext<{ req: { user: AuthenticatedUser } }>().req;
  return req.user;
});
