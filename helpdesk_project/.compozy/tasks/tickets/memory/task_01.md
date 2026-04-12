# Task Memory: task_01.md

Keep only task-local execution context here. Do not duplicate facts that are obvious from the repository, task file, PRD documents, or git history.

## Objective Snapshot

Extend PostgreSQL schema for ticket management: slug on organizations, extended tickets table, 3 new tables (ticket_comments, ticket_attachments, ticket_assignments), update testHelper truncation.

## Important Decisions

- Made `ticket_type_id` nullable on tickets table (was NOT NULL) per TechSpec
- Added minimal slug generation (`name.toLowerCase().replace(/\s+/g, "-")`) to authService.signup to keep it functional — task_02 will implement proper slug generation
- Updated all test files that INSERT into organizations to include slug column
- Updated all test files that INSERT into tickets to include new required columns (code, name, email, phone, description)

## Learnings

- VARCHAR(10) for ticket code means test codes must be <=10 chars (e.g., `TK-TDEL01` not `TK-TESTDEL1`)
- Many test helper functions across different test files create organizations directly — all needed slug updates

## Files / Surfaces

- `database/init.sql` — schema changes (organizations slug, tickets extension, 3 new tables)
- `packages/backend/src/data/testHelper.ts` — truncation order updated, ensureDefaultOrganization includes slug
- `packages/backend/src/data/testHelper.test.ts` — org column expectation, ticket INSERTs updated
- `packages/backend/src/services/authService.ts` — signup includes slug in org INSERT
- `packages/backend/src/services/authService.test.ts` — org INSERT includes slug
- `packages/backend/src/services/ticketTypeService.test.ts` — org and ticket INSERTs updated
- `packages/backend/src/services/userService.test.ts` — org INSERT includes slug
- `packages/backend/src/services/organizationService.test.ts` — org INSERT includes slug
- `packages/backend/src/routes/ticketTypeRoutes.test.ts` — org and ticket INSERTs updated
- `packages/backend/src/routes/userRoutes.test.ts` — org INSERT includes slug

## Errors / Corrections

- Initial ticket test codes exceeded VARCHAR(10) limit — shortened all to <=10 chars

## Ready for Next Run

- All 116 tests pass, coverage >=80%
- Database initializes cleanly with `docker compose -f docker/docker-compose.yml down -v && docker compose -f docker/docker-compose.yml up -d`
