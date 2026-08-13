import { ApolloDriverConfig } from '@nestjs/apollo';
import { HttpException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GraphQLError, GraphQLFormattedError } from 'graphql';
import { IncomingMessage } from 'node:http';
import { join } from 'node:path';
import { CORRELATION_ID_HEADER } from '../common/correlation/correlation-id.util';
import { EnvConfig } from './env.schema';

type ValidationIssue = {
  path: string;
  message: string;
};

function isValidationIssue(value: unknown): value is ValidationIssue {
  return (
    typeof value === 'object' &&
    value !== null &&
    'path' in value &&
    typeof value.path === 'string' &&
    'message' in value &&
    typeof value.message === 'string'
  );
}

function extractValidationIssues(response: string | object): ValidationIssue[] | undefined {
  if (typeof response !== 'object' || response === null || !('issues' in response)) {
    return undefined;
  }

  const { issues } = response;
  if (!Array.isArray(issues) || !issues.every(isValidationIssue)) {
    return undefined;
  }

  return issues;
}

function toClientError(message: string, code: string, issues?: ValidationIssue[]): GraphQLFormattedError {
  return {
    message,
    extensions: issues ? { code, issues } : { code },
  };
}

function resolveErrorCode(status: number, fallback?: unknown): string {
  if (status === 401) return 'UNAUTHENTICATED';
  if (status === 403) return 'FORBIDDEN';
  if (status === 404) return 'NOT_FOUND';
  if (status === 400) return 'BAD_REQUEST';
  if (typeof fallback === 'string') return fallback;
  return status >= 500 ? 'INTERNAL_SERVER_ERROR' : 'BAD_REQUEST';
}

export function getGraphqlConfig(configService: ConfigService<EnvConfig, true>): ApolloDriverConfig {
  const env = configService.get('NODE_ENV', { infer: true });
  const graphiql = configService.get('GRAPHQL_GRAPHIQL', { infer: true });
  const isDevelopment = env === 'development';

  return {
    autoSchemaFile: join(process.cwd(), 'src/generated/schema.gql'),
    sortSchema: true,
    graphiql: isDevelopment && graphiql,
    introspection: env !== 'production',
    context: ({ req, res }: { req: IncomingMessage; res: unknown }) => ({
      req,
      res,
      correlationId: req.headers[CORRELATION_ID_HEADER],
    }),
    formatError: (formattedError, error): GraphQLFormattedError => {
      const original = error instanceof GraphQLError ? error.originalError : undefined;

      if (original instanceof HttpException) {
        const status = original.getStatus();
        const code = resolveErrorCode(status, formattedError.extensions?.code);
        const response = original.getResponse();
        const issues = extractValidationIssues(response);
        const responseMessage =
          typeof response === 'object' &&
          response !== null &&
          'message' in response &&
          typeof response.message === 'string'
            ? response.message
            : formattedError.message;
        const message = status >= 500 ? 'Internal server error' : responseMessage;
        return toClientError(message, code, issues);
      }

      const code = formattedError.extensions?.code;
      if (typeof code === 'string' && code !== 'INTERNAL_SERVER_ERROR') {
        return formattedError;
      }

      return toClientError('Internal server error', 'INTERNAL_SERVER_ERROR');
    },
  };
}
