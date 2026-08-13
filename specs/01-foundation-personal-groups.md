# Phase 1: Foundation and Personal Groups

## Purpose

Establish the group-centered ownership model without changing the existing Google authentication policy. Every provisioned user receives one private personal group so later features can attach events to a group uniformly.

## User outcomes

- An authenticated user can retrieve their personal group.
- The personal group exists automatically; the user never needs to create it.
- No other user can discover, join, or modify that personal group.

## Dependencies

This is the first phase. It builds on the existing `User` model, pre-registered account policy, JWT guard, and `me` query.

## Scope

- Add the intended `Group` and `GroupMembership` foundation described in [database.md](database.md).
- Create exactly one personal group and membership whenever a user is provisioned.
- Backfill one personal group for every user that already exists when this phase is implemented.
- Expose authenticated queries needed to retrieve the caller's groups.
- Establish common group-access checks that later phases can reuse.

## Non-goals

- Self-registration or changes to Google login.
- Collaborative-group creation.
- Invitations or additional personal-group members.
- Events.
- Group roles, deletion, sharing, or public discovery.

## Domain rules

1. Each user has exactly one personal group.
2. `personalOwnerId` identifies the personal group and is unique.
3. The personal owner is also the group's only membership.
4. A personal group is always private and active while its user is active.
5. It cannot receive invitations, gain another membership, be left, or be archived through group operations.
6. Its default name is derived for display during provisioning, but the stored group identity must not depend on that name.
7. Disabling a user blocks access but retains their personal group and history.

## Provisioning behavior

User, personal group, and personal membership creation form one transaction. If any record cannot be created, none of them are committed.

When this phase is introduced, existing users require an idempotent backfill:

- Users without a personal group receive one and its matching membership.
- Users already satisfying the invariant are unchanged.
- Any contradictory data is reported and not guessed at automatically.

Authentication must not create a missing group as an incidental login side effect. Login remains authentication; provisioning and repair own data creation.

## Authorization

- Only an authenticated, active user can read their personal group.
- A user may not read another user's personal group, including by guessing its ID.
- Unauthorized group lookup should behave as not found so it does not reveal private group existence.
- No personal-group mutation is exposed in this phase.

## Proposed GraphQL contract

### `myGroups`

Authenticated query returning groups in which the caller has current membership.

Phase 1 returns the personal group. Later phases add collaborative groups without changing the query's meaning.

Minimum group output:

- `id`
- `name`
- `isPersonal`
- `status`
- `createdAt`
- `updatedAt`

`isPersonal` is derived from `personalOwnerId`; clients do not receive the owner foreign key as a type discriminator.

### `group(id)`

Authenticated lookup for a group in which the caller has current membership. Returns not found for absent or inaccessible groups.

No business REST endpoint is introduced.

## Validation and failure cases

- Duplicate personal ownership is a conflict and must be prevented by a database unique constraint.
- A user record without its required personal group is an integrity fault, not an expected empty query result.
- Disabled users are rejected by authentication before group access.
- Attempts to create a second membership in a personal group are rejected.
- Personal-group names follow the same length and whitespace rules later used by collaborative groups.

## Acceptance criteria

1. Provisioning a user creates one personal group and one matching membership atomically.
2. Retrying provisioning cannot create a second personal group.
3. Each existing user receives exactly one personal group through an idempotent backfill.
4. `myGroups` returns the authenticated user's personal group.
5. `group(id)` returns the personal group only to its owner.
6. A personal group cannot accept another membership or be left.
7. Disabling a user retains all group records but prevents access.
8. No Prisma operation is placed in a GraphQL resolver.

## Required test scenarios

- Successful new-user provisioning.
- Rollback when personal-group or membership creation fails.
- Idempotent provisioning retry.
- Backfill with a mix of complete and missing personal groups.
- Owner and non-owner lookup behavior.
- Duplicate owner and duplicate membership constraints.
- Disabled-user access rejection.

## Extension points

The personal group can later support preferences or solo events without gaining collaborators. If product requirements eventually allow sharing a personal space, that should be a deliberate migration to a separate collaborative group rather than weakening the personal-group invariant.
