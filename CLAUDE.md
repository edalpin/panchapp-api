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

Admin ops ──POST /admin/*──► AdminController (REST, X-Admin-Api-Key)
                                    │
                              admin services
                                    │
                              PrismaService
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

Keep only `*.module.ts` at the feature root. Group everything else by **architectural role**:

| Subfolder   | Contents                                              |
| ----------- | ----------------------------------------------------- |
| `http/`     | REST controllers, Zod request schemas, HTTP response types |
| `graphql/`  | resolvers, `@ObjectType`, `@InputType`, Zod input schemas |
| `services/` | injectable business logic                             |
| `utils/`    | pure helpers — role in filename (e.g. `*.mapper.ts`)  |
| `guards/`   | auth / role guards                                    |
| `types/`    | internal TS types (not transport contracts)           |

**Small modules (≤5 files):** may stay flat at module root with optional `graphql/`.

```
src/users/
  users.module.ts
  users.service.ts
  graphql/
    user.object.ts
```

**Larger modules (6+ files or multiple concerns):**

```
src/auth/
  auth.module.ts
  services/
  graphql/          # resolvers, @ObjectType, @InputType, Zod schemas
  guards/
  strategies/
  decorators/
  types/            # internal TS types (not GraphQL schema types)

src/admin/
  admin.module.ts
  http/             # controllers, request/response contracts
  services/
  guards/
  types/
```

### Import paths

Use `@/` aliases for all imports under `src/` — configured in `tsconfig.json` as `@/*` → `src/*`.

```ts
import { AuthService } from '@/auth/services/auth.service';
import { EnvConfig } from '@/config/env.schema';
import { User as PrismaUser } from '@/generated/prisma/client.js';
```

- Prefer `@/` over relative paths (`../`, `./`) for anything in `src/`.
- Keep the `.js` suffix on generated Prisma client imports (`@/generated/prisma/client.js`) — required by `module: nodenext`.
- Production builds rewrite aliases via `tsc-alias`; dev watch resolves them at runtime via `scripts/register-runtime-paths.cjs` + `tsconfig.runtime.json`.

### Naming conventions

- GraphQL files: `<concept>.<role>.ts` (e.g. `login-with-google.input.ts`, `auth-payload.object.ts`). Do not create generic container files like `auth.objects.ts`.
- HTTP files: `<concept>.schema.ts` (Zod), `<concept>.response.ts` (response shape).
- Utils files: `<concept>.<role>.ts` in `utils/` (e.g. `group.mapper.ts`, `group.policy.ts`).
- Internal types: one cohesive concept per file in `types/`.
- When a capability grows, split by subfolder (e.g. `graphql/sessions/`), not by artifact kind.

### Cross-module boundaries

- Export only services other modules need (e.g. `GroupAccessService`, `PersonalGroupPolicyService`).
- Keep resolver-facing and mutation services private unless a real cross-module consumer exists.
- Group and GroupMembership stay in one `GroupsModule` — membership is the groups authorization primitive.

Import the feature module in `AppModule`. That is the only wiring Nest needs to discover GraphQL resolvers.

`@ObjectType` / `@InputType` classes are plain TypeScript — reference them from resolvers; do **not** register them as Nest providers.

## GraphQL wiring

- Apollo bootstrap lives in `AppModule` via `GraphQLModule.forRootAsync` + `src/config/graphql.config.ts`.
- Schema is code-first and generated to `src/generated/schema.gql` (never hand-edit).
- GraphQL requires at least one Query field. Domain modules expose real queries (e.g. auth `me`).
- GraphiQL + introspection: development only (`GRAPHQL_GRAPHIQL=true`, `NODE_ENV=development`).
- Playground: `http://localhost:3000/graphql`

## REST

- Infrastructure: `GET /health` on `AppController`.
- Admin ops (not mobile-app API): `POST /admin/users`, `POST /admin/personal-groups/backfill` on `AdminController`, protected by `X-Admin-Api-Key` (`ADMIN_API_KEY` env var).
- Do not add business REST controllers or routes for the mobile app.
- Do not add a GraphQL `health` query — REST covers probes. `_ok` is not a health check.

## Forbidden

- `src/graphql/` folder or a wrapper `GraphqlModule`
- Central GraphQL registries that re-export domain resolvers
- Business REST endpoints for the mobile app
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
