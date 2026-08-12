# Panchapp Service — Project Memory

NestJS backend for the Panchapp React Native app. PostgreSQL via Prisma. GraphQL is the primary API.

## Architecture

```
Mobile app ──POST /graphql──► GraphQLModule (Apollo)
                                    │
                         domain module resolvers
                                    │
                              feature services
                                    │
                              PrismaService
                                    │
                              PostgreSQL

Infra probes ──GET /health──► AppController (REST only)
```

| Layer         | Responsibility                                          |
| ------------- | ------------------------------------------------------- |
| Resolver      | Thin GraphQL adapter — map args/inputs to service calls |
| Service       | Business logic, validation, Prisma access               |
| PrismaService | Database client (injected from global `PrismaModule`)   |

Data flow is always **Resolver → Service → PrismaService**. Never put Prisma queries in resolvers.

## Module layout (mandatory)

Each domain owns its GraphQL surface. Colocate resolver, service, and types:

```
src/users/
  users.module.ts       # providers: [UsersService, UsersResolver]
  users.service.ts
  users.resolver.ts
  user.object.ts        # @ObjectType()
  create-user.input.ts  # @InputType() when adding mutations
```

Import the feature module in `AppModule`. That is the only wiring Nest needs to discover GraphQL resolvers.

`@ObjectType` / `@InputType` classes are plain TypeScript — reference them from resolvers; do **not** register them as Nest providers.

## GraphQL wiring

- Apollo bootstrap lives in `AppModule` via `GraphQLModule.forRootAsync` + `src/config/graphql.config.ts`.
- Schema is code-first and generated to `src/generated/schema.gql` (never hand-edit).
- GraphQL requires at least one Query field. `AppResolver` (`_ok`) in `AppModule` is schema bootstrap only — remove it once a domain module exposes a Query.
- GraphiQL + introspection: development only (`GRAPHQL_GRAPHIQL=true`, `NODE_ENV=development`).
- Playground: `http://localhost:3000/graphql`

## REST

- Only infrastructure: `GET /health` on `AppController`.
- Do not add business REST controllers or routes.
- Do not add a GraphQL `health` query — REST covers probes. `_ok` is not a health check.

## Forbidden

- `src/graphql/` folder or a wrapper `GraphqlModule`
- Central GraphQL registries that re-export domain resolvers
- Business REST endpoints
- Prisma queries inside resolvers
- Hand-editing anything under `src/generated/`
- Instantiating `PrismaClient` outside `PrismaService`

## Local development

```bash
pnpm db:up          # start Postgres (Docker Compose)
pnpm start:dev      # Nest watch mode (default PORT=3000)
```

Health check:

```bash
curl http://localhost:3000/health
# {"status":"ok"}
```

GraphQL (after adding domain queries):

```bash
curl -X POST http://localhost:3000/graphql \
  -H "Content-Type: application/json" \
  -d '{"query":"{ /* your query */ }"}'
```

Or open GraphiQL at `http://localhost:3000/graphql`.

## Cursor rules

File-specific and always-apply detail lives in [`.cursor/rules/`](.cursor/rules/):

- `api-architecture.mdc` — GraphQL vs REST boundaries
- `nest-structure.mdc` — feature module conventions
- `graphql-conventions.mdc` — resolver / object / input patterns
