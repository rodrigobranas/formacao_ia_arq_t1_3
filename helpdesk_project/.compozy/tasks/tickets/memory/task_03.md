# Task Memory: task_03.md

Keep only task-local execution context here. Do not duplicate facts that are obvious from the repository, task file, PRD documents, or git history.

## Objective Snapshot

Ticket service core business logic — ticketCodeService.ts and ticketService.ts with full test coverage.

## Important Decisions

- Expanded tickets.code column from VARCHAR(10) to VARCHAR(12) to fit TK-XXXXXXXX format (11 chars). The init.sql and live DB were both updated.
- Reused ValidationError and NotFoundError from ticketTypeService.ts to avoid duplicating error classes.
- Used pg-promise transactions (db.tx) for createTicket (ticket + attachments), forwardTicket (update + history), and addComment (comment + attachments).
- MAX_BASE64_SIZE set to 1,370,000 chars (~1MB decoded) per ADR-003 spec.

## Learnings

- The code column was originally VARCHAR(10) from task_01 but the TechSpec specifies TK- prefix + 8 alphanumeric = 11 chars. Required schema update.
- bcrypt hashes need a realistic-length string for test user creation (60 chars).

## Files / Surfaces

- Created: `packages/backend/src/services/ticketCodeService.ts`
- Created: `packages/backend/src/services/ticketService.ts`
- Created: `packages/backend/src/services/ticketCodeService.test.ts`
- Created: `packages/backend/src/services/ticketService.test.ts`
- Modified: `database/init.sql` — changed VARCHAR(10) to VARCHAR(12) for tickets.code

## Errors / Corrections

- First test run failed: "value too long for type character varying(10)" — fixed by expanding column to VARCHAR(12).

## Ready for Next Run

- ticketService exports: createTicket, listTickets, getTicketById, getTicketByCode, assignTicket, forwardTicket, closeTicket, addComment
- ticketCodeService exports: generateRandomCode, generateUniqueCode
- All 161 tests pass (34 new). Coverage for new files: 97.34%.
