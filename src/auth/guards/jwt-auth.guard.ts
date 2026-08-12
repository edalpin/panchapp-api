import { ExecutionContext, Injectable } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { AuthGuard } from '@nestjs/passport';
import { IncomingMessage } from 'node:http';
import type { AuthenticatedUser } from '../types/auth.types';

interface GraphqlContext {
  req: IncomingMessage & { user?: AuthenticatedUser };
}

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  getRequest(context: ExecutionContext): IncomingMessage {
    const ctx = GqlExecutionContext.create(context);
    return ctx.getContext<GraphqlContext>().req;
  }
}
