import { ApolloDriverConfig } from '@nestjs/apollo';
import { ConfigService } from '@nestjs/config';
import { join } from 'node:path';
import { EnvConfig } from './env.schema';

export function getGraphqlConfig(configService: ConfigService<EnvConfig, true>): ApolloDriverConfig {
  const env = configService.get('NODE_ENV', { infer: true });
  const graphiql = configService.get('GRAPHQL_GRAPHIQL', { infer: true });
  const isDevelopment = env === 'development';

  return {
    autoSchemaFile: join(process.cwd(), 'src/generated/schema.gql'),
    sortSchema: true,
    graphiql: isDevelopment && graphiql,
    introspection: env !== 'production',
    context: ({ req, res }: { req: unknown; res: unknown }) => ({ req, res }),
  };
}
