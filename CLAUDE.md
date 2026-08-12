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

## Logging & error handling

Use `nestjs-pino` (`InjectPinoLogger` / `PinoLogger`), not `console.*`. Correlation IDs are attached automatically via CLS.

| Layer | Responsibility |
| ----- | -------------- |
| **Repository services** (e.g. `UsersService`) | Thin data access — return data or `null`, let Prisma errors bubble up. Do **not** log on null returns; callers assign business meaning. |
| **Domain services** (e.g. `AuthService`) | Business rules + structured logs when a policy rejects an action (e.g. login rejected). |
| **Strategies / guards** (e.g. `JwtStrategy`) | Auth policy enforcement + structured logs on rejection (reason code + `userId`, never the raw token). Keep client responses generic. |
| **Global infra** | `LoggingExceptionFilter` catches uncaught exceptions; `PrismaService` logs connection failures. |

**When another module uses a shared service** (e.g. `UsersService`): the consumer interprets results and logs with its own domain context. Do not push business logging into shared data services — `null` may be normal, an error, or a security event depending on the caller.

## Module layout (mandatory)

Each domain owns its GraphQL surface. Colocate resolver, service, and types under `src/<feature>/`.

**Small modules (≤5 files):** flat at module root.

```
src/users/
  users.module.ts
  users.service.ts
  graphql/
    user.object.ts
```

**Larger modules (6+ files or multiple concerns):** keep `*.module.ts` and `*.service.ts` at root; group the rest in subfolders:

```
src/auth/
  auth.module.ts
  auth.service.ts
  graphql/          # resolvers, @ObjectType, @InputType
  guards/
  strategies/
  decorators/
  types/            # internal TS types (not GraphQL schema types)
```

Import the feature module in `AppModule`. That is the only wiring Nest needs to discover GraphQL resolvers.

`@ObjectType` / `@InputType` classes are plain TypeScript — reference them from resolvers; do **not** register them as Nest providers.

## GraphQL wiring

- Apollo bootstrap lives in `AppModule` via `GraphQLModule.forRootAsync` + `src/config/graphql.config.ts`.
- Schema is code-first and generated to `src/generated/schema.gql` (never hand-edit).
- GraphQL requires at least one Query field. Domain modules expose real queries (e.g. auth `me`).
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
