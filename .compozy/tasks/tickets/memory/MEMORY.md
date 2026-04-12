# Workflow Memory

Keep only durable, cross-task context here. Do not duplicate facts that are obvious from the repository, PRD documents, or git history.

## Current State

- Task 01 (Database schema) complete — all 116 tests pass, schema deployed
- Task 02 (Organization slug generation) complete — all 127 tests pass
- Task 03 (Ticket service — core business logic) complete — all 161 tests pass, 97% coverage on new files
- Task 04 (Public ticket routes) complete — all 175 tests pass (14 new), 90% coverage
- Task 05 (Authenticated ticket routes) complete — all 205 tests pass (30 new), 89% coverage
- Task 06 (Public ticket pages) complete — 12 new frontend tests pass
- Task 07 (Operator ticket list page) complete — 10 new frontend tests pass

## Shared Decisions

- Organization slug generation uses exported `generateSlug()` from authService — proper sanitization with uniqueness retry (up to 3 attempts with random suffix)
- SignupResult now includes `slug` in the organization object
- All test helper `createOrganization` functions generate slug from name — downstream tasks can rely on this pattern
- tickets.code column expanded from VARCHAR(10) to VARCHAR(12) to accommodate TK-XXXXXXXX format (11 chars)

## Shared Learnings

- Docker compose file is at `docker/docker-compose.yml` (not project root)
- Ticket code column is VARCHAR(12) — format is TK- + 8 uppercase alphanumeric
- Many test files have local `createOrganization` helpers that insert directly — any organizations schema change requires updating all of them
- ValidationError and NotFoundError are exported from ticketTypeService.ts — reuse them rather than creating duplicates

## Open Risks

- (none currently)

## Handoffs

- task_03+: `generateSlug` is exported from authService if needed elsewhere; slug uniqueness is handled at signup time
- task_04+: ticketService exports createTicket and getTicketByCode for public routes
- task_05+: ticketService exports listTickets, getTicketById, assignTicket, forwardTicket, closeTicket, addComment for authenticated routes
- task_06+: Public routes are `/:orgSlug/tickets/new` and `/:orgSlug/tickets/track`, frontend types for tickets defined in types.ts
- task_07: TicketsPage created at /tickets, calls GET /api/tickets with optional ?status= query, TicketSummary type added to types.ts
- task_08: TicketDetailPage created at /tickets/:id with 20 frontend tests passing, uses data URLs for attachments
